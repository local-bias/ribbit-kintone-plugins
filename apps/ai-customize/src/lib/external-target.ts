import type { ExternalPatternError, InvalidExternalPattern } from '@/schema/asset';
import { MAX_EXTERNAL_PATTERN_BYTES, MAX_EXTERNAL_PATTERNS } from './constants';

/**
 * 外部通信の通信先パターンの正規化と、送信先URLとの一致判定
 *
 * 文字列の前方一致は使わない。`https://api.example.com.evil.example`や`/v10`を通してしまうため、
 * `new URL()`で正規化したうえで、オリジンの完全一致とパスのセグメント境界での前方一致で判定する。
 *
 * @see docs/13-launch-gate-and-permissions.md 3-3-2章
 */

const ALLOWED_PROTOCOLS = new Set(['https:', 'http:']);

const encoder = new TextEncoder();

export type NormalizedPattern =
  | { ok: true; pattern: string; insecure: boolean }
  | { ok: false; reason: ExternalPatternError };

/**
 * 通信先パターン1行を正規化します
 *
 * 正規化後の形は`オリジン + パス`で、オリジンだけの指定はパス`/`になります
 */
export const normalizeExternalPattern = (raw: string): NormalizedPattern => {
  const value = raw.trim();
  if (encoder.encode(value).length > MAX_EXTERNAL_PATTERN_BYTES) {
    return { ok: false, reason: 'too-long' };
  }
  if (value.includes('*')) {
    return { ok: false, reason: 'wildcard' };
  }
  // `new URL()`は末尾だけの`?`や`#`を捨てるため、元の文字列で判定する
  if (value.includes('?')) {
    return { ok: false, reason: 'query' };
  }
  if (value.includes('#')) {
    return { ok: false, reason: 'fragment' };
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { ok: false, reason: 'invalid-url' };
  }
  if (!ALLOWED_PROTOCOLS.has(url.protocol) || url.hostname === '') {
    return { ok: false, reason: 'unsupported-scheme' };
  }
  if (url.username !== '' || url.password !== '' || value.includes('@')) {
    return { ok: false, reason: 'userinfo' };
  }
  return {
    ok: true,
    pattern: `${url.origin}${url.pathname}`,
    insecure: url.protocol === 'http:',
  };
};

export type ParsedExternalPatterns = {
  patterns: string[];
  invalid: InvalidExternalPattern[];
  warnings: { line: number; pattern: string; reason: 'insecure' }[];
};

/** 「通信先」フィールドの1行(空行と`#`で始まるコメント行は含まない) */
export type ExternalUrlLine = {
  /** フィールド内の行番号(1始まり) */
  line: number;
  raw: string;
  result: NormalizedPattern;
};

const LINE_BREAK = /\r\n|\r|\n/;

/**
 * 「通信先」フィールドの値(1行1パターン)を、行ごとに正規化します
 *
 * 上限を超えた行は全て無効にします(一部だけ許可された状態を黙って作らないため、理由を残す)。
 */
export const listExternalUrlLines = (text: string): ExternalUrlLine[] =>
  text
    .split(LINE_BREAK)
    .map((raw, index) => ({ raw: raw.trim(), line: index + 1 }))
    .filter(({ raw }) => raw !== '' && !raw.startsWith('#'))
    .map(({ raw, line }, index) => ({
      raw,
      line,
      result:
        index >= MAX_EXTERNAL_PATTERNS
          ? { ok: false, reason: 'too-many' }
          : normalizeExternalPattern(raw),
    }));

/**
 * 「通信先」フィールドの値(1行1パターン)を解析します
 *
 * 空行と`#`で始まる行は無視します。無効な行は除外し、理由を返します。
 */
export const parseExternalPatterns = (text: string): ParsedExternalPatterns => {
  const patterns = new Set<string>();
  const invalid: InvalidExternalPattern[] = [];
  const warnings: ParsedExternalPatterns['warnings'] = [];
  for (const { raw, line, result } of listExternalUrlLines(text)) {
    if (!result.ok) {
      invalid.push({ line, raw, reason: result.reason });
      continue;
    }
    patterns.add(result.pattern);
    if (result.insecure) {
      warnings.push({ line, pattern: result.pattern, reason: 'insecure' });
    }
  }
  return { patterns: [...patterns], invalid, warnings };
};

export type AppendExternalPatternResult =
  | { ok: true; text: string; pattern: string }
  | { ok: false; reason: ExternalPatternError | 'duplicate' };

/**
 * 通信先を末尾に1行追加します(正規化した形で書く。コメントや他の行はそのまま残す)
 */
export const appendExternalPattern = (text: string, raw: string): AppendExternalPatternResult => {
  const normalized = normalizeExternalPattern(raw);
  if (!normalized.ok) {
    return normalized;
  }
  const lines = listExternalUrlLines(text);
  if (lines.some(({ result }) => result.ok && result.pattern === normalized.pattern)) {
    return { ok: false, reason: 'duplicate' };
  }
  if (lines.length >= MAX_EXTERNAL_PATTERNS) {
    return { ok: false, reason: 'too-many' };
  }
  const base = text.replace(/\s+$/, '');
  return {
    ok: true,
    text: base === '' ? normalized.pattern : `${base}\n${normalized.pattern}`,
    pattern: normalized.pattern,
  };
};

/** 指定した行(1始まり)を取り除きます。範囲外なら元の値を返す */
export const removeExternalLine = (text: string, line: number): string => {
  const lines = text.split(LINE_BREAK);
  if (line < 1 || line > lines.length) {
    return text;
  }
  return lines.filter((_, index) => index !== line - 1).join('\n');
};

/** パスがパターンのパスに、セグメント境界で前方一致するか */
const matchesPath = (targetPath: string, patternPath: string): boolean => {
  if (patternPath === '/') {
    return true;
  }
  const base = patternPath.endsWith('/') ? patternPath.slice(0, -1) : patternPath;
  return targetPath === base || targetPath.startsWith(`${base}/`);
};

/**
 * 送信先URLが、正規化済みの通信先パターンのいずれかに一致するか判定します
 *
 * - 絶対URLでなければ一致しない(相対URLをkintoneのオリジン基準で解決しない)
 * - ユーザー情報を含むURLは一致しない
 * - オリジン(スキーム・ホスト・ポート)は完全一致
 * - パスは正規化後に、セグメント境界で前方一致
 * - クエリとフラグメントは判定に使わない
 */
export const matchExternalTarget = (target: string, patterns: readonly string[]): boolean => {
  let url: URL;
  try {
    url = new URL(target);
  } catch {
    return false;
  }
  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    return false;
  }
  if (url.username !== '' || url.password !== '') {
    return false;
  }
  return patterns.some((raw) => {
    let pattern: URL;
    try {
      pattern = new URL(raw);
    } catch {
      return false;
    }
    return pattern.origin === url.origin && matchesPath(url.pathname, pattern.pathname);
  });
};

/**
 * コードから読み取った参照先が外部通信になるなら、その絶対URLを返します
 *
 * CSSの`url()`とJSの`src`などで同じ基準を使う。
 *
 * - 相対URL・`data:`・`#`で始まる参照・kintoneと同一オリジンは外部通信ではない(`undefined`)
 * - http(s)以外のスキームや解釈できない値、組み立てられて読み取れない値(`null`)は、送信先を判定できない外部通信(`null`)
 *
 * @param origin kintoneのオリジン(`location.origin`)
 */
export const resolveExternalReference = (
  value: string | null,
  origin: string
): string | null | undefined => {
  if (value === null) {
    return null;
  }
  const trimmed = value.trim();
  if (trimmed === '' || trimmed.startsWith('#') || /^data:/i.test(trimmed)) {
    return undefined;
  }
  let url: URL;
  try {
    url = new URL(trimmed, `${origin}/`);
  } catch {
    return null;
  }
  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    return null;
  }
  return url.origin === new URL(origin).origin ? undefined : url.href;
};

/**
 * 拒否エラーや診断に載せるための、送信先URLの表示用文字列
 *
 * クエリには業務データが載りうるため、オリジンとパスだけを返します
 */
export const describeExternalTarget = (target: string): string => {
  try {
    const url = new URL(target);
    return `${url.origin}${url.pathname}`;
  } catch {
    return '(invalid URL)';
  }
};

/**
 * 送信先URLを、照合と送信に使う正規形へ変換します。曖昧な形なら`null`
 *
 * 照合はWHATWG URLで行うが、送信先のサーバーは別のパーサーで解釈しうる。
 * 解釈が割れる形(`\\`・制御文字・空白、パス中の`%2f` `%5c`)は拒否し、照合した正規形を送信する
 */
export const toCanonicalRequestUrl = (raw: string): string | null => {
  // biome-ignore lint/suspicious/noControlCharactersInRegex: 制御文字を拒否するため
  if (/[\\\u0000-\u0020\u007f]/.test(raw)) {
    return null;
  }
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (!ALLOWED_PROTOCOLS.has(url.protocol) || /%(?:2f|5c)/i.test(url.pathname)) {
    return null;
  }
  return url.href;
};

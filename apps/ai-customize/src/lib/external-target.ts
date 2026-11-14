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

/**
 * 「通信先」フィールドの値(1行1パターン)を解析します
 *
 * 空行と`#`で始まる行は無視します。無効な行は除外し、理由を返します。
 * 上限を超えた行は全て無効にします(一部だけ許可された状態を黙って作らないため、理由を残す)。
 */
export const parseExternalPatterns = (text: string): ParsedExternalPatterns => {
  const entries = text
    .split(/\r\n|\r|\n/)
    .map((raw, index) => ({ raw: raw.trim(), line: index + 1 }))
    .filter(({ raw }) => raw !== '' && !raw.startsWith('#'));

  const patterns = new Set<string>();
  const invalid: InvalidExternalPattern[] = [];
  const warnings: ParsedExternalPatterns['warnings'] = [];
  entries.forEach(({ raw, line }, index) => {
    if (index >= MAX_EXTERNAL_PATTERNS) {
      invalid.push({ line, raw, reason: 'too-many' });
      return;
    }
    const result = normalizeExternalPattern(raw);
    if (!result.ok) {
      invalid.push({ line, raw, reason: result.reason });
      return;
    }
    patterns.add(result.pattern);
    if (result.insecure) {
      warnings.push({ line, pattern: result.pattern, reason: 'insecure' });
    }
  });
  return { patterns: [...patterns], invalid, warnings };
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

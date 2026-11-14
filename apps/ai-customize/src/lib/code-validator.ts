import type { AssetKind } from '@/schema/asset';
import { listAssetUsage, summarizePermissionUsage } from './asset-usage';
import { detectJsCapabilityUsage } from './capability-detector';
import { MAX_CODE_BYTES } from './constants';
import {
  describeExternalTarget,
  matchExternalTarget,
  normalizeExternalPattern,
} from './external-target';
import { normalizeKintonePath } from './kintone-request-classifier';

/**
 * AIが登録しようとしたコードを、保存する前に検証します(純粋関数)
 *
 * 承認カードと`write_asset`の実行で同じ関数を使う(画面で見せた判定と、保存時の判定を分けない)。
 * - `errors`: 保存を拒否し、理由をAIへ返して直させる
 * - `warnings`: 保存はするが、承認カードに出して利用者に判断させる
 *
 * 静的な検査は「うっかり」を止めるためのもので、悪意ある難読化は止められない(docs/13 3-1章)
 *
 * @see docs/07-ai-tools.md 4-10章
 */

/** AIが要求できる書き込み権限(「制限なし」と「外部通信(すべて)」は人が詳細画面で付ける) */
export const AI_WRITE_PERMISSIONS = ['post', 'put', 'delete'] as const;
export type AiWritePermission = (typeof AI_WRITE_PERMISSIONS)[number];

export type ValidationError =
  | { type: 'empty' }
  | { type: 'too-large'; bytes: number }
  | { type: 'syntax'; message: string }
  /** 権限の制御を迂回できる書き方(`fetch`・`window.kintone`など) */
  | { type: 'bypass'; pattern: string; line: number }
  /** 使っているのに宣言していない書き込み権限 */
  | { type: 'missing-permission'; permission: AiWritePermission; lines: number[] }
  /** AIからは付けられない「制限なし」が要る呼び出し(アプリ設定の変更など) */
  | { type: 'requires-unrestricted'; lines: number[] }
  | { type: 'invalid-external-url'; raw: string; reason: string }
  /** コードが文字列で書いた送信先が、`externalUrls`に無い */
  | { type: 'unregistered-target'; target: string; lines: number[] }
  /** 組み立てた送信先の読み込み(`img.src = base + path`など)。「指定先のみ」では実行されない */
  | { type: 'dynamic-resource'; lines: number[] }
  /**
   * 見えない文字(双方向の制御文字・ゼロ幅文字・JSが改行として扱うU+2028/U+2029)
   *
   * 承認画面で見えるコードと、実際に解釈されるコードがずれうる(Trojan Source)
   */
  | { type: 'invisible-characters'; lines: number[] };

export type ValidationWarning =
  | { type: 'unused-permission'; permission: AiWritePermission }
  | { type: 'unused-external-url'; pattern: string }
  /** メソッドやパスが変数の`kintone.api`。必要な権限は実行時に判定する */
  | { type: 'dynamic-api'; lines: number[] }
  /** 送信先を組み立てる`kintone.proxy`。通信先に一致するかは実行時に判定する */
  | { type: 'dynamic-external'; lines: number[] }
  /** 複数レコードの更新・削除、`bulkRequest` */
  | { type: 'bulk-operation'; lines: number[] }
  /** 認証情報らしき文字列 */
  | { type: 'credential'; lines: number[] }
  /** `http:`の通信先(暗号化されない) */
  | { type: 'insecure-external-url'; pattern: string };

export type CodeValidation = {
  errors: ValidationError[];
  warnings: ValidationWarning[];
  /** 正規化した通信先(重複を除く。無効なものは含めない) */
  externalUrls: string[];
};

export type CodeValidationInput = {
  kind: AssetKind;
  code: string;
  permissions: readonly AiWritePermission[];
  externalUrls: readonly string[];
  /** kintoneのオリジン(`location.origin`) */
  origin: string;
  /** JSの構文を検査します。問題が無ければ`null`、あればエラーの説明 */
  checkJsSyntax: (code: string) => string | null;
};

const encoder = new TextEncoder();

/** 認証ヘッダーの名前 */
const CREDENTIAL_HEADER = /\b(?:authorization|x-cybozu-api-token|x-cybozu-authorization)\b/i;

/** 長いランダムな文字列(APIキーやトークンらしきもの)。英字と数字の両方を含む32文字以上 */
const LONG_TOKEN = /["'`]([A-Za-z0-9_\-+/=]{32,})["'`]/g;

const looksLikeToken = (value: string): boolean => /[A-Za-z]/.test(value) && /\d/.test(value);

/** 認証情報らしき文字列を含む行(CSSは対象外) */
const findCredentialLines = (code: string): number[] =>
  code.split(/\r\n|\r|\n/).flatMap((line, index) => {
    const hasToken = [...line.matchAll(LONG_TOKEN)].some(([, value]) =>
      looksLikeToken(value ?? '')
    );
    return CREDENTIAL_HEADER.test(line) || hasToken ? [index + 1] : [];
  });

const BULK_PATHS = new Set(['/k/v1/records', '/k/v1/bulkRequest']);

/** 複数レコードをまとめて変える`kintone.api`の行 */
const findBulkLines = (code: string, origin: string): number[] =>
  detectJsCapabilityUsage(code).apiCalls.flatMap(({ method, path, line }) => {
    if (path === null) return [];
    const normalized = normalizeKintonePath(path, origin);
    if (normalized === '/k/v1/bulkRequest') return [line];
    return normalized !== null &&
      BULK_PATHS.has(normalized) &&
      (method === 'PUT' || method === 'DELETE')
      ? [line]
      : [];
  });

/** 双方向の制御文字・ゼロ幅文字・BOM・行区切り/段落区切り */
const INVISIBLE_CHARACTERS = /[\u200B-\u200D\u2028\u2029\u202A-\u202E\u2066-\u2069\uFEFF]/;

/** 見えない文字を含む行(画面の行と同じく`\r\n` `\r` `\n`で区切る) */
const findInvisibleLines = (code: string): number[] =>
  code
    .split(/\r\n|\r|\n/)
    .flatMap((line, index) => (INVISIBLE_CHARACTERS.test(line) ? [index + 1] : []));

const unique = (values: readonly number[]): number[] => [...new Set(values)].sort((a, b) => a - b);

/** 通信先を正規化します。無効なものはエラーにする */
const normalizeUrls = (
  raws: readonly string[]
): { urls: string[]; errors: ValidationError[]; warnings: ValidationWarning[] } => {
  const urls: string[] = [];
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  for (const raw of raws) {
    const normalized = normalizeExternalPattern(raw);
    if (!normalized.ok) {
      errors.push({ type: 'invalid-external-url', raw, reason: normalized.reason });
      continue;
    }
    if (urls.includes(normalized.pattern)) continue;
    urls.push(normalized.pattern);
    if (normalized.insecure) {
      warnings.push({ type: 'insecure-external-url', pattern: normalized.pattern });
    }
  }
  return { urls, errors, warnings };
};

/** 外部の送信先の照合(JSの`kintone.proxy`と読み込み、CSSの`url()`/`@import`) */
const checkExternalTargets = (
  usage: ReturnType<typeof listAssetUsage>,
  urls: readonly string[]
): { errors: ValidationError[]; warnings: ValidationWarning[] } => {
  const unregistered = new Map<string, number[]>();
  const used = new Set<string>();
  const dynamicResources: number[] = [];
  const dynamicProxies: number[] = [];
  for (const item of usage) {
    if (item.type !== 'proxy' && item.type !== 'resource') continue;
    if (item.target === null) {
      (item.type === 'proxy' ? dynamicProxies : dynamicResources).push(item.line);
      continue;
    }
    const matched = urls.filter((url) => matchExternalTarget(item.target as string, [url]));
    if (matched.length === 0) {
      const target = describeExternalTarget(item.target);
      unregistered.set(target, [...(unregistered.get(target) ?? []), item.line]);
    }
    for (const url of matched) used.add(url);
  }
  const errors: ValidationError[] = [
    ...[...unregistered].map(
      ([target, lines]): ValidationError => ({ type: 'unregistered-target', target, lines })
    ),
    ...(dynamicResources.length > 0
      ? [{ type: 'dynamic-resource' as const, lines: unique(dynamicResources) }]
      : []),
  ];
  // 送信先を組み立てる`kintone.proxy`があれば、どの通信先を使うかは静的に分からない
  const warnings: ValidationWarning[] = [
    ...(dynamicProxies.length > 0
      ? [{ type: 'dynamic-external' as const, lines: unique(dynamicProxies) }]
      : urls
          .filter((url) => !used.has(url))
          .map((pattern): ValidationWarning => ({ type: 'unused-external-url', pattern }))),
  ];
  return { errors, warnings };
};

/** 宣言した書き込み権限と、コードでの使用の照合(JSのみ) */
const checkPermissions = (
  usage: ReturnType<typeof listAssetUsage>,
  permissions: readonly AiWritePermission[]
): { errors: ValidationError[]; warnings: ValidationWarning[] } => {
  const summary = summarizePermissionUsage(usage);
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const dynamicLines = unique(summary.post.dynamicLines);
  for (const permission of AI_WRITE_PERMISSIONS) {
    const { lines } = summary[permission];
    const declared = permissions.includes(permission);
    if (lines.length > 0 && !declared) {
      // ファイルのアップロードは追加・更新のどちらかで足りる
      const alternative = permission === 'post' ? 'put' : permission === 'put' ? 'post' : null;
      const covered = lines.filter(
        (line) =>
          alternative !== null &&
          permissions.includes(alternative) &&
          summary[alternative].lines.includes(line)
      );
      const missing = lines.filter((line) => !covered.includes(line));
      if (missing.length > 0) {
        errors.push({ type: 'missing-permission', permission, lines: unique(missing) });
      }
    }
    if (declared && lines.length === 0 && dynamicLines.length === 0) {
      warnings.push({ type: 'unused-permission', permission });
    }
  }
  const unrestrictedApi = usage.filter(
    (item) => item.type === 'api' && item.requirements?.includes('unrestricted')
  );
  if (unrestrictedApi.length > 0) {
    errors.push({
      type: 'requires-unrestricted',
      lines: unique(unrestrictedApi.map(({ line }) => line)),
    });
  }
  if (dynamicLines.length > 0) {
    warnings.push({ type: 'dynamic-api', lines: dynamicLines });
  }
  return { errors, warnings };
};

export const validateAssetCode = (input: CodeValidationInput): CodeValidation => {
  const { kind, code, origin } = input;
  const { urls, errors: urlErrors, warnings: urlWarnings } = normalizeUrls(input.externalUrls);
  if (code.trim() === '') {
    return { errors: [{ type: 'empty' }, ...urlErrors], warnings: urlWarnings, externalUrls: urls };
  }
  const bytes = encoder.encode(code).length;
  if (bytes > MAX_CODE_BYTES) {
    // 大きすぎるコードは走査しない(検査の時間を上限で抑える)
    return {
      errors: [{ type: 'too-large', bytes }, ...urlErrors],
      warnings: urlWarnings,
      externalUrls: urls,
    };
  }

  const invisibleLines = findInvisibleLines(code);
  const invisible: ValidationError[] =
    invisibleLines.length > 0 ? [{ type: 'invisible-characters', lines: invisibleLines }] : [];
  const usage = listAssetUsage({ kind, code }, origin);
  const external = checkExternalTargets(usage, urls);
  if (kind === 'css') {
    return {
      errors: [...invisible, ...urlErrors, ...external.errors],
      warnings: [...urlWarnings, ...external.warnings],
      externalUrls: urls,
    };
  }

  const syntax = input.checkJsSyntax(code);
  const bypass = usage.flatMap((item): ValidationError[] =>
    item.type === 'bypass' ? [{ type: 'bypass', pattern: item.pattern, line: item.line }] : []
  );
  const permissions = checkPermissions(usage, input.permissions);
  const bulkLines = findBulkLines(code, origin);
  const credentialLines = findCredentialLines(code);
  return {
    errors: [
      ...invisible,
      ...(syntax === null ? [] : [{ type: 'syntax' as const, message: syntax }]),
      ...bypass,
      ...permissions.errors,
      ...urlErrors,
      ...external.errors,
    ],
    warnings: [
      ...permissions.warnings,
      ...urlWarnings,
      ...external.warnings,
      ...(bulkLines.length > 0 ? [{ type: 'bulk-operation' as const, lines: bulkLines }] : []),
      ...(credentialLines.length > 0
        ? [{ type: 'credential' as const, lines: credentialLines }]
        : []),
    ],
    externalUrls: urls,
  };
};

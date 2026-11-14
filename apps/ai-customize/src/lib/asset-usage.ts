import type { Asset } from '@/schema/asset';
import { type ApiMethod, detectJsCapabilityUsage } from './capability-detector';
import { detectCssExternalReferences } from './css-detector';
import {
  describeExternalTarget,
  matchExternalTarget,
  normalizeExternalPattern,
  resolveExternalReference,
} from './external-target';
import {
  classifyKintoneRequest,
  normalizeKintonePath,
  type Requirement,
} from './kintone-request-classifier';

/**
 * 詳細画面に出す「コードの中の、権限が必要な操作」の一覧(純粋関数)
 *
 * 読み取り(GET)は常に許可なので出さない。行番号順に並べる
 *
 * @see docs/06-ui.md 5章「権限(カスタマイズ単位)」
 */

/**
 * `kintone.api`の呼び出しに要る権限
 *
 * 実行時にファサードが使う`classifyKintoneRequest`と同じ表で決める(画面と強制の基準を分けない)。
 * メソッド・パスが変数の呼び出しと`bulkRequest`(中身が静的に分からない)は`null`(実行時に判定)
 */
export type ApiRequirement = Exclude<Requirement, 'read'>;

export type AssetUsage =
  | {
      type: 'api';
      method: ApiMethod;
      requirements: readonly ApiRequirement[] | null;
      line: number;
    }
  | { type: 'proxy'; target: string | null; line: number }
  | { type: 'resource'; target: string | null; line: number }
  | { type: 'bypass'; pattern: string; line: number };

/** 読み取りだけなら空配列、静的に判定できなければ`null` */
const classifyApiCall = (
  method: ApiMethod,
  path: string | null,
  origin: string
): ApiRequirement[] | null => {
  if (method === 'GET') return [];
  if (method === 'unknown' || path === null) return null;
  if (normalizeKintonePath(path, origin) === '/k/v1/bulkRequest') return null;
  return classifyKintoneRequest(path, method, undefined, origin).filter(
    (requirement): requirement is ApiRequirement => requirement !== 'read'
  );
};

const listJsUsage = (code: string, origin: string): AssetUsage[] => {
  const usage = detectJsCapabilityUsage(code);
  return [
    ...usage.apiCalls.flatMap(({ method, path, line }): AssetUsage[] => {
      const requirements = classifyApiCall(method, path, origin);
      return requirements !== null && requirements.length === 0
        ? []
        : [{ type: 'api', method, requirements, line }];
    }),
    ...usage.external.map(({ target, line }): AssetUsage => ({ type: 'proxy', target, line })),
    ...usage.resources.flatMap(({ target, line }): AssetUsage[] => {
      const resolved = resolveExternalReference(target, origin);
      return resolved === undefined ? [] : [{ type: 'resource', target: resolved, line }];
    }),
    ...usage.bypass.map(({ pattern, line }): AssetUsage => ({ type: 'bypass', pattern, line })),
  ];
};

export const listAssetUsage = (asset: Pick<Asset, 'kind' | 'code'>, origin: string): AssetUsage[] =>
  (asset.kind === 'js'
    ? listJsUsage(asset.code, origin)
    : detectCssExternalReferences(asset.code, origin).map(
        ({ target, line }): AssetUsage => ({ type: 'resource', target, line })
      )
  ).sort((a, b) => a.line - b.line);

/** ある権限を使う箇所。`dynamicLines`は静的に判定できず、実行時に判定する行 */
export type PermissionUsage = { lines: number[]; dynamicLines: number[] };

export type PermissionUsageSummary = Record<
  'post' | 'put' | 'delete' | 'external' | 'unrestricted',
  PermissionUsage
>;

/**
 * 権限スイッチの横に出す「その権限を使う行」を、権限ごとにまとめます
 *
 * 静的に判定できない`kintone.api`は、追加・更新・削除のどれにもなりうるため3つ全てに`dynamicLines`として出す。
 * アプリ設定の変更など、ファサードが「制限なし」を要求する呼び出しは`unrestricted`に出す
 */
export const summarizePermissionUsage = (usage: readonly AssetUsage[]): PermissionUsageSummary => {
  const summary: PermissionUsageSummary = {
    post: { lines: [], dynamicLines: [] },
    put: { lines: [], dynamicLines: [] },
    delete: { lines: [], dynamicLines: [] },
    external: { lines: [], dynamicLines: [] },
    unrestricted: { lines: [], dynamicLines: [] },
  };
  for (const item of usage) {
    switch (item.type) {
      case 'api':
        if (item.requirements === null) {
          for (const key of ['post', 'put', 'delete'] as const) {
            summary[key].dynamicLines.push(item.line);
          }
          break;
        }
        for (const requirement of item.requirements) {
          // ファイルのアップロードは、追加・更新のどちらかがあればよい
          const keys = requirement === 'post-or-put' ? (['post', 'put'] as const) : [requirement];
          for (const key of keys) summary[key].lines.push(item.line);
        }
        break;
      case 'proxy':
      case 'resource':
        (item.target === null ? summary.external.dynamicLines : summary.external.lines).push(
          item.line
        );
        break;
      case 'bypass':
        summary.unrestricted.lines.push(item.line);
        break;
    }
  }
  return summary;
};

/** コードがリテラルで使っているのに、通信先に無い送信先 */
export type UnregisteredTarget = {
  /** 通信先へ追加するときのパターン(クエリを除いた`オリジン + パス`) */
  pattern: string;
  lines: number[];
};

/**
 * 通信先に無い外部の送信先を、追加候補として返します
 *
 * 送信先を組み立てている呼び出し(`target: null`)は候補にしない(実行時に判定する)
 */
export const findUnregisteredTargets = (
  usage: readonly AssetUsage[],
  patterns: readonly string[]
): UnregisteredTarget[] => {
  const byPattern = new Map<string, number[]>();
  for (const item of usage) {
    if ((item.type !== 'proxy' && item.type !== 'resource') || item.target === null) continue;
    if (matchExternalTarget(item.target, patterns)) continue;
    const normalized = normalizeExternalPattern(describeExternalTarget(item.target));
    if (!normalized.ok) continue;
    byPattern.set(normalized.pattern, [...(byPattern.get(normalized.pattern) ?? []), item.line]);
  }
  return [...byPattern].map(([pattern, lines]) => ({ pattern, lines }));
};

/**
 * JSの文字列にある外部URL(リンクなど)
 *
 * 画面遷移などは実行時に制御されないため、レビューの参考として詳細画面に出す(docs/06 5章)
 */
export const listUrlLiterals = (
  asset: Pick<Asset, 'kind' | 'code'>
): { url: string; line: number }[] =>
  asset.kind === 'js' ? detectJsCapabilityUsage(asset.code).urlLiterals : [];

import type { CapabilityPolicyResult } from './asset-filter';
import type { AssetMappingError } from './asset-mapper';
import type { AssetLoadError } from './asset-repository';
import type { PermissionDenial } from './permission-error';

/**
 * 実行時の出来事の記録
 *
 * サーバーへは送らない(docs/08-security.md 5章)。ランチャーと画面の通知、コンソールで使う。
 */
export type DiagnosticEntry =
  | { kind: 'mapping-skipped'; assetId: string; reason: AssetMappingError }
  | { kind: 'load-failed'; error: AssetLoadError }
  | { kind: 'gate-timeout' }
  | {
      kind: 'blocked';
      assetId: string;
      policy: Exclude<CapabilityPolicyResult, { allowed: true }>;
    }
  | { kind: 'evaluation-failed'; assetId: string; error: unknown }
  | { kind: 'slow-evaluation'; assetId: string; ms: number }
  | { kind: 'handler-failed'; assetId: string; eventType: string; error: unknown }
  | { kind: 'suspended'; assetId: string }
  | { kind: 'permission-denied'; denial: PermissionDenial }
  | { kind: 'rejected-event-type'; assetId: string; eventType: unknown }
  | { kind: 'ignored-thenable'; assetId: string; eventType: string };

export type Diagnostics = {
  record: (entry: DiagnosticEntry) => void;
  entries: () => readonly DiagnosticEntry[];
  /** サーキットブレーカーで止めたアセットか */
  isSuspended: (assetId: string) => boolean;
};

export type DiagnosticsOptions = {
  /** 同一アセットのハンドラ例外がこの回数に達したら、そのタブでの配信を止める */
  circuitBreakerThreshold: number;
  onRecord: (entry: DiagnosticEntry) => void;
};

export const createDiagnostics = (options: DiagnosticsOptions): Diagnostics => {
  let entries: DiagnosticEntry[] = [];
  const failureCounts = new Map<string, number>();
  const suspended = new Set<string>();

  const push = (entry: DiagnosticEntry) => {
    entries = [...entries, entry];
    options.onRecord(entry);
  };

  const record = (entry: DiagnosticEntry) => {
    push(entry);
    if (entry.kind !== 'handler-failed' || suspended.has(entry.assetId)) {
      return;
    }
    const count = (failureCounts.get(entry.assetId) ?? 0) + 1;
    failureCounts.set(entry.assetId, count);
    if (count >= options.circuitBreakerThreshold) {
      suspended.add(entry.assetId);
      push({ kind: 'suspended', assetId: entry.assetId });
    }
  };

  return {
    record,
    entries: () => entries,
    isSuspended: (assetId) => suspended.has(assetId),
  };
};

/** 利用者に知らせるべき問題の件数(アセット単位)を数えます */
export const summarizeDiagnostics = (
  entries: readonly DiagnosticEntry[]
): { failedAssetIds: string[]; deniedAssetIds: string[]; blockedAssetIds: string[] } => {
  const collect = (predicate: (entry: DiagnosticEntry) => string | null): string[] => [
    ...new Set(entries.map(predicate).filter((id): id is string => id !== null)),
  ];
  return {
    failedAssetIds: collect((entry) =>
      entry.kind === 'evaluation-failed' || entry.kind === 'handler-failed' ? entry.assetId : null
    ),
    deniedAssetIds: collect((entry) =>
      entry.kind === 'permission-denied' ? entry.denial.assetId : null
    ),
    blockedAssetIds: collect((entry) => (entry.kind === 'blocked' ? entry.assetId : null)),
  };
};

/** 一覧の行に出す、アセットごとの問題の種類 */
export type AssetProblem = 'failed' | 'denied' | 'blocked' | 'suspended' | 'skipped';

const toProblem = (entry: DiagnosticEntry): [string, AssetProblem] | null => {
  switch (entry.kind) {
    case 'evaluation-failed':
    case 'handler-failed':
      return [entry.assetId, 'failed'];
    case 'permission-denied':
      return [entry.denial.assetId, 'denied'];
    case 'blocked':
      return [entry.assetId, 'blocked'];
    case 'suspended':
      return [entry.assetId, 'suspended'];
    case 'mapping-skipped':
      return [entry.assetId, 'skipped'];
    default:
      return null;
  }
};

/** アセットごとに、起きた問題の種類を重複なく返します */
export const collectAssetProblems = (
  entries: readonly DiagnosticEntry[]
): Map<string, AssetProblem[]> => {
  const problems = new Map<string, AssetProblem[]>();
  for (const entry of entries) {
    const found = toProblem(entry);
    if (found === null) continue;
    const [assetId, problem] = found;
    const current = problems.get(assetId) ?? [];
    if (!current.includes(problem)) problems.set(assetId, [...current, problem]);
  }
  return problems;
};

/**
 * そのアセットで止めた操作を、同じ内容ごとにまとめて件数にします
 *
 * 1ページの表示中に同じ拒否を何十件も並べないため(docs/06-ui.md 5章「拒否の記録」)
 */
export const groupDenials = (
  entries: readonly DiagnosticEntry[],
  assetId: string
): { denial: PermissionDenial; count: number }[] => {
  const groups = new Map<string, { denial: PermissionDenial; count: number }>();
  for (const entry of entries) {
    if (entry.kind !== 'permission-denied' || entry.denial.assetId !== assetId) continue;
    const { operation, method, target, required } = entry.denial;
    const key = JSON.stringify([operation, method, target, required]);
    const current = groups.get(key);
    groups.set(key, { denial: current?.denial ?? entry.denial, count: (current?.count ?? 0) + 1 });
  }
  return [...groups.values()];
};

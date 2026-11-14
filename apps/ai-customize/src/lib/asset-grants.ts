import type { AssetPermission } from '@/schema/asset';
import type { AssetGrants } from './asset-filter';

/**
 * 詳細画面の権限スイッチで、付与済みの権限を組み替えます(純粋関数)
 *
 * 外部通信は「禁止 / 指定先のみ / すべて」の3択で、`external-listed`と`external-all`は同時に持たない。
 *
 * @see docs/06-ui.md 5章「権限(カスタマイズ単位)」、docs/13-launch-gate-and-permissions.md 3章
 */

export type ExternalMode = 'none' | 'listed' | 'all';

/** スイッチで付け外しする権限(外部通信は3択で扱う) */
export const SWITCH_PERMISSIONS = ['post', 'put', 'delete', 'unrestricted'] as const;
export type SwitchPermission = (typeof SWITCH_PERMISSIONS)[number];

/** 保存するときの並び順(管理アプリの選択肢の順) */
const CANONICAL_ORDER: readonly AssetPermission[] = [
  'post',
  'put',
  'delete',
  'external-listed',
  'external-all',
  'unrestricted',
];

const canonicalize = (permissions: ReadonlySet<AssetPermission>): AssetPermission[] =>
  CANONICAL_ORDER.filter((permission) => permissions.has(permission));

/** 両方あるときは狭いほう(指定先のみ)として扱う。読み込み時の`asset-mapper`と同じ規則 */
export const externalModeOf = (permissions: readonly AssetPermission[]): ExternalMode => {
  if (permissions.includes('external-listed')) return 'listed';
  if (permissions.includes('external-all')) return 'all';
  return 'none';
};

export const withPermission = (
  permissions: readonly AssetPermission[],
  permission: SwitchPermission,
  granted: boolean
): AssetPermission[] => {
  const next = new Set(permissions);
  if (granted) next.add(permission);
  else next.delete(permission);
  return canonicalize(next);
};

export const withExternalMode = (
  permissions: readonly AssetPermission[],
  mode: ExternalMode
): AssetPermission[] => {
  const next = new Set(permissions);
  next.delete('external-listed');
  next.delete('external-all');
  if (mode === 'listed') next.add('external-listed');
  if (mode === 'all') next.add('external-all');
  return canonicalize(next);
};

const EXTERNAL_RANK: Record<ExternalMode, number> = { none: 0, listed: 1, all: 2 };

/**
 * 変更で、できることが増えるか
 *
 * 増える変更(付与)は確認してから保存する。減る変更(取り消し)は安全側なので確認しない
 */
export const widensPermissions = (
  before: readonly AssetPermission[],
  after: readonly AssetPermission[]
): boolean =>
  SWITCH_PERMISSIONS.some(
    (permission) => after.includes(permission) && !before.includes(permission)
  ) || EXTERNAL_RANK[externalModeOf(after)] > EXTERNAL_RANK[externalModeOf(before)];

/**
 * 実行中のアセットの権限を、狭める方向にだけ変えます
 *
 * パネルで保存した権限はこのタブのファサードへすぐ反映するが、広げる変更は評価済みのコード
 * (保存前の版かもしれない)にまで及ぶため、再読み込みしてから効かせる。
 * パネルの一覧が取得時点より古くても、権限が広がることはない
 *
 * @see docs/13-launch-gate-and-permissions.md 3-7章
 */
export const narrowGrants = (current: AssetGrants, next: AssetGrants): AssetGrants => {
  const currentMode = externalModeOf(current.permissions);
  const nextMode = externalModeOf(next.permissions);
  const mode = EXTERNAL_RANK[nextMode] < EXTERNAL_RANK[currentMode] ? nextMode : currentMode;
  const kept = SWITCH_PERMISSIONS.filter(
    (permission) =>
      current.permissions.includes(permission) && next.permissions.includes(permission)
  );
  const externalUrls =
    currentMode === 'listed' && nextMode === 'listed'
      ? current.externalUrls.filter((url) => next.externalUrls.includes(url))
      : currentMode === 'listed'
        ? current.externalUrls
        : next.externalUrls;
  return { permissions: withExternalMode(kept, mode), externalUrls };
};

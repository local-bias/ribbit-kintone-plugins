import type { Asset, AssetScreen } from '@/schema/asset';
import type { TargetCoordinate } from './asset-query';
import { detectJsCapabilityUsage } from './capability-detector';
import { MAX_ASSETS_PER_APP, MAX_TOTAL_CODE_BYTES } from './constants';
import { detectCssExternalReferences } from './css-detector';
import { matchExternalTarget } from './external-target';

/**
 * アセットの適用判定(純粋関数)
 *
 * 影響範囲の判定を間違えると「他人のカスタマイズが自分の画面で動く」事故になるため、必ず単体テストする。
 *
 * @see docs/05-runtime.md 7章
 */

export type ApplyContext = {
  target: TargetCoordinate;
  loginUserCode: string;
  mutedIds: ReadonlySet<string>;
  safeMode: boolean;
};

/**
 * アセットをこのページで適用してよいか判定します(画面種別は問わない)
 */
export const shouldApply = (asset: Asset, ctx: ApplyContext): boolean => {
  if (ctx.safeMode) return false;
  if (!asset.enabled) return false;
  if (ctx.mutedIds.has(asset.id)) return false;
  if (asset.code.trim() === '') return false;
  // クエリで絞っていても、境界ではもう一度確かめる(docs/02 6章)
  if (asset.targetSpaceId !== ctx.target.spaceId) return false;
  if (asset.targetAppId !== ctx.target.appId) return false;
  if (
    asset.scope === 'private' &&
    (asset.ownerCode === '' || asset.ownerCode !== ctx.loginUserCode)
  ) {
    return false;
  }
  return true;
};

/** アセットの適用画面に、指定した画面が含まれるか。空配列は全画面 */
export const isScreenTarget = (asset: Asset, screen: AssetScreen): boolean =>
  asset.screens.length === 0 || asset.screens.includes(screen);

/** 実行順(`order`昇順 → レコードID昇順)に並べた新しい配列を返します */
export const sortAssets = (assets: readonly Asset[]): Asset[] =>
  [...assets].sort((a, b) => a.order - b.order || Number(a.id) - Number(b.id));

export type CapabilityPolicyResult =
  | { allowed: true }
  | { allowed: false; reason: 'bypass'; details: { pattern: string; line: number }[] }
  | { allowed: false; reason: 'external'; details: { target: string | null; line: number }[] };

/** アセットに付与された権限と通信先。実行時に変更されうるため、アセット本体と分けて扱う */
export type AssetGrants = Pick<Asset, 'permissions' | 'externalUrls'>;

/** 外部の送信先が、外部通信の設定で許可されているか */
export const isExternalTargetAllowed = (grants: AssetGrants, target: string | null): boolean => {
  const granted = new Set(grants.permissions);
  if (granted.has('unrestricted') || granted.has('external-all')) {
    return true;
  }
  return (
    granted.has('external-listed') &&
    target !== null &&
    matchExternalTarget(target, grants.externalUrls)
  );
};

/**
 * 権限に関する実行前の判定
 *
 * - JS: 迂回パターンを含むなら「制限なし」が必要
 * - CSS: 外部参照が全て外部通信の設定で許可されている必要がある
 *   (CSSは実行時に迂回できないので、静的判定で足りる)
 *
 * JSの`kintone.api` / `kintone.proxy`は実行時にファサードが判定するため、ここでは止めない。
 *
 * @param origin kintoneのオリジン(`location.origin`)
 */
export const checkCapabilityPolicy = (asset: Asset, origin: string): CapabilityPolicyResult => {
  if (asset.kind === 'js') {
    if (asset.permissions.includes('unrestricted')) {
      return { allowed: true };
    }
    const { bypass } = detectJsCapabilityUsage(asset.code);
    return bypass.length === 0
      ? { allowed: true }
      : { allowed: false, reason: 'bypass', details: bypass };
  }
  const denied = detectCssExternalReferences(asset.code, origin).filter(
    (reference) => !isExternalTargetAllowed(asset, reference.target)
  );
  return denied.length === 0
    ? { allowed: true }
    : { allowed: false, reason: 'external', details: denied };
};

export type AssetSetValidation =
  | { ok: true }
  | { ok: false; reason: 'too-many'; count: number }
  | { ok: false; reason: 'too-large'; bytes: number };

const encoder = new TextEncoder();

/**
 * 取得結果全体が実行上限に収まるか判定します
 *
 * 超過時は一部だけ実行せず、全体を実行しない(依存順が壊れるため。ADR-22)
 *
 * @param assets 取得したアセット(上限+1件まで)
 */
export const validateAssetSet = (assets: readonly Asset[]): AssetSetValidation => {
  if (assets.length > MAX_ASSETS_PER_APP) {
    return { ok: false, reason: 'too-many', count: assets.length };
  }
  const bytes = assets
    .filter((asset) => asset.enabled)
    .reduce((sum, asset) => sum + encoder.encode(asset.code).length, 0);
  return bytes > MAX_TOTAL_CODE_BYTES ? { ok: false, reason: 'too-large', bytes } : { ok: true };
};

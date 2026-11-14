import type { Asset, AssetKind } from '@/schema/asset';
import { type AssetAccess, NO_ACCESS } from './asset-access';
import { sortAssets } from './asset-filter';
import { isEffectivelyEnabled } from './asset-toggle';
import type { AssetProblem } from './diagnostics';

/**
 * ランチャーのパネル(JS / CSS一覧)に出す行を組み立てます(純粋関数)
 *
 * @see docs/06-ui.md 5章
 */

/** パネル用に取得したアセット。表示だけに使う情報を添える */
export type PanelAsset = {
  asset: Asset;
  /** 作成者の表示名 */
  ownerName: string;
  /** 更新日時(ISO 8601)。管理アプリに更新日時フィールドが無ければ`null` */
  updatedAt: string | null;
};

export type AssetRow = PanelAsset & {
  /** スイッチの表示(レコードで有効、かつこのブラウザで無効にしていない) */
  switchedOn: boolean;
  /** このブラウザでだけ無効にしている */
  muted: boolean;
  /** このページで適用している(JSは評価済み、CSSは`<style>`あり) */
  applied: boolean;
  access: AssetAccess;
  problems: readonly AssetProblem[];
};

export const buildAssetRows = (params: {
  assets: readonly PanelAsset[];
  kind: AssetKind;
  mutedIds: ReadonlySet<string>;
  appliedIds: ReadonlySet<string>;
  access: ReadonlyMap<string, AssetAccess>;
  problems: ReadonlyMap<string, readonly AssetProblem[]>;
}): AssetRow[] => {
  const { assets, kind, mutedIds, appliedIds, access, problems } = params;
  const byId = new Map(assets.map((item) => [item.asset.id, item]));
  return sortAssets(
    assets.map((item) => item.asset).filter((asset) => asset.kind === kind)
  ).flatMap((asset) => {
    const item = byId.get(asset.id);
    if (item === undefined) return [];
    const muted = mutedIds.has(asset.id);
    return [
      {
        ...item,
        switchedOn: isEffectivelyEnabled(asset.enabled, muted),
        muted,
        applied: appliedIds.has(asset.id),
        access: access.get(asset.id) ?? NO_ACCESS,
        problems: problems.get(asset.id) ?? [],
      },
    ];
  });
};

/** このページで適用中の件数と全件数 */
export const countApplied = (rows: readonly AssetRow[]): { applied: number; total: number } => ({
  applied: rows.filter((row) => row.applied).length,
  total: rows.length,
});

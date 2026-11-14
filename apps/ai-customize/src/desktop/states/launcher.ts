import { atom } from '@repo/jotai';
import type { AssetAccess } from '@/lib/asset-access';
import type { PanelAsset } from '@/lib/asset-panel';
import { decideToggle } from '@/lib/asset-toggle';
import type { PanelState, PanelTab } from '@/lib/browser-storage';
import type { AssetProblem } from '@/lib/diagnostics';
import { t } from '@/lib/i18n';
import type { RuntimeView } from '@/lib/launcher-status';
import type { Asset } from '@/schema/asset';
import type { LauncherServices, PanelData } from '../launcher/services';

/**
 * ランチャーとパネルの状態
 *
 * @see docs/06-ui.md
 */

/** kintoneとブラウザへの入出力。描画前に1回だけ設定する */
export const servicesAtom = atom<LauncherServices | null>(null);

/** 実行基盤の状態。実行基盤が変化を知らせるたびに差し替える */
export const runtimeViewAtom = atom<RuntimeView>({
  phase: 'loading',
  loadError: null,
  applied: { js: new Set<string>(), css: new Set<string>() },
  diagnostics: [],
  problems: new Map<string, readonly AssetProblem[]>(),
});

const panelStateBaseAtom = atom<PanelState>({ open: false, tab: 'js' });

/** パネルの開閉と選択中のタブ。変更はsessionStorageへ保存し、画面遷移をまたいで維持する */
export const panelStateAtom = atom(
  (get) => get(panelStateBaseAtom),
  (get, set, update: Partial<PanelState>) => {
    const next = { ...get(panelStateBaseAtom), ...update };
    set(panelStateBaseAtom, next);
    get(servicesAtom)?.writePanelState(next);
  }
);

export const openPanelAtom = atom(null, (_get, set, tab: PanelTab) => {
  set(panelStateAtom, { open: true, tab });
  set(selectedAssetIdAtom, null);
});

/** 詳細を開いているアセット */
export const selectedAssetIdAtom = atom<string | null>(null);

/** 一覧を取り直すときに増やす */
export const panelVersionAtom = atom(0);

/** パネルの一覧(無効なものを含む全件とアクセス権)。パネルを開いて初めて取得する */
export const panelDataAtom = atom(async (get): Promise<PanelData | null> => {
  get(panelVersionAtom);
  const services = get(servicesAtom);
  return services === null ? null : services.loadPanel();
});

/** 取得後に、このパネルで更新したアセット(取り直すまでの間、一覧に重ねる) */
export const assetOverridesAtom = atom<ReadonlyMap<string, Asset>>(new Map());

/** このパネルで削除したアセット。一覧から外し、実行基盤へは無効として伝え続ける */
export const deletedAssetsAtom = atom<ReadonlyMap<string, Asset>>(new Map());

/** 一覧のアセットに、このパネルで更新・削除した状態を重ねたもの */
export const panelAssetsAtom = atom(async (get): Promise<PanelAsset[]> => {
  const data = await get(panelDataAtom);
  const overrides = get(assetOverridesAtom);
  const deleted = get(deletedAssetsAtom);
  return (data?.assets ?? []).flatMap((item) => {
    if (deleted.has(item.asset.id)) return [];
    const override = overrides.get(item.asset.id);
    return [override === undefined ? item : { ...item, asset: override }];
  });
});

export const panelAccessAtom = atom(
  async (get): Promise<ReadonlyMap<string, AssetAccess>> =>
    (await get(panelDataAtom))?.access ?? new Map()
);

/** 「全員」に公開できるか。パネルを開いて初めて判定する */
export const canPublishAtom = atom(async (get): Promise<boolean> => {
  const services = get(servicesAtom);
  return services === null ? false : services.loadCanPublish();
});

/** このブラウザでだけ無効にしたアセット */
export const mutedIdsAtom = atom<ReadonlySet<string>>(new Set<string>());

/** 切り替えたが、再読み込みしないと反映されないJSアセット */
export const pendingReloadIdsAtom = atom<ReadonlySet<string>>(new Set<string>());

/** 一覧を取り直します(このパネルで重ねた状態は捨てる。削除したものは覚えておく) */
export const reloadPanelAtom = atom(null, (_get, set) => {
  set(assetOverridesAtom, new Map());
  // 削除したものは取り直した一覧にも無い。実行基盤が取得時の版を戻さないよう、無効として伝え続ける
  set(panelVersionAtom, (version) => version + 1);
});

export type ToggleOutcome = { variant: 'success' | 'info' | 'warning' | 'error'; message: string };

/**
 * パネルでの変更を実行基盤へ伝えます
 *
 * CSSはその場で付け直り、権限はこのタブのファサードへ即時に効く。
 * 評価済みのJSは取り消せず、変更は再読み込みで反映されるため、`reloadJsIds`を再読み込み待ちにする
 */
export const syncRuntimeAtom = atom(
  null,
  async (get, set, params: { mutedIds?: ReadonlySet<string>; reloadJsIds?: readonly string[] }) => {
    const services = get(servicesAtom);
    if (services === null) return;
    const mutedIds = params.mutedIds ?? get(mutedIdsAtom);
    set(mutedIdsAtom, mutedIds);
    const assets = (await get(panelAssetsAtom)).map((item) => item.asset);
    // 削除したものは無効として伝える(一覧に無いものは、実行基盤が取得したものを残すため)
    const deleted = [...get(deletedAssetsAtom).values()].map((asset) => ({
      ...asset,
      enabled: false,
    }));
    services.applyPanelChanges([...assets, ...deleted], mutedIds);
    const reloadJsIds = params.reloadJsIds ?? [];
    if (reloadJsIds.length > 0) {
      set(pendingReloadIdsAtom, (ids) => new Set([...ids, ...reloadJsIds]));
    }
  }
);

const withMute = (ids: ReadonlySet<string>, id: string, muted: boolean): Set<string> => {
  const next = new Set(ids);
  if (muted) next.add(id);
  else next.delete(id);
  return next;
};

/**
 * 有効スイッチを押したときの処理
 *
 * - レコードを編集できれば「状態」を更新する(revisionつき)。競合したら一覧を取り直す
 * - 編集できなければ、このブラウザでだけ無効にする
 * - CSSはその場で付け直す。JSは再評価せず、再読み込みを促す(ADR-3)
 *
 * @see docs/06-ui.md 5章「有効スイッチの挙動」
 */
export const toggleAssetAtom = atom(
  null,
  async (
    get,
    set,
    params: { asset: Asset; muted: boolean; access: AssetAccess }
  ): Promise<ToggleOutcome> => {
    const services = get(servicesAtom);
    if (services === null) {
      return { variant: 'error', message: t('desktop.toggle.failed', '') };
    }
    const { asset, muted, access } = params;
    const title = asset.title || t('desktop.row.untitled');
    const action = decideToggle({ enabled: asset.enabled, muted, access });

    const applyChange = (mutedIds: ReadonlySet<string>) =>
      set(syncRuntimeAtom, { mutedIds, reloadJsIds: asset.kind === 'js' ? [asset.id] : [] });

    switch (action.type) {
      case 'forbidden':
        return {
          variant: 'warning',
          message: t(
            action.reason === 'unavailable'
              ? 'desktop.toggle.unavailable'
              : 'desktop.toggle.noPermission'
          ),
        };
      case 'mute':
      case 'unmute': {
        const next = withMute(get(mutedIdsAtom), asset.id, action.type === 'mute');
        const saved = services.writeMuted(next);
        await applyChange(next);
        if (action.type === 'unmute') {
          return { variant: 'info', message: t('desktop.toggle.unmuted') };
        }
        return {
          variant: 'info',
          message: t(saved ? 'desktop.toggle.muted' : 'desktop.toggle.mutedTabOnly'),
        };
      }
      case 'update-record': {
        const result = await services.updateAsset(asset, { enabled: action.enabled });
        if (result.status === 'error') {
          if (result.reason === 'conflict') {
            set(reloadPanelAtom);
            return { variant: 'warning', message: t('desktop.toggle.conflict') };
          }
          return { variant: 'error', message: t('desktop.toggle.failed', result.message) };
        }
        set(assetOverridesAtom, (overrides) =>
          new Map(overrides).set(asset.id, {
            ...asset,
            enabled: action.enabled,
            revision: result.revision,
          })
        );
        const next = action.unmute
          ? withMute(get(mutedIdsAtom), asset.id, false)
          : get(mutedIdsAtom);
        if (action.unmute) services.writeMuted(next);
        await applyChange(next);
        const key =
          asset.kind === 'js'
            ? action.enabled
              ? 'desktop.toggle.enabledJs'
              : 'desktop.toggle.disabledJs'
            : action.enabled
              ? 'desktop.toggle.enabled'
              : 'desktop.toggle.disabled';
        return { variant: 'success', message: t(key, title) };
      }
    }
  }
);

import { atom } from '@repo/jotai';
import { sortAssets } from '@/lib/asset-filter';
import { widensPermissions } from '@/lib/asset-grants';
import { applyAssetPatch, toNewAssetRecord } from '@/lib/asset-mapper';
import { moveItem, ORDER_STEP, planOrderUpdates } from '@/lib/asset-order';
import type { PanelAsset } from '@/lib/asset-panel';
import type { WriteError } from '@/lib/asset-repository';
import { MAX_ASSETS_PER_APP } from '@/lib/constants';
import { t } from '@/lib/i18n';
import type { Asset, AssetKind, AssetPatch } from '@/schema/asset';
import { assetTitle } from '../components/asset-labels';
import {
  assetOverridesAtom,
  deletedAssetsAtom,
  panelAssetsAtom,
  reloadPanelAtom,
  selectedAssetIdAtom,
  servicesAtom,
  syncRuntimeAtom,
  type ToggleOutcome,
} from './launcher';

/**
 * 詳細画面と一覧での編集(影響範囲・権限・通信先・コード・実行順・複製・削除)
 *
 * どの書き込みもrevisionつき。競合したら一覧を取り直して、他の人の変更を見せる
 *
 * @see docs/06-ui.md 5章
 */

export type EditOutcome = ToggleOutcome;

/**
 * 詳細で編集中のコード。保存前の変更があるかどうかの判定に使う
 *
 * `baseRevision`は編集を始めたときのrevision。一覧の取り直しで他の人の変更が入ったら、
 * そのまま保存すると他の人の変更を黙って上書きするため、保存させない
 */
export type CodeDraft = { assetId: string; code: string; baseRevision: string };

export const codeDraftAtom = atom<CodeDraft | null>(null);

/** 下書きが、いま表示しているアセットより古い版をもとにしている */
export const isStaleDraft = (draft: CodeDraft | null, asset: Asset): boolean =>
  draft !== null && draft.assetId === asset.id && draft.baseRevision !== asset.revision;

/** 保存していないコードの変更がある */
export const hasUnsavedChangesAtom = atom((get) => get(codeDraftAtom) !== null);

/** 並べ替えを保存している間は、次の並べ替えをさせない */
export const reorderingAtom = atom(false);

/** ドラッグ中。キーボードでのドラッグを`Escape`で取り消すとき、パネルまで閉じないようにする */
export const draggingAtom = atom(false);

const noServices: EditOutcome = { variant: 'error', message: t('desktop.edit.failed', '') };

const writeErrorOutcome = (error: WriteError): EditOutcome =>
  error.reason === 'conflict'
    ? { variant: 'warning', message: t('desktop.edit.conflict') }
    : { variant: 'error', message: t('desktop.edit.failed', error.message) };

/**
 * 保存した変更を、このページで再読み込みしないと反映されないか
 *
 * JSは評価済みのものを取り消せない。権限は、取り消し(狭める)ならファサードがすぐに止めるが、
 * 付与は止めていたコードを動かすために再評価が要る。CSSは全てその場で付け直る
 */
const needsReload = (asset: Asset, patch: AssetPatch): boolean => {
  if (asset.kind !== 'js') return false;
  const { permissions, externalUrlsText, ...others } = patch;
  return (
    Object.keys(others).length > 0 ||
    (permissions !== undefined && widensPermissions(asset.permissions, permissions)) ||
    (externalUrlsText !== undefined && addsExternalUrls(asset, externalUrlsText))
  );
};

/** 通信先が増えるか(外すだけなら、このタブのファサードへすぐ効く) */
const addsExternalUrls = (asset: Asset, externalUrlsText: string): boolean =>
  applyAssetPatch(asset, { externalUrlsText }).externalUrls.some(
    (url) => !asset.externalUrls.includes(url)
  );

/**
 * アセットの項目を保存します
 *
 * 「全員」への変更は、画面の抑止に加えてここでも公開権限を確かめる(呼び出し元が増えても抜けないように)
 */
export const saveAssetAtom = atom(
  null,
  async (get, set, params: { asset: Asset; patch: AssetPatch }): Promise<EditOutcome> => {
    const services = get(servicesAtom);
    if (services === null) return noServices;
    const { asset, patch } = params;
    if (
      patch.scope === 'public' &&
      asset.scope !== 'public' &&
      !(await services.loadCanPublish())
    ) {
      return { variant: 'warning', message: t('desktop.scope.noPublish') };
    }
    const draft = get(codeDraftAtom);
    if (patch.code !== undefined && isStaleDraft(draft, asset)) {
      return { variant: 'warning', message: t('desktop.code.stale') };
    }
    const result = await services.updateAsset(asset, patch);
    if (result.status === 'error') {
      if (result.reason === 'conflict') set(reloadPanelAtom);
      return writeErrorOutcome(result);
    }
    set(assetOverridesAtom, (overrides) =>
      new Map(overrides).set(asset.id, {
        ...applyAssetPatch(asset, patch),
        revision: result.revision,
      })
    );
    if (patch.code !== undefined) {
      set(codeDraftAtom, null);
    } else if (draft?.assetId === asset.id && draft.baseRevision === asset.revision) {
      // 自分の保存でrevisionが進んだだけなので、編集中のコードはそのまま新しい版の上で続けてよい
      set(codeDraftAtom, { ...draft, baseRevision: result.revision });
    }
    const reload = needsReload(asset, patch);
    await set(syncRuntimeAtom, { reloadJsIds: reload ? [asset.id] : [] });
    if (patch.scope !== undefined) {
      // 推奨のアクセス権では、公開すると管理者以外は編集できなくなる。操作の可否を取り直す
      set(reloadPanelAtom);
    }
    return {
      variant: 'success',
      message: t(reload ? 'desktop.edit.savedReload' : 'desktop.edit.saved', assetTitle(asset)),
    };
  }
);

/** 一覧の1種別ぶんを、表示と同じ順(実行順)で返します */
const ofKind = (items: readonly PanelAsset[], kind: AssetKind): Asset[] =>
  sortAssets(items.map((item) => item.asset).filter((asset) => asset.kind === kind));

/**
 * 一覧の並び順を変え、実行順を振り直して保存します
 *
 * 画面上は先に並べ替える(楽観的更新)。失敗したら一覧を取り直して、確定した並びを見せる
 */
export const reorderAssetsAtom = atom(
  null,
  async (
    get,
    set,
    params: { kind: AssetKind; from: number; to: number }
  ): Promise<EditOutcome | null> => {
    const services = get(servicesAtom);
    if (services === null) return noServices;
    if (get(reorderingAtom)) return null;
    const moved = moveItem(ofKind(await get(panelAssetsAtom), params.kind), params.from, params.to);
    const updates = planOrderUpdates(moved);
    if (updates.length === 0) return null;

    const byId = new Map(moved.map((asset) => [asset.id, asset]));
    const withOrders = (revisions: ReadonlyMap<string, string>) =>
      set(assetOverridesAtom, (overrides) => {
        const next = new Map(overrides);
        for (const { id, order } of updates) {
          const asset = byId.get(id);
          if (asset)
            next.set(id, { ...asset, order, revision: revisions.get(id) ?? asset.revision });
        }
        return next;
      });

    set(reorderingAtom, true);
    try {
      withOrders(new Map());
      const result = await services.updateOrders(updates);
      if (result.status === 'error') {
        // 一部だけ保存されていることがあるため、元の並びへ戻すのではなくサーバーの状態を取り直す
        set(reloadPanelAtom);
        return writeErrorOutcome(result);
      }
      withOrders(result.revisions);
      await set(syncRuntimeAtom, {
        reloadJsIds: params.kind === 'js' ? updates.map(({ id }) => id) : [],
      });
      return {
        variant: 'success',
        message: t(params.kind === 'js' ? 'desktop.order.savedReload' : 'desktop.order.saved'),
      };
    } finally {
      set(reorderingAtom, false);
    }
  }
);

/** アセットを削除します */
export const deleteAssetAtom = atom(null, async (get, set, asset: Asset): Promise<EditOutcome> => {
  const services = get(servicesAtom);
  if (services === null) return noServices;
  const result = await services.deleteAsset(asset);
  if (result.status === 'error') {
    if (result.reason === 'conflict') set(reloadPanelAtom);
    return writeErrorOutcome(result);
  }
  set(deletedAssetsAtom, (deleted) => new Map(deleted).set(asset.id, asset));
  if (get(selectedAssetIdAtom) === asset.id) set(selectedAssetIdAtom, null);
  if (get(codeDraftAtom)?.assetId === asset.id) set(codeDraftAtom, null);
  await set(syncRuntimeAtom, { reloadJsIds: asset.kind === 'js' ? [asset.id] : [] });
  return {
    variant: 'success',
    message: t(
      asset.kind === 'js' ? 'desktop.edit.deletedJs' : 'desktop.edit.deleted',
      assetTitle(asset)
    ),
  };
});

/**
 * アセットを複製します
 *
 * 複製は「自分だけ・無効」で作り、一覧の末尾に置く(誰の画面でもすぐには動かさない)。
 * 作成者は複製した人になる。コードが同じなので権限と通信先は引き継ぐが、「制限なし」と「外部通信(すべて)」は外す
 */
export const duplicateAssetAtom = atom(
  null,
  async (get, set, asset: Asset): Promise<EditOutcome> => {
    const services = get(servicesAtom);
    if (services === null) return noServices;
    const assets = await get(panelAssetsAtom);
    if (assets.length >= MAX_ASSETS_PER_APP) {
      return {
        variant: 'warning',
        message: t('desktop.edit.tooMany', String(MAX_ASSETS_PER_APP)),
      };
    }
    const last = ofKind(assets, asset.kind).at(-1);
    const copy: Asset = {
      ...asset,
      title: t('desktop.edit.copyTitle', assetTitle(asset)),
      scope: 'private',
      enabled: false,
      order: (last?.order ?? 0) + ORDER_STEP,
      // 強い権限は、付与の確認を経ずに引き継がない
      permissions: asset.permissions.filter(
        (permission) => permission !== 'unrestricted' && permission !== 'external-all'
      ),
    };
    let record: ReturnType<typeof toNewAssetRecord>;
    try {
      record = toNewAssetRecord(copy, services.common);
    } catch (error) {
      return { variant: 'error', message: t('desktop.edit.failed', String(error)) };
    }
    const result = await services.addAsset(record);
    if (result.status === 'error') {
      return { variant: 'error', message: t('desktop.edit.failed', result.message) };
    }
    set(reloadPanelAtom);
    set(selectedAssetIdAtom, result.id);
    return { variant: 'success', message: t('desktop.edit.duplicated', assetTitle(asset)) };
  }
);

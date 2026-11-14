import {
  addRecord,
  deleteAllRecords,
  getCybozuUserGroups,
  getCybozuUserOrganizations,
  getFormFields,
  getRecordACLEvaluate,
  getRecords,
  updateAllRecords,
  updateRecord,
} from '@konomi-app/kintone-utilities';
import { detectScreen } from '@/lib/ai/chat-availability';
import type { ProxyEndpoint } from '@/lib/ai/endpoint';
import type { AssetAccess } from '@/lib/asset-access';
import type { AssetRecordValues } from '@/lib/asset-mapper';
import type { OrderUpdate } from '@/lib/asset-order';
import type { PanelAsset } from '@/lib/asset-panel';
import { buildAssetRecordPath, type TargetCoordinate } from '@/lib/asset-query';
import {
  type AddResult,
  addAssetRecord,
  type DeleteResult,
  deleteAssetRecord,
  loadAssetAccess,
  loadPanelAssets,
  type ReorderResult,
  type UpdateResult,
  updateAssetFields,
  updateAssetOrders,
} from '@/lib/asset-repository';
import {
  type PanelState,
  readMutedIds,
  readPanelState,
  type StorageLike,
  writeMutedIds,
  writePanelState,
} from '@/lib/browser-storage';
import { findUpdatedTimeFieldCode } from '@/lib/field-mapping';
import { GUEST_SPACE_ID, isDev } from '@/lib/global';
import {
  type AdminProbe,
  type AllowList,
  getChatAllowList,
  getPublishAllowList,
  resolveAllowListPermission,
  toAdminProbe,
} from '@/lib/permission';
import type { Asset, AssetPatch } from '@/schema/asset';
import type { PluginCommonConfig } from '@/schema/plugin-config';
import type { ChatRuntime } from '../chat/runtime';
import type { RuntimeController } from '../runtime';

/**
 * ランチャー(パネル)が使う、kintoneとブラウザへの入出力
 *
 * 画面の部品からREST APIやストレージを直接呼ばず、ここを通す。判定は`src/lib`の純粋関数に置く
 */

export type PanelData = {
  assets: PanelAsset[];
  access: ReadonlyMap<string, AssetAccess>;
  skipped: { id: string; reason: string }[];
  truncated: boolean;
};

export type LauncherServices = {
  target: TargetCoordinate;
  common: PluginCommonConfig;
  loginUserCode: string;
  safeMode: boolean;
  /** 一覧を取得します。失敗したら例外を投げる(パネルのエラー表示で扱う) */
  loadPanel: () => Promise<PanelData>;
  /** パネルで書き換えた項目だけを、revisionつきで更新します */
  updateAsset: (asset: Asset, patch: AssetPatch) => Promise<UpdateResult>;
  updateOrders: (updates: readonly OrderUpdate[]) => Promise<ReorderResult>;
  deleteAsset: (asset: Asset) => Promise<DeleteResult>;
  addAsset: (record: AssetRecordValues) => Promise<AddResult>;
  /**
   * 「全員」に公開できるか。所属やアプリ管理権限を取得できなければ`false`(安全側)
   *
   * ページの中では変わらないため、1回だけ判定する
   */
  loadCanPublish: () => Promise<boolean>;
  /** チャットを使えるか(チャットの許可リスト。全て空ならアプリ管理者のみ)。判定は公開権限と同じ */
  loadCanChat: () => Promise<boolean>;
  /**
   * チャットの実行部分を読み込んで組み立てます
   *
   * `ai`とプロバイダーは`desktop.js`に含めるが、評価はここで初めて行う(チャットを使わないページで初期化しない)
   */
  createChatRuntime: (endpoint: ProxyEndpoint) => Promise<ChatRuntime>;
  readMuted: () => ReadonlySet<string>;
  /** @returns ブラウザに保存できたか */
  writeMuted: (ids: ReadonlySet<string>) => boolean;
  /** パネルでの切り替えを実行基盤へ反映します(CSSは即時。セーフモードでは何もしない) */
  applyPanelChanges: (assets: readonly Asset[], mutedIds: ReadonlySet<string>) => void;
  readPanelState: () => PanelState;
  writePanelState: (state: PanelState) => void;
  /** アセット管理アプリのレコード詳細画面のパス */
  recordPath: (assetId: string) => string;
};

export class PanelLoadError extends Error {
  override name = 'PanelLoadError';
}

/**
 * ログインユーザーが対象アプリのアプリ管理者か
 *
 * 判定するAPIが無いため、アプリ管理権限が必要な`GET /k/v1/app/acl.json`を呼び、成功したら管理者とみなす(ADR-43)
 */
const probeAppAdmin = async (appId: string): Promise<AdminProbe> => {
  try {
    await kintone.api(kintone.api.url('/k/v1/app/acl.json', GUEST_SPACE_ID !== undefined), 'GET', {
      app: appId,
    });
    return toAdminProbe({ ok: true });
  } catch (error) {
    return toAdminProbe({ ok: false, error });
  }
};

export const createLauncherServices = (params: {
  common: PluginCommonConfig;
  target: TargetCoordinate;
  loginUserCode: string;
  safeMode: boolean;
  controller: RuntimeController | null;
  localStorage: StorageLike | null;
  sessionStorage: StorageLike | null;
}): LauncherServices => {
  const { common, target, loginUserCode, safeMode, controller } = params;
  const guestSpaceId = common.assetAppSpaceId || undefined;
  /** 管理アプリのフィールド構成はページの中で変わらないため、1回だけ取得する */
  let updatedTimeFieldCode: Promise<string> | null = null;
  let publishable: Promise<boolean> | null = null;
  let chattable: Promise<boolean> | null = null;

  /** アプリ管理者かは公開とチャットの両方で使うため、ページの中で1回だけ確かめる(判定できなければ次に再試行) */
  let adminProbe: Promise<AdminProbe> | null = null;
  const probeAdmin = () => {
    adminProbe ??= probeAppAdmin(target.appId).then((result) => {
      if (result === 'unknown') adminProbe = null;
      return result;
    });
    return adminProbe;
  };

  const resolveAllowed = (list: AllowList) =>
    resolveAllowListPermission({
      list,
      loginUserCode,
      fetchGroups: () =>
        getCybozuUserGroups(loginUserCode).then(({ groups }) => groups.map((g) => g.code)),
      fetchOrganizations: () =>
        getCybozuUserOrganizations(loginUserCode).then(({ organizations }) =>
          organizations.map((o) => o.code)
        ),
      probeAdmin,
    });

  const resolveUpdatedTimeFieldCode = () => {
    updatedTimeFieldCode ??= getFormFields({ app: common.assetAppId, guestSpaceId, debug: isDev })
      .then(({ properties }) => findUpdatedTimeFieldCode(Object.values(properties)))
      .catch(() => '');
    return updatedTimeFieldCode;
  };

  const self: LauncherServices = {
    target,
    common,
    loginUserCode,
    safeMode,
    loadPanel: async () => {
      const result = await loadPanelAssets({
        fetchRecords: (request) => getRecords({ ...request, debug: isDev }),
        common,
        target,
        updatedTimeFieldCode: await resolveUpdatedTimeFieldCode(),
      });
      if (result.status === 'error') {
        throw new PanelLoadError(result.message);
      }
      const access = await loadAssetAccess({
        evaluate: (request) => getRecordACLEvaluate({ ...request, debug: isDev }),
        common,
        ids: result.assets.map(({ asset }) => asset.id),
      });
      return {
        assets: result.assets,
        access,
        skipped: result.skipped,
        truncated: result.truncated,
      };
    },
    updateAsset: (asset, patch) =>
      updateAssetFields({
        updateRecord: (request) => updateRecord({ ...request, debug: isDev }),
        common,
        assetId: asset.id,
        revision: asset.revision,
        patch,
      }),
    updateOrders: (updates) =>
      updateAssetOrders({
        updateRecords: (request) => updateAllRecords({ ...request, debug: isDev }),
        common,
        updates,
      }),
    deleteAsset: (asset) =>
      deleteAssetRecord({
        deleteRecord: async ({ id, revision, ...request }) => {
          await deleteAllRecords({
            ...request,
            ids: [Number(id)],
            revisions: [Number(revision)],
            debug: isDev,
          });
        },
        common,
        assetId: asset.id,
        revision: asset.revision,
      }),
    addAsset: (record) =>
      addAssetRecord({
        addRecord: (request) => addRecord({ ...request, debug: isDev }),
        common,
        record,
      }),
    loadCanPublish: () => {
      publishable ??= resolveAllowed(getPublishAllowList(common)).then(
        ({ allowed, conclusive }) => {
          // 一時的な失敗で「公開できない」をページの間ずっと覚えない
          if (!conclusive) publishable = null;
          return allowed;
        }
      );
      return publishable;
    },
    loadCanChat: () => {
      chattable ??= resolveAllowed(getChatAllowList(common)).then(({ allowed, conclusive }) => {
        if (!conclusive) chattable = null;
        return allowed;
      });
      return chattable;
    },
    createChatRuntime: async (endpoint) => {
      // 1ファイルで配布するため別ファイルには分けない(ADR-47)。評価はチャットで最初に送信したときまで遅らせる
      const { createChatRuntime } = await import(/* webpackMode: "eager" */ '../chat/runtime');
      const { screen, recordId } = detectScreen(location.href);
      return createChatRuntime({ services: self, endpoint, screen, recordId });
    },
    readMuted: () => readMutedIds(params.localStorage, target, loginUserCode),
    writeMuted: (ids) => writeMutedIds(params.localStorage, target, loginUserCode, ids),
    applyPanelChanges: (assets, mutedIds) => controller?.applyPanelChanges(assets, mutedIds),
    readPanelState: () => readPanelState(params.sessionStorage, target),
    writePanelState: (state) => writePanelState(params.sessionStorage, target, state),
    recordPath: (assetId) => buildAssetRecordPath(common, assetId),
  };
  return self;
};

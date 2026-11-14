import type { Asset, AssetPatch } from '@/schema/asset';
import type { PluginCommonConfig } from '@/schema/plugin-config';
import { type AclRight, type AssetAccess, evaluateAssetAccess } from './asset-access';
import { sortAssets, validateAssetSet } from './asset-filter';
import {
  type AssetMappingError,
  type AssetRecord,
  type AssetRecordValues,
  readPanelMeta,
  toAsset,
  toRecordPatch,
} from './asset-mapper';
import type { OrderUpdate } from './asset-order';
import type { PanelAsset } from './asset-panel';
import {
  buildAssetQuery,
  getPanelFieldCodes,
  getRuntimeFieldCodes,
  type TargetCoordinate,
} from './asset-query';
import { MAX_ASSETS_PER_APP } from './constants';

/**
 * アセット管理アプリからアセットを取得します
 *
 * REST APIの呼び出しは引数で受け取り、判定ロジックは純粋関数(asset-*)に置く。
 *
 * @see docs/04-asset-app.md 3章
 */

export type FetchRecords = (params: {
  app: string;
  query: string;
  fields: string[];
  guestSpaceId?: string;
}) => Promise<{ records: unknown[] }>;

export type AssetLoadError =
  | { reason: 'request-failed'; message: string }
  | { reason: 'too-many'; count: number }
  | { reason: 'too-large'; bytes: number };

export type AssetLoadResult =
  | { status: 'ok'; assets: Asset[] }
  | { status: 'error'; error: AssetLoadError };

type KintoneErrorLike = { code?: unknown; message?: unknown; results?: unknown };

/**
 * kintoneのエラーのうち、意味のある1件
 *
 * `bulkRequest`の失敗は`{ results: [{}, { code, message }] }`の形で返り、失敗したリクエストだけに中身がある
 */
const primaryError = (error: unknown): KintoneErrorLike | null => {
  const value = error as KintoneErrorLike | null;
  if (value === null || typeof value !== 'object') return null;
  if (Array.isArray(value.results)) {
    return (
      (value.results as KintoneErrorLike[]).find(
        (result) => result !== null && typeof result === 'object' && 'code' in result
      ) ?? value
    );
  }
  return value;
};

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  const message = primaryError(error)?.message;
  return typeof message === 'string' ? message : String(error);
};

/**
 * 対象アプリの有効なアセットを取得します
 *
 * 上限を超えた場合は一部だけ返さず、エラーにする(ADR-22)。
 * 変換できないレコードは実行対象から外し、`onSkipped`で知らせる。
 */
export const loadEnabledAssets = async (params: {
  fetchRecords: FetchRecords;
  common: PluginCommonConfig;
  target: TargetCoordinate;
  onSkipped: (assetId: string, reason: AssetMappingError) => void;
}): Promise<AssetLoadResult> => {
  const { fetchRecords, common, target, onSkipped } = params;

  let records: unknown[];
  try {
    const response = await fetchRecords({
      app: common.assetAppId,
      query: buildAssetQuery(common, target, { enabledOnly: true }),
      fields: getRuntimeFieldCodes(common),
      guestSpaceId: common.assetAppSpaceId || undefined,
    });
    records = response.records;
  } catch (error) {
    return { status: 'error', error: { reason: 'request-failed', message: toErrorMessage(error) } };
  }

  if (records.length > MAX_ASSETS_PER_APP) {
    return { status: 'error', error: { reason: 'too-many', count: records.length } };
  }

  const assets = records.flatMap((record) => {
    const result = toAsset(record as AssetRecord, common);
    if (!result.ok) {
      onSkipped(result.id, result.reason);
      return [];
    }
    return [result.asset];
  });

  const validation = validateAssetSet(assets);
  if (!validation.ok) {
    return {
      status: 'error',
      error:
        validation.reason === 'too-many'
          ? { reason: 'too-many', count: validation.count }
          : { reason: 'too-large', bytes: validation.bytes },
    };
  }
  return { status: 'ok', assets: sortAssets(assets) };
};

export type PanelLoadResult =
  | {
      status: 'ok';
      assets: PanelAsset[];
      /** 変換できず一覧から外したレコード */
      skipped: { id: string; reason: AssetMappingError }[];
      /** 上限を超えたため、上限までだけを返した */
      truncated: boolean;
    }
  | { status: 'error'; message: string };

/**
 * パネルの一覧用に、対象アプリのアセットを無効なものも含めて取得します
 *
 * 実行時と違い、上限を超えても上限までを返す(パネルは整理する場所なので、見えないと直せない)。
 *
 * @see docs/04-asset-app.md 3-2章
 */
export const loadPanelAssets = async (params: {
  fetchRecords: FetchRecords;
  common: PluginCommonConfig;
  target: TargetCoordinate;
  /** 更新日時フィールドのコード。無ければ空文字 */
  updatedTimeFieldCode: string;
}): Promise<PanelLoadResult> => {
  const { fetchRecords, common, target, updatedTimeFieldCode } = params;
  let records: unknown[];
  try {
    const response = await fetchRecords({
      app: common.assetAppId,
      query: buildAssetQuery(common, target, { enabledOnly: false }),
      fields: getPanelFieldCodes(common, updatedTimeFieldCode),
      guestSpaceId: common.assetAppSpaceId || undefined,
    });
    records = response.records;
  } catch (error) {
    return { status: 'error', message: toErrorMessage(error) };
  }

  const skipped: { id: string; reason: AssetMappingError }[] = [];
  const assets = records.slice(0, MAX_ASSETS_PER_APP).flatMap((raw): PanelAsset[] => {
    const record = raw as AssetRecord;
    const result = toAsset(record, common);
    if (!result.ok) {
      skipped.push({ id: result.id, reason: result.reason });
      return [];
    }
    return [{ asset: result.asset, ...readPanelMeta(record, common, updatedTimeFieldCode) }];
  });
  return { status: 'ok', assets, skipped, truncated: records.length > MAX_ASSETS_PER_APP };
};

export type UpdateRecord = (params: {
  app: string;
  id: string;
  revision: string;
  record: Record<string, { value: unknown }>;
  guestSpaceId?: string;
}) => Promise<{ revision: string }>;

export type WriteError = {
  status: 'error';
  reason: 'conflict' | 'request-failed';
  message: string;
};

export type UpdateResult = { status: 'ok'; revision: string } | WriteError;

/** kintoneがrevisionの不一致(他の人が先に更新した)を返すときのエラーコード */
const REVISION_CONFLICT_CODE = 'GAIA_CO02';

/**
 * 楽観ロックに使えるrevisionか
 *
 * kintoneは`revision`を省略するか`-1`を渡すと検証しない。空や数値でない値で書くと、
 * 他の人の変更を黙って上書きしうるため、書き込む前に拒否する
 */
const isValidRevision = (revision: string): boolean => /^\d+$/.test(revision);

const invalidRevision = (): WriteError => ({
  status: 'error',
  reason: 'request-failed',
  message: 'invalid revision',
});

const toWriteError = (error: unknown): WriteError => ({
  status: 'error',
  reason: primaryError(error)?.code === REVISION_CONFLICT_CODE ? 'conflict' : 'request-failed',
  message: toErrorMessage(error),
});

/**
 * アセットの、パネルで書き換えた項目だけを更新します
 *
 * revisionを必ず付ける(付けないと、他の人が同時に変えた内容を黙って上書きする)。
 */
export const updateAssetFields = async (params: {
  updateRecord: UpdateRecord;
  common: PluginCommonConfig;
  assetId: string;
  revision: string;
  patch: AssetPatch;
}): Promise<UpdateResult> => {
  const { updateRecord, common, assetId, revision, patch } = params;
  if (!isValidRevision(revision)) {
    return invalidRevision();
  }
  try {
    const response = await updateRecord({
      app: common.assetAppId,
      id: assetId,
      revision,
      record: toRecordPatch(patch, common),
      guestSpaceId: common.assetAppSpaceId || undefined,
    });
    return { status: 'ok', revision: response.revision };
  } catch (error) {
    return toWriteError(error);
  }
};

export type UpdateRecords = (params: {
  app: string;
  records: { id: string; revision: string; record: AssetRecordValues }[];
  guestSpaceId?: string;
}) => Promise<{ records: { id: string; revision: string }[] }>;

export type ReorderResult = { status: 'ok'; revisions: Map<string, string> } | WriteError;

/**
 * 並べ替えた実行順を、変わったレコードだけまとめて更新します
 *
 * 各レコードにrevisionを付ける。失敗したら部分的に成功しうる前提で、呼び出し側が一覧を取り直す
 */
export const updateAssetOrders = async (params: {
  updateRecords: UpdateRecords;
  common: PluginCommonConfig;
  updates: readonly OrderUpdate[];
}): Promise<ReorderResult> => {
  const { updateRecords, common, updates } = params;
  if (updates.length === 0) {
    return { status: 'ok', revisions: new Map() };
  }
  if (!updates.every(({ revision }) => isValidRevision(revision))) {
    return invalidRevision();
  }
  try {
    const response = await updateRecords({
      app: common.assetAppId,
      records: updates.map(({ id, revision, order }) => ({
        id,
        revision,
        record: toRecordPatch({ order }, common),
      })),
      guestSpaceId: common.assetAppSpaceId || undefined,
    });
    return {
      status: 'ok',
      revisions: new Map(
        response.records.map(({ id, revision }) => [String(id), String(revision)])
      ),
    };
  } catch (error) {
    return toWriteError(error);
  }
};

export type DeleteRecord = (params: {
  app: string;
  id: string;
  revision: string;
  guestSpaceId?: string;
}) => Promise<void>;

export type DeleteResult = { status: 'ok' } | WriteError;

/** アセットのレコードを削除します(revisionつき。他の人が先に更新していたら消さない) */
export const deleteAssetRecord = async (params: {
  deleteRecord: DeleteRecord;
  common: PluginCommonConfig;
  assetId: string;
  revision: string;
}): Promise<DeleteResult> => {
  const { deleteRecord, common, assetId, revision } = params;
  if (!isValidRevision(revision)) {
    return invalidRevision();
  }
  try {
    await deleteRecord({
      app: common.assetAppId,
      id: assetId,
      revision,
      guestSpaceId: common.assetAppSpaceId || undefined,
    });
    return { status: 'ok' };
  } catch (error) {
    return toWriteError(error);
  }
};

export type AddRecord = (params: {
  app: string;
  record: AssetRecordValues;
  guestSpaceId?: string;
}) => Promise<{ id: string; revision: string }>;

export type AddResult =
  | { status: 'ok'; id: string; revision: string }
  | { status: 'error'; message: string };

/** アセットのレコードを追加します */
export const addAssetRecord = async (params: {
  addRecord: AddRecord;
  common: PluginCommonConfig;
  record: AssetRecordValues;
}): Promise<AddResult> => {
  const { addRecord, common, record } = params;
  try {
    const response = await addRecord({
      app: common.assetAppId,
      record,
      guestSpaceId: common.assetAppSpaceId || undefined,
    });
    return { status: 'ok', id: String(response.id), revision: String(response.revision) };
  } catch (error) {
    return { status: 'error', message: toErrorMessage(error) };
  }
};

export type EvaluateAcl = (params: {
  app: string;
  ids: string[];
  guestSpaceId?: string;
}) => Promise<{ rights: AclRight[] }>;

/**
 * パネルで操作できることを、アセット管理アプリのレコードのアクセス権から取得します
 *
 * 1リクエストでレコードID100件まで(本プラグインの上限と同じ)。
 * 取得できなければ空を返す(全て操作できない扱いにする)。
 */
export const loadAssetAccess = async (params: {
  evaluate: EvaluateAcl;
  common: PluginCommonConfig;
  ids: string[];
}): Promise<Map<string, AssetAccess>> => {
  const { evaluate, common, ids } = params;
  if (ids.length === 0) {
    return new Map();
  }
  try {
    const { rights } = await evaluate({
      app: common.assetAppId,
      ids: ids.slice(0, MAX_ASSETS_PER_APP),
      guestSpaceId: common.assetAppSpaceId || undefined,
    });
    return evaluateAssetAccess(rights, common);
  } catch {
    return new Map();
  }
};

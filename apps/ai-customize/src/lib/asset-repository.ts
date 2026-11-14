import type { Asset } from '@/schema/asset';
import type { PluginCommonConfig } from '@/schema/plugin-config';
import { sortAssets, validateAssetSet } from './asset-filter';
import { type AssetMappingError, type AssetRecord, toAsset } from './asset-mapper';
import { buildAssetQuery, getRuntimeFieldCodes, type TargetCoordinate } from './asset-query';
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

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  const message = (error as { message?: unknown } | null)?.message;
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

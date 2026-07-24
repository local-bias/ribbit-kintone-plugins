import {
  findUpdatedTimeFieldCode,
  getMaxUpdatedTime,
  mergeRecordsById,
  revalidateCache as revalidateCacheBase,
  type RevalidateCacheResult,
} from '@repo/idb-cache';
import { isProd } from '@/lib/global';
import type { CacheEnvelope } from './persistent-cache';

export { findUpdatedTimeFieldCode, getMaxUpdatedTime, mergeRecordsById };
export type { RevalidateCacheResult };

type RevalidateCacheParams = {
  srcAppId: string;
  guestSpaceId: string | undefined;
  fields: string[];
  updatedFieldCode: string;
  cached: CacheEnvelope;
  configHash: string;
};

// autocompleteの候補設定にはfilterQuery(絞り込み条件)が存在せず、参照先アプリの
// 全レコードを対象にするため、共有実装へは常にfilterQuery: ''を渡す。
// 同様にsrcSpaceId/isSrcAppGuestSpaceも、プラグイン自身が動作しているスペース
// (GUEST_SPACE_ID)から導出する(lookup-plusのように条件ごとに参照先スペースを
// 個別指定するUIを持たないため)
export const revalidateCache = (params: RevalidateCacheParams): Promise<RevalidateCacheResult> =>
  revalidateCacheBase({
    srcAppId: params.srcAppId,
    srcSpaceId: params.guestSpaceId ?? null,
    isSrcAppGuestSpace: params.guestSpaceId != null,
    filterQuery: '',
    fields: params.fields,
    updatedFieldCode: params.updatedFieldCode,
    cached: params.cached,
    configHash: params.configHash,
    debug: !isProd,
  });

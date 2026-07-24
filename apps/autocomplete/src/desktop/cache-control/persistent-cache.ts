import { CACHE_ENVELOPE_VERSION, type CacheEnvelope, createRecordCache, DEFAULT_CACHE_TTL_MS, hashString } from '@repo/idb-cache';
import { PLUGIN_ID } from '@/lib/global';
import { LOCAL_STORAGE_KEY } from '@/lib/static';
import { idbStore, persistenceGuard } from './idb-store';

export { CACHE_ENVELOPE_VERSION };
export const CACHE_TTL_MS = DEFAULT_CACHE_TTL_MS;
export type { CacheEnvelope };

const recordCache = createRecordCache({
  idbStore,
  keyPrefix: `konomi-autocomplete:${PLUGIN_ID}`,
  persistenceGuard,
});

export const isPersistenceAvailable = (): boolean => recordCache.isPersistenceAvailable();

export const disablePersistence = (): void => recordCache.disablePersistence();

export const buildCacheKey = (conditionId: string): string => {
  const loginUserCode = kintone.getLoginUser()?.code ?? 'unknown';
  return recordCache.buildCacheKey(loginUserCode, conditionId);
};

export const buildConfigHash = (params: {
  srcAppId: string;
  guestSpaceId: string | undefined;
  fields: string[];
}): string => {
  const normalized = {
    srcAppId: params.srcAppId,
    guestSpaceId: params.guestSpaceId ?? null,
    fields: [...params.fields].sort(),
  };
  return hashString(JSON.stringify(normalized));
};

/** 破損・期限切れ・設定不一致のいずれの場合もnullを返し、例外は投げない */
export const loadCacheEnvelope = async (params: {
  conditionId: string;
  expectedConfigHash: string;
}): Promise<CacheEnvelope | null> =>
  recordCache.loadCacheEnvelope({
    key: buildCacheKey(params.conditionId),
    expectedConfigHash: params.expectedConfigHash,
  });

/** 失敗しても例外を投げない(キャッシュ永続化はベストエフォート) */
export const saveCacheEnvelope = async (params: {
  conditionId: string;
  envelope: CacheEnvelope;
}): Promise<void> =>
  recordCache.saveCacheEnvelope({ key: buildCacheKey(params.conditionId), envelope: params.envelope });

/** 自プラグイン分の期限切れ・破損キャッシュをアイドル時にまとめて削除する */
export const scheduleExpiredCacheCleanup = (): void => recordCache.scheduleExpiredCacheCleanup();

/**
 * IndexedDBキャッシュ導入前に使用していたlocalStorageキャッシュを削除する。
 * 旧データは$idや更新日時を持たない文字列配列であり新エンベロープへ変換できないため、
 * マイグレーションはせず単純に削除する(次回アクセス時に全件取得で再構築される)。
 */
export const cleanupLegacyLocalStorageCache = (): void => {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch {
    // localStorageが利用できない環境(プライベートブラウジング等)では何もしない
  }
};

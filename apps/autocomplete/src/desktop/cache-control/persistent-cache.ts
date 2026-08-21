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

export type DatasetIdentity = {
  srcAppId: string;
  guestSpaceId: string | undefined;
  fields: string[];
};

/**
 * キャッシュされるレコード集合そのものを一意に表すキー。
 *
 * autocompleteには絞り込み条件が存在しないため、取得結果は
 * 「参照先アプリ・ゲストスペース・取得フィールド」だけで完全に決まる。
 * 候補設定ID(condition.id)ではなくこの組み合わせでキャッシュすることで、
 * 同一アプリの同一フィールドを参照する候補設定が複数あっても、
 * エントリと取得処理を1つに集約できる。
 *
 * ハッシュではなく生の値を構造化して埋め込むことで、異なる設定が同一キーに
 * 衝突しないことを保証する
 */
export const buildDatasetKey = (params: DatasetIdentity): string =>
  JSON.stringify([params.srcAppId, params.guestSpaceId ?? null, [...params.fields].sort()]);

export const buildCacheKey = (datasetKey: string): string => {
  const loginUserCode = kintone.getLoginUser()?.code ?? 'unknown';
  return recordCache.buildCacheKey(loginUserCode, datasetKey);
};

/** エンベロープ内に保存し、設定変更によるキャッシュ失効を検知するために使用する */
export const buildConfigHash = (params: DatasetIdentity): string =>
  hashString(buildDatasetKey(params));

/** 破損・期限切れ・設定不一致のいずれの場合もnullを返し、例外は投げない */
export const loadCacheEnvelope = async (params: {
  datasetKey: string;
  expectedConfigHash: string;
}): Promise<CacheEnvelope | null> =>
  recordCache.loadCacheEnvelope({
    key: buildCacheKey(params.datasetKey),
    expectedConfigHash: params.expectedConfigHash,
  });

/** 失敗しても例外を投げない(キャッシュ永続化はベストエフォート) */
export const saveCacheEnvelope = async (params: {
  datasetKey: string;
  envelope: CacheEnvelope;
}): Promise<void> =>
  recordCache.saveCacheEnvelope({ key: buildCacheKey(params.datasetKey), envelope: params.envelope });

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

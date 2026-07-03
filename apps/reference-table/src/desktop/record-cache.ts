import type { RelatedRecord } from './table';

/**
 * 取得済みの関連レコードを SPA セッション中メモリ上に保持する軽量キャッシュ。
 *
 * - キーは「設定ID・関連アプリID・検索クエリ・取得フィールド」から生成し、
 *   レコード詳細ごと（＝照合値ごと）に独立したエントリとなる。
 * - TTL を過ぎたエントリは取得時に破棄し、自動的に再取得対象とする。
 * - エントリ数が上限を超えた場合は最も古いものから破棄する（LRU）。
 *
 * 永続化（sessionStorage 等）は行わない。ページリロードでキャッシュは破棄される。
 */

/** キャッシュの既定有効期限（ミリ秒）。これを過ぎたエントリは再取得対象となる。 */
export const DEFAULT_RECORD_CACHE_TTL_MS = 5 * 60 * 1000;

/** 保持するキャッシュエントリの最大数。超過時は最も古いものから破棄する。 */
export const MAX_RECORD_CACHE_ENTRIES = 50;

export type RecordCacheEntry = {
  records: RelatedRecord[];
  /** キャッシュへ格納した時刻（エポックミリ秒） */
  cachedAt: number;
};

/** Map は挿入順を保持するため、そのまま LRU の順序付けに利用する。 */
const cacheStore = new Map<string, RecordCacheEntry>();

/** 通常の文字列には現れない制御文字でキー要素を連結し、衝突を避ける。 */
const KEY_SEPARATOR = '\u0000';

export const createRecordCacheKey = (params: {
  conditionId: string;
  relatedAppId: string;
  query: string;
  fields: string[];
}): string => {
  return [
    params.conditionId,
    params.relatedAppId,
    params.query,
    [...params.fields].sort().join(','),
  ].join(KEY_SEPARATOR);
};

export const getCachedRecords = (
  key: string,
  options: { ttl?: number } = {}
): RecordCacheEntry | null => {
  const entry = cacheStore.get(key);
  if (!entry) {
    return null;
  }

  const ttl = options.ttl ?? DEFAULT_RECORD_CACHE_TTL_MS;
  if (ttl > 0 && Date.now() - entry.cachedAt > ttl) {
    cacheStore.delete(key);
    return null;
  }

  // LRU: アクセスされたエントリを末尾へ移動して「最近使用」とみなす
  cacheStore.delete(key);
  cacheStore.set(key, entry);
  return entry;
};

export const setCachedRecords = (key: string, records: RelatedRecord[]): RecordCacheEntry => {
  const entry: RecordCacheEntry = { records, cachedAt: Date.now() };
  // 既存エントリを一度削除してから追加し、挿入順（=最新）を末尾へそろえる
  cacheStore.delete(key);
  cacheStore.set(key, entry);

  while (cacheStore.size > MAX_RECORD_CACHE_ENTRIES) {
    const oldestKey = cacheStore.keys().next().value;
    if (oldestKey === undefined) {
      break;
    }
    cacheStore.delete(oldestKey);
  }

  return entry;
};

export const clearCachedRecords = (key: string): void => {
  cacheStore.delete(key);
};

export const clearAllCachedRecords = (): void => {
  cacheStore.clear();
};

import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import { z } from 'zod';
import type { IdbStore } from './idb';

export const CACHE_ENVELOPE_VERSION = 1;
export const DEFAULT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const CacheRecordSchema = z.custom<kintoneAPI.RecordData>((value) => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const id = (value as Record<string, unknown>).$id;
  return (
    typeof id === 'object' &&
    id !== null &&
    typeof (id as Record<string, unknown>).value === 'string'
  );
});

// kintoneのUPDATED_TIME形式(例: 2026-01-01T00:00:00Z / ミリ秒付きも許容)。
// レコードが0件の場合は空文字列を許容する。
// クエリ文字列に直接埋め込まれる値のため、改ざんされたエンベロープが
// クエリインジェクションの経路にならないよう厳密な形式チェックを行う。
export const UPDATED_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

export const CacheEnvelopeSchema = z.object({
  version: z.literal(CACHE_ENVELOPE_VERSION),
  savedAt: z.number(),
  configHash: z.string(),
  maxUpdatedTime: z.string().refine((value) => value === '' || UPDATED_TIME_PATTERN.test(value)),
  updatedFieldCode: z.string(),
  count: z.number(),
  records: z.array(CacheRecordSchema),
});

export type CacheEnvelope = z.infer<typeof CacheEnvelopeSchema>;

/** ストレージ容量超過を検知する */
export const isQuotaExceededError = (error: unknown): boolean =>
  error instanceof DOMException && error.name === 'QuotaExceededError';

/** djb2ハッシュ。設定変更を検知してキャッシュを失効させるために使用する */
export const hashString = (input: string): string => {
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
};

export const joinCacheKey = (...parts: string[]): string => parts.join(':');

export interface PersistenceGuard {
  isAvailable(): boolean;
  disable(): void;
}

/**
 * 永続化の有効/無効フラグ。複数のキャッシュインスタンス(レコードキャッシュと
 * フィールド定義キャッシュなど)で1つのquota超過状態を共有したい場合は、
 * 生成したガードを両方のcreate*関数に渡す
 */
export const createPersistenceGuard = (): PersistenceGuard => {
  let disabled = false;
  return {
    isAvailable: () => !disabled && typeof indexedDB !== 'undefined',
    disable: () => {
      disabled = true;
    },
  };
};

export interface RecordCache {
  isPersistenceAvailable(): boolean;
  disablePersistence(): void;
  buildCacheKey(...parts: string[]): string;
  /** 破損・期限切れ・設定不一致のいずれの場合もnullを返し、例外は投げない */
  loadCacheEnvelope(params: {
    key: string;
    expectedConfigHash: string;
  }): Promise<CacheEnvelope | null>;
  /** 失敗しても例外を投げない(キャッシュ永続化はベストエフォート) */
  saveCacheEnvelope(params: { key: string; envelope: CacheEnvelope }): Promise<void>;
  /** 自キャッシュ分の期限切れ・破損エントリをアイドル時にまとめて削除する */
  scheduleExpiredCacheCleanup(): void;
}

export const createRecordCache = (params: {
  idbStore: IdbStore;
  keyPrefix: string;
  ttlMs?: number;
  persistenceGuard?: PersistenceGuard;
}): RecordCache => {
  const { idbStore, keyPrefix, ttlMs = DEFAULT_CACHE_TTL_MS } = params;
  const guard = params.persistenceGuard ?? createPersistenceGuard();

  const buildCacheKey: RecordCache['buildCacheKey'] = (...parts) =>
    joinCacheKey(keyPrefix, ...parts);

  const loadCacheEnvelope: RecordCache['loadCacheEnvelope'] = async ({
    key,
    expectedConfigHash,
  }) => {
    if (!guard.isAvailable()) {
      return null;
    }

    try {
      const raw = await idbStore.get(key);
      if (raw === undefined) {
        return null;
      }

      const parsed = CacheEnvelopeSchema.safeParse(raw);
      if (!parsed.success) {
        await idbStore.delete(key).catch(() => undefined);
        return null;
      }

      const isExpired = Date.now() - parsed.data.savedAt > ttlMs;
      const isConfigStale = parsed.data.configHash !== expectedConfigHash;
      if (isExpired || isConfigStale) {
        await idbStore.delete(key).catch(() => undefined);
        return null;
      }

      return parsed.data;
    } catch {
      return null;
    }
  };

  const saveCacheEnvelope: RecordCache['saveCacheEnvelope'] = async ({ key, envelope }) => {
    if (!guard.isAvailable()) {
      return;
    }

    try {
      await idbStore.put(key, envelope);
    } catch (error) {
      await idbStore.delete(key).catch(() => undefined);
      if (isQuotaExceededError(error)) {
        guard.disable();
      }
    }
  };

  const scheduleExpiredCacheCleanup: RecordCache['scheduleExpiredCacheCleanup'] = () => {
    if (!guard.isAvailable()) {
      return;
    }

    idbStore.scheduleIdleCleanup({
      keyPrefix: `${keyPrefix}:`,
      isExpired: (raw) => {
        const parsed = CacheEnvelopeSchema.safeParse(raw);
        return !parsed.success || Date.now() - parsed.data.savedAt > ttlMs;
      },
    });
  };

  return {
    isPersistenceAvailable: guard.isAvailable,
    disablePersistence: guard.disable,
    buildCacheKey,
    loadCacheEnvelope,
    saveCacheEnvelope,
    scheduleExpiredCacheCleanup,
  };
};

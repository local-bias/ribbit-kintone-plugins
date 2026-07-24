import 'fake-indexeddb/auto';
import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createIdbStore } from './idb';
import {
  CACHE_ENVELOPE_VERSION,
  type CacheEnvelope,
  createPersistenceGuard,
  createRecordCache,
  DEFAULT_CACHE_TTL_MS,
} from './record-cache';

const record: kintoneAPI.RecordData = {
  $id: { type: '__ID__', value: '1' },
};

const buildEnvelope = (overrides: Partial<CacheEnvelope> = {}): CacheEnvelope => ({
  version: CACHE_ENVELOPE_VERSION,
  savedAt: Date.now(),
  configHash: 'hash-a',
  maxUpdatedTime: '2026-07-01T00:00:00Z',
  updatedFieldCode: '更新日時',
  count: 1,
  records: [record],
  ...overrides,
});

const setupRecordCache = () => {
  const idbStore = createIdbStore({ dbName: 'test-db', storeName: 'record-cache' });
  const recordCache = createRecordCache({ idbStore, keyPrefix: 'konomi-test' });
  return { idbStore, recordCache };
};

beforeEach(() => {
  // fake-indexeddbはプロセス内で永続化されるため、テスト毎にDBを作り直す
  globalThis.indexedDB = new IDBFactory();
});

describe('loadCacheEnvelope / saveCacheEnvelope', () => {
  it('保存したエンベロープをそのまま読み出せる', async () => {
    const { recordCache } = setupRecordCache();
    const key = recordCache.buildCacheKey('cond-1');
    const envelope = buildEnvelope();
    await recordCache.saveCacheEnvelope({ key, envelope });

    const loaded = await recordCache.loadCacheEnvelope({
      key,
      expectedConfigHash: envelope.configHash,
    });

    expect(loaded).toEqual(envelope);
  });

  it('存在しないキーの場合はnullを返す', async () => {
    const { recordCache } = setupRecordCache();
    const loaded = await recordCache.loadCacheEnvelope({
      key: recordCache.buildCacheKey('not-found'),
      expectedConfigHash: 'hash-a',
    });
    expect(loaded).toBeNull();
  });

  it('破損したエントリはnullを返し、エントリを削除する', async () => {
    const { idbStore, recordCache } = setupRecordCache();
    const key = recordCache.buildCacheKey('cond-broken');
    await idbStore.put(key, { not: 'an envelope' });

    const loaded = await recordCache.loadCacheEnvelope({ key, expectedConfigHash: 'hash-a' });

    expect(loaded).toBeNull();
    expect(await idbStore.get(key)).toBeUndefined();
  });

  it('TTLを超過したエントリはnullを返し、エントリを削除する', async () => {
    const { idbStore, recordCache } = setupRecordCache();
    const key = recordCache.buildCacheKey('cond-expired');
    const envelope = buildEnvelope({ savedAt: Date.now() - DEFAULT_CACHE_TTL_MS - 1 });
    await recordCache.saveCacheEnvelope({ key, envelope });

    const loaded = await recordCache.loadCacheEnvelope({
      key,
      expectedConfigHash: envelope.configHash,
    });

    expect(loaded).toBeNull();
    expect(await idbStore.get(key)).toBeUndefined();
  });

  it('configHashが一致しない場合はnullを返し、エントリを削除する(設定変更時の失効)', async () => {
    const { idbStore, recordCache } = setupRecordCache();
    const key = recordCache.buildCacheKey('cond-stale');
    const envelope = buildEnvelope({ configHash: 'hash-old' });
    await recordCache.saveCacheEnvelope({ key, envelope });

    const loaded = await recordCache.loadCacheEnvelope({ key, expectedConfigHash: 'hash-new' });

    expect(loaded).toBeNull();
    expect(await idbStore.get(key)).toBeUndefined();
  });

  it('カスタムTTLを指定できる', async () => {
    const idbStore = createIdbStore({ dbName: 'test-db-ttl', storeName: 'record-cache' });
    const shortTtlCache = createRecordCache({ idbStore, keyPrefix: 'konomi-test', ttlMs: 1000 });
    const key = shortTtlCache.buildCacheKey('cond-1');
    const envelope = buildEnvelope({ savedAt: Date.now() - 2000 });
    await shortTtlCache.saveCacheEnvelope({ key, envelope });

    const loaded = await shortTtlCache.loadCacheEnvelope({
      key,
      expectedConfigHash: envelope.configHash,
    });
    expect(loaded).toBeNull();
  });
});

describe('buildCacheKey', () => {
  it('keyPrefixと渡した部分をコロンで連結する', () => {
    const { recordCache } = setupRecordCache();
    expect(recordCache.buildCacheKey('user-a', 'cond-1')).toBe('konomi-test:user-a:cond-1');
  });

  it('異なるスコープであればキーが衝突しない', async () => {
    const { recordCache } = setupRecordCache();
    const envelopeA = buildEnvelope({ configHash: 'hash-a' });
    const envelopeB = buildEnvelope({ configHash: 'hash-b', records: [] });

    await recordCache.saveCacheEnvelope({
      key: recordCache.buildCacheKey('cond-a'),
      envelope: envelopeA,
    });
    await recordCache.saveCacheEnvelope({
      key: recordCache.buildCacheKey('cond-b'),
      envelope: envelopeB,
    });

    const loadedA = await recordCache.loadCacheEnvelope({
      key: recordCache.buildCacheKey('cond-a'),
      expectedConfigHash: 'hash-a',
    });
    const loadedB = await recordCache.loadCacheEnvelope({
      key: recordCache.buildCacheKey('cond-b'),
      expectedConfigHash: 'hash-b',
    });

    expect(loadedA?.records).toHaveLength(1);
    expect(loadedB?.records).toHaveLength(0);
  });
});

describe('quota超過時の挙動', () => {
  it('put失敗時は例外を投げず、エントリを削除し永続化を無効化する', async () => {
    const { idbStore, recordCache } = setupRecordCache();
    const key = recordCache.buildCacheKey('cond-quota');
    const quotaError = new DOMException('quota exceeded', 'QuotaExceededError');
    const putSpy = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(() => {
      throw quotaError;
    });

    await expect(
      recordCache.saveCacheEnvelope({ key, envelope: buildEnvelope() })
    ).resolves.toBeUndefined();

    putSpy.mockRestore();
    expect(recordCache.isPersistenceAvailable()).toBe(false);
    expect(await idbStore.get(key)).toBeUndefined();
  });
});

describe('disablePersistence', () => {
  it('呼び出し後はload/saveが即座にno-opになる', async () => {
    const { recordCache } = setupRecordCache();
    const key = recordCache.buildCacheKey('cond-x');

    recordCache.disablePersistence();
    expect(recordCache.isPersistenceAvailable()).toBe(false);

    await recordCache.saveCacheEnvelope({ key, envelope: buildEnvelope() });
    const loaded = await recordCache.loadCacheEnvelope({ key, expectedConfigHash: 'hash-a' });
    expect(loaded).toBeNull();
  });
});

describe('永続化ガードの共有', () => {
  it('同じPersistenceGuardを渡した複数のキャッシュ間でquota超過状態を共有できる', async () => {
    const guard = createPersistenceGuard();
    const idbStoreA = createIdbStore({ dbName: 'test-db-shared', storeName: 'a' });
    const idbStoreB = createIdbStore({ dbName: 'test-db-shared', storeName: 'b' });
    const cacheA = createRecordCache({ idbStore: idbStoreA, keyPrefix: 'a', persistenceGuard: guard });
    const cacheB = createRecordCache({ idbStore: idbStoreB, keyPrefix: 'b', persistenceGuard: guard });

    cacheA.disablePersistence();

    expect(cacheB.isPersistenceAvailable()).toBe(false);
  });
});

describe('scheduleExpiredCacheCleanup', () => {
  it('期限切れエントリを削除し、有効なエントリは残す', async () => {
    const { idbStore, recordCache } = setupRecordCache();
    const validKey = recordCache.buildCacheKey('cond-valid');
    const expiredKey = recordCache.buildCacheKey('cond-expired');
    const valid = buildEnvelope({ configHash: 'hash-valid' });
    const expired = buildEnvelope({
      configHash: 'hash-expired',
      savedAt: Date.now() - DEFAULT_CACHE_TTL_MS - 1,
    });
    await recordCache.saveCacheEnvelope({ key: validKey, envelope: valid });
    await recordCache.saveCacheEnvelope({ key: expiredKey, envelope: expired });

    recordCache.scheduleExpiredCacheCleanup();
    // requestIdleCallback/setTimeoutのマクロタスクを待つ
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(await idbStore.get(validKey)).toBeDefined();
    expect(await idbStore.get(expiredKey)).toBeUndefined();
  });
});

import 'fake-indexeddb/auto';
import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LOCAL_STORAGE_KEY } from '@/lib/static';
import { idbStore } from './idb-store';
import {
  buildCacheKey,
  buildConfigHash,
  buildDatasetKey,
  CACHE_ENVELOPE_VERSION,
  type CacheEnvelope,
  cleanupLegacyLocalStorageCache,
  isPersistenceAvailable,
  loadCacheEnvelope,
  saveCacheEnvelope,
} from './persistent-cache';

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

beforeEach(async () => {
  // fake-indexeddbはプロセス内で永続化されるため、テスト毎にDBを作り直す
  globalThis.indexedDB = new IDBFactory();
  localStorage.clear();
});

describe('loadCacheEnvelope / saveCacheEnvelope', () => {
  it('保存したエンベロープをそのまま読み出せる', async () => {
    const envelope = buildEnvelope();
    await saveCacheEnvelope({ datasetKey: 'dataset-1', envelope });

    const loaded = await loadCacheEnvelope({
      datasetKey: 'dataset-1',
      expectedConfigHash: envelope.configHash,
    });

    expect(loaded).toEqual(envelope);
  });

  it('configHashが一致しない場合はnullを返す(設定変更時の失効)', async () => {
    const envelope = buildEnvelope({ configHash: 'hash-old' });
    await saveCacheEnvelope({ datasetKey: 'dataset-stale', envelope });

    const loaded = await loadCacheEnvelope({
      datasetKey: 'dataset-stale',
      expectedConfigHash: 'hash-new',
    });

    expect(loaded).toBeNull();
  });

  it('ログインユーザーが異なればキーが衝突しない(共有PCでの他ユーザーへのデータ漏洩防止)', async () => {
    const getLoginUserSpy = vi.spyOn(globalThis.kintone, 'getLoginUser');

    getLoginUserSpy.mockReturnValue({
      code: 'user-a',
      id: 'user-a-id',
      name: 'User A',
      language: 'ja',
    } as ReturnType<typeof kintone.getLoginUser>);
    const keyForUserA = buildCacheKey('dataset-shared');
    await saveCacheEnvelope({ datasetKey: 'dataset-shared', envelope: buildEnvelope() });

    getLoginUserSpy.mockReturnValue({
      code: 'user-b',
      id: 'user-b-id',
      name: 'User B',
      language: 'ja',
    } as ReturnType<typeof kintone.getLoginUser>);
    const keyForUserB = buildCacheKey('dataset-shared');

    expect(keyForUserB).not.toBe(keyForUserA);
    // ユーザーBとしては、ユーザーAが保存したエンベロープを読み出せない
    const loadedByUserB = await loadCacheEnvelope({
      datasetKey: 'dataset-shared',
      expectedConfigHash: buildEnvelope().configHash,
    });
    expect(loadedByUserB).toBeNull();

    getLoginUserSpy.mockRestore();
  });
});

describe('buildDatasetKey', () => {
  it('参照先アプリ・フィールドが同じであれば、フィールドの並び順によらず同じキーになる', () => {
    const base = { srcAppId: '1', guestSpaceId: undefined };
    expect(buildDatasetKey({ ...base, fields: ['会社名', '更新日時'] })).toBe(
      buildDatasetKey({ ...base, fields: ['更新日時', '会社名'] })
    );
  });

  it('参照先アプリが異なれば異なるキーになる', () => {
    const base = { guestSpaceId: undefined, fields: ['会社名'] };
    expect(buildDatasetKey({ ...base, srcAppId: '1' })).not.toBe(
      buildDatasetKey({ ...base, srcAppId: '2' })
    );
  });

  it('参照先フィールドが異なれば異なるキーになる', () => {
    const base = { srcAppId: '1', guestSpaceId: undefined };
    expect(buildDatasetKey({ ...base, fields: ['会社名'] })).not.toBe(
      buildDatasetKey({ ...base, fields: ['担当者名'] })
    );
  });
});

describe('buildConfigHash', () => {
  it('フィールドの並び順が異なっても同じハッシュになる', () => {
    const base = { srcAppId: '1', guestSpaceId: undefined };
    const hashA = buildConfigHash({ ...base, fields: ['a', 'b'] });
    const hashB = buildConfigHash({ ...base, fields: ['b', 'a'] });
    expect(hashA).toBe(hashB);
  });

  it('srcAppIdが異なれば異なるハッシュになる', () => {
    const base = { guestSpaceId: undefined, fields: ['a'] };
    const hashA = buildConfigHash({ ...base, srcAppId: '1' });
    const hashB = buildConfigHash({ ...base, srcAppId: '2' });
    expect(hashA).not.toBe(hashB);
  });
});

describe('quota超過時の挙動', () => {
  it('put失敗時は例外を投げず、エントリを削除し永続化を無効化する', async () => {
    const key = buildCacheKey('dataset-quota');
    const quotaError = new DOMException('quota exceeded', 'QuotaExceededError');
    const putSpy = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(() => {
      throw quotaError;
    });

    await expect(
      saveCacheEnvelope({ datasetKey: 'dataset-quota', envelope: buildEnvelope() })
    ).resolves.toBeUndefined();

    putSpy.mockRestore();
    expect(isPersistenceAvailable()).toBe(false);
    expect(await idbStore.get(key)).toBeUndefined();
  });
});

describe('cleanupLegacyLocalStorageCache', () => {
  it('旧localStorageキャッシュを削除する', () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ version: 1, 'cond-1': ['a', 'b'] }));

    cleanupLegacyLocalStorageCache();

    expect(localStorage.getItem(LOCAL_STORAGE_KEY)).toBeNull();
  });

  it('キーが存在しない場合も例外を投げない', () => {
    expect(() => cleanupLegacyLocalStorageCache()).not.toThrow();
  });
});

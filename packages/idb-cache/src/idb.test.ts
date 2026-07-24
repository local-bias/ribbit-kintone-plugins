import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createIdbStore } from './idb';

beforeEach(() => {
  // fake-indexeddbはプロセス内で永続化されるため、テスト毎にDBを作り直す
  globalThis.indexedDB = new IDBFactory();
});

describe('createIdbStore', () => {
  it('put/getでラウンドトリップできる', async () => {
    const store = createIdbStore({ dbName: 'idb-test', storeName: 'store' });
    await store.put('key-1', { value: 'hello' });
    const result = await store.get('key-1');
    expect(result).toEqual({ value: 'hello' });
  });

  it('存在しないキーはundefinedを返す', async () => {
    const store = createIdbStore({ dbName: 'idb-test', storeName: 'store' });
    const result = await store.get('missing');
    expect(result).toBeUndefined();
  });

  it('deleteでエントリを削除できる', async () => {
    const store = createIdbStore({ dbName: 'idb-test', storeName: 'store' });
    await store.put('key-1', { value: 'hello' });
    await store.delete('key-1');
    const result = await store.get('key-1');
    expect(result).toBeUndefined();
  });

  it('getAllKeysで全キーを取得できる', async () => {
    const store = createIdbStore({ dbName: 'idb-test', storeName: 'store' });
    await store.put('a', 1);
    await store.put('b', 2);
    const keys = await store.getAllKeys();
    expect([...keys].sort()).toEqual(['a', 'b']);
  });

  it('同名ストアがすでに存在するonupgradeneededでも再作成しない', async () => {
    const first = createIdbStore({ dbName: 'idb-test-existing', storeName: 'store' });
    await first.put('key-1', 'value-1');

    // 同じdbName/storeName/dbVersionで再度開いても、既存データを保持したまま利用できる
    const second = createIdbStore({ dbName: 'idb-test-existing', storeName: 'store' });
    const result = await second.get('key-1');
    expect(result).toBe('value-1');
  });

  it('putはtransactionの完了(コミット)後に解決する(read-after-writeの順序を保証する)', async () => {
    const store = createIdbStore({ dbName: 'idb-test', storeName: 'store' });
    await store.put('key-1', 'committed-value');
    // put解決後、別の独立したコネクション経由でも即座に読み出せる
    const readBack = await store.get('key-1');
    expect(readBack).toBe('committed-value');
  });

  describe('scheduleIdleCleanup', () => {
    beforeEach(() => {
      // requestIdleCallback未対応環境と同じsetTimeoutフォールバック経路をテストする。
      // fake-indexeddbは内部でsetTimeoutに依存するため、vi.useFakeTimersとは併用しない
      vi.stubGlobal('requestIdleCallback', undefined);
    });

    it('期限切れと判定されたキープレフィックス一致エントリのみ削除する', async () => {
      const store = createIdbStore({ dbName: 'idb-test', storeName: 'store' });
      await store.put('prefix:1', { expired: true });
      await store.put('prefix:2', { expired: false });
      await store.put('other:1', { expired: true });

      store.scheduleIdleCleanup({
        keyPrefix: 'prefix:',
        isExpired: (raw) => (raw as { expired: boolean }).expired,
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(await store.get('prefix:1')).toBeUndefined();
      expect(await store.get('prefix:2')).toEqual({ expired: false });
      // プレフィックスが一致しないキーは対象外
      expect(await store.get('other:1')).toEqual({ expired: true });
    });
  });
});

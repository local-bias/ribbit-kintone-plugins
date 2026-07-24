export interface IdbStore {
  get(key: string): Promise<unknown>;
  put(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
  getAllKeys(): Promise<string[]>;
  /**
   * 指定したキープレフィックスを持つエントリを対象に、アイドル時にまとめて期限切れ判定・削除を行う。
   * 呼び出し元ごとにエンベロープのスキーマが異なるため、期限切れ判定は呼び出し元に委譲する。
   */
  scheduleIdleCleanup(params: { keyPrefix: string; isExpired: (raw: unknown) => boolean }): void;
}

const CLEANUP_BATCH_SIZE = 20;

export const createIdbStore = (params: {
  dbName: string;
  storeName: string;
  dbVersion?: number;
}): IdbStore => {
  const { dbName, storeName, dbVersion = 1 } = params;

  const openCacheDb = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('この環境ではIndexedDBを利用できません'));
        return;
      }

      const request = indexedDB.open(dbName, dbVersion);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(storeName)) {
          request.result.createObjectStore(storeName);
        }
      };
      request.onsuccess = () => {
        const db = request.result;
        // 将来dbVersionを上げた際、旧バージョンの接続を保持したままの別タブがいると
        // このデータベースへの以後のopenがブロックされ続ける。自身の接続は
        // versionchangeを受けたら速やかに閉じ、ブロックを引き起こさないようにする
        db.onversionchange = () => db.close();
        resolve(db);
      };
      request.onerror = () => reject(request.error ?? new Error('IndexedDBのオープンに失敗しました'));
      request.onblocked = () =>
        reject(
          new Error(
            'IndexedDBのオープンがブロックされました(別のタブが古いバージョンの接続を保持しています)'
          )
        );
    });
  };

  const withStore = async <T>(
    mode: IDBTransactionMode,
    run: (store: IDBObjectStore) => IDBRequest<T>
  ): Promise<T> => {
    const db = await openCacheDb();
    try {
      return await new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(storeName, mode);
        const request = run(transaction.objectStore(storeName));
        let result: T;
        request.onsuccess = () => {
          result = request.result;
        };
        request.onerror = () => reject(request.error ?? new Error('IndexedDBの操作に失敗しました'));
        // requestのonsuccessはコミット前に発火するため、別コネクションからの
        // read-after-writeの順序を保証するにはtransactionの完了を待って解決する必要がある
        transaction.oncomplete = () => resolve(result);
        transaction.onerror = () =>
          reject(transaction.error ?? new Error('IndexedDBのトランザクションに失敗しました'));
        transaction.onabort = () =>
          reject(transaction.error ?? new Error('IndexedDBのトランザクションが中断されました'));
      });
    } finally {
      db.close();
    }
  };

  const get = (key: string): Promise<unknown> => withStore('readonly', (store) => store.get(key));

  const put = (key: string, value: unknown): Promise<void> =>
    withStore('readwrite', (store) => store.put(value, key)).then(() => undefined);

  const del = (key: string): Promise<void> =>
    withStore('readwrite', (store) => store.delete(key)).then(() => undefined);

  const getAllKeys = (): Promise<string[]> =>
    withStore('readonly', (store) => store.getAllKeys()) as Promise<string[]>;

  const scheduleIdleCleanup: IdbStore['scheduleIdleCleanup'] = ({ keyPrefix, isExpired }) => {
    const runCleanup = async () => {
      try {
        const keys = await getAllKeys();
        const ownKeys = keys.filter((key) => key.startsWith(keyPrefix));

        for (let i = 0; i < ownKeys.length; i += CLEANUP_BATCH_SIZE) {
          const batch = ownKeys.slice(i, i + CLEANUP_BATCH_SIZE);
          await Promise.all(
            batch.map(async (key) => {
              const raw = await get(key);
              if (isExpired(raw)) {
                await del(key).catch(() => undefined);
              }
            })
          );
        }
      } catch {
        // 掃除に失敗してもキャッシュ機能自体には影響しないため無視する
      }
    };

    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(() => void runCleanup());
    } else {
      setTimeout(() => void runCleanup(), 0);
    }
  };

  return { get, put, delete: del, getAllKeys, scheduleIdleCleanup };
};

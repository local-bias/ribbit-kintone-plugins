import { createIdbStore, createPersistenceGuard } from '@repo/idb-cache';

// レコードキャッシュとフィールド定義キャッシュは同一のIndexedDB/objectStoreを共有し、
// キープレフィックスで用途を区別する。永続化の有効/無効フラグ(quota超過時など)も
// 両者で共有し、片方が無効化されたらもう片方も同時に無効化されるようにする。
export const idbStore = createIdbStore({ dbName: 'ribbit-autocomplete-cache', storeName: 'record-cache' });
export const persistenceGuard = createPersistenceGuard();

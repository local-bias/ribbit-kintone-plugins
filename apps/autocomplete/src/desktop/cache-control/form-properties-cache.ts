import { createUpdatedFieldCodeCache } from '@repo/idb-cache';
import { isProd } from '@/lib/global';
import { idbStore, persistenceGuard } from './idb-store';

const CACHE_KEY_PREFIX = 'konomi-autocomplete-form-properties';

// srcAppId・guestSpaceIdのみでキーを構成する(createUpdatedFieldCodeCacheの既定動作)。
// 参照先アプリのフィールド定義はそのアプリ自体のスキーマであり、どの候補設定・
// プラグインインスタンス・ログインユーザーから見ても同一のため、それらでスコープを絞らず
// キャッシュを共有する(レコードキャッシュとは異なりACLで内容が変わらないため安全)
const updatedFieldCodeCache = createUpdatedFieldCodeCache({
  idbStore,
  keyPrefix: CACHE_KEY_PREFIX,
  debug: !isProd,
  persistenceGuard,
});

export const resolveUpdatedFieldCode = (params: {
  srcAppId: string;
  guestSpaceId: string | undefined;
}): Promise<string | null> => updatedFieldCodeCache.resolveUpdatedFieldCode(params);

/** 自プラグイン分の期限切れ・破損キャッシュをアイドル時にまとめて削除する */
export const scheduleExpiredFormPropertiesCleanup = (): void => updatedFieldCodeCache.scheduleCleanup();

import type { TargetCoordinate } from './asset-query';
import { SAFE_MODE_QUERY_KEY, SAFE_MODE_QUERY_VALUE, STORAGE_KEY_PREFIX } from './constants';

/**
 * localStorageに置く、ローカル無効化とセーフモードのフラグ
 *
 * アセットのコード本文は置かない(docs/05-runtime.md 2-2)。
 * `localStorage`はプライベートモード等で例外を投げうるため、全ての操作を例外に強くする。
 */

export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'>;

type StorageKind = 'muted' | 'safe-mode';

/** キーの末尾は必ずログインユーザー(別ユーザーのキーの掃除に使う) */
export const buildStorageKey = (
  kind: StorageKind,
  target: TargetCoordinate,
  loginUserCode: string
): string =>
  `${STORAGE_KEY_PREFIX}:${kind}:${target.spaceId}:${target.appId}:${encodeURIComponent(loginUserCode)}`;

const safeGet = (storage: StorageLike | null, key: string): string | null => {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
};

/** ローカル無効化したアセットIDを読みます。壊れた値は空として扱います */
export const readMutedIds = (
  storage: StorageLike | null,
  target: TargetCoordinate,
  loginUserCode: string
): Set<string> => {
  const raw = safeGet(storage, buildStorageKey('muted', target, loginUserCode));
  if (raw === null) {
    return new Set();
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return new Set(
      Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
    );
  } catch {
    return new Set();
  }
};

/**
 * セーフモードか判定します
 *
 * - URLクエリ`?ai-customize=off`: その場で1回だけ止める
 * - 対象座標・ユーザー別のキーに`'1'`: そのアプリだけ恒久的に止める(コンソールから設定できる)
 */
export const isSafeMode = (params: {
  search: string;
  storage: StorageLike | null;
  target: TargetCoordinate;
  loginUserCode: string;
}): boolean => {
  const query = new URLSearchParams(params.search).get(SAFE_MODE_QUERY_KEY);
  if (query === SAFE_MODE_QUERY_VALUE) {
    return true;
  }
  return (
    safeGet(params.storage, buildStorageKey('safe-mode', params.target, params.loginUserCode)) ===
    '1'
  );
};

/** セーフモードを解除したURL(クエリだけを外す) */
export const buildNormalModeUrl = (href: string): string => {
  const url = new URL(href);
  url.searchParams.delete(SAFE_MODE_QUERY_KEY);
  return url.toString();
};

/** セーフモードで開き直すURL(既存のクエリは保つ) */
export const buildSafeModeUrl = (href: string): string => {
  const url = new URL(href);
  url.searchParams.set(SAFE_MODE_QUERY_KEY, SAFE_MODE_QUERY_VALUE);
  return url.toString();
};

/**
 * 本プラグインのキーのうち、ログインユーザーが現在と異なるものを削除します
 *
 * 共有PCで前のユーザーのミュート・セーフモードの設定が残り続けないようにする。
 * 他プラグインのキーには触らない。
 */
export const removeOtherUsersKeys = (storage: StorageLike | null, loginUserCode: string): void => {
  if (storage === null) {
    return;
  }
  const current = encodeURIComponent(loginUserCode);
  try {
    const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter(
      (key): key is string => key?.startsWith(`${STORAGE_KEY_PREFIX}:`) === true
    );
    for (const key of keys) {
      if (key.slice(key.lastIndexOf(':') + 1) !== current) {
        storage.removeItem(key);
      }
    }
  } catch {
    // localStorageが使えない環境では何もしない(機能は落とさない)
  }
};

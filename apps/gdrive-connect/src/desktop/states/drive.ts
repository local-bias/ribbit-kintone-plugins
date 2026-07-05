import { atom } from '@repo/jotai';
import { refreshAccessToken } from '@/lib/oauth';
import { readStoredDriveToken, writeStoredDriveToken } from '@/lib/token-storage';

export interface DriveToken {
  accessToken: string;
  expiresAt: number;
  /** access_type=offlineで取得できた場合のみ保持する。ポップアップなしでの再認証に使う */
  refreshToken?: string;
}

const baseDriveTokenAtom = atom<DriveToken | null>(readStoredDriveToken());

/**
 * Googleドライブへのアクセストークン
 *
 * localStorageと同期し、ページ遷移やブラウザの再起動をまたいで保持する。
 * refreshTokenを保持している場合はアクセストークンの期限切れ後も{@link ensureValidDriveTokenAtom}で
 * ポップアップなしに更新できるため、実質的に無期限に利用を継続できる
 * (Googleでの取り消しや、未検証アプリの「テスト」ステータスによる失効は起こりうる)。
 */
export const driveTokenAtom = atom(
  (get) => get(baseDriveTokenAtom),
  (_get, set, token: DriveToken | null) => {
    set(baseDriveTokenAtom, token);
    writeStoredDriveToken(token);
  }
);

/** 現在保持しているアクセストークンが有効期限内かどうか(refreshTokenの有無は問わない) */
export const isDriveTokenValidAtom = atom((get) => {
  const token = get(driveTokenAtom);
  return !!token && token.expiresAt > Date.now();
});

/**
 * 有効なアクセストークンを確保します
 *
 * 既に有効なトークンがあればそれを返す。期限切れでもrefreshTokenがあれば、ポップアップを
 * 出さずに裏側でアクセストークンを更新して返す。refreshTokenが無い、または更新に失敗した場合は
 * nullを返す(呼び出し側で「Google Driveに接続」ボタンを表示する)。
 */
export const ensureValidDriveTokenAtom = atom(
  null,
  async (
    get,
    set,
    params: { clientId: string; clientSecret: string }
  ): Promise<DriveToken | null> => {
    const token = get(driveTokenAtom);
    if (token && token.expiresAt > Date.now()) {
      return token;
    }
    if (!token?.refreshToken) {
      return null;
    }
    try {
      const refreshed = await refreshAccessToken({
        refreshToken: token.refreshToken,
        clientId: params.clientId,
        clientSecret: params.clientSecret,
      });
      const next: DriveToken = { ...refreshed, refreshToken: token.refreshToken };
      set(driveTokenAtom, next);
      return next;
    } catch (cause) {
      console.error('[gdrive-connect] トークンの自動更新に失敗しました', cause);
      // refreshTokenが取り消し・失効している可能性が高いため、破棄して再接続を促す
      set(driveTokenAtom, null);
      return null;
    }
  }
);

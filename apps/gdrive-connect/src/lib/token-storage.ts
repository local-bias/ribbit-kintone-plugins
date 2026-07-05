export interface StoredDriveToken {
  accessToken: string;
  expiresAt: number;
  /** refresh_token(access_type=offlineで取得できた場合のみ)。長期間有効なため、これが機密度の高い情報になる */
  refreshToken?: string;
}

const STORAGE_KEY = 'gdrive-connect:token';

const isStoredDriveToken = (value: unknown): value is StoredDriveToken => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Partial<StoredDriveToken>;
  return (
    typeof candidate.accessToken === 'string' &&
    typeof candidate.expiresAt === 'number' &&
    (candidate.refreshToken === undefined || typeof candidate.refreshToken === 'string')
  );
};

/**
 * localStorageからトークンを復元します
 *
 * `refreshToken`があればブラウザを再起動してもGoogleへの再接続なしで利用を継続できるため
 * localStorageに保存する(refresh_tokenを持たない場合、実質的にはaccessTokenの有効期限(最大1時間)
 * までしか有効でないため、保存先がlocalStorageであること自体に追加のリスクはない)。
 *
 * accessTokenが期限切れでも、refreshTokenがあれば消さずに返す(呼び出し側で無音リフレッシュに使うため)。
 * refreshTokenも無く、accessTokenも期限切れの場合のみ利用不能と判断し削除する。
 */
export const readStoredDriveToken = (): StoredDriveToken | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!isStoredDriveToken(parsed)) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    if (parsed.expiresAt <= Date.now() && !parsed.refreshToken) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    // localStorageが利用できない環境(プライベートブラウジング等)やJSON破損時はメモリ上の保持のみで動作する
    return null;
  }
};

/** トークンをlocalStorageへ保存します(nullを渡すと削除します) */
export const writeStoredDriveToken = (token: StoredDriveToken | null): void => {
  try {
    if (token) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(token));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // localStorageが利用できない環境ではメモリ上の保持のみで動作する
  }
};

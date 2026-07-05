import config from '@/../plugin.config.mjs';

export const PLUGIN_NAME = config.manifest.base.name.ja;

/**
 * OAuth認可後にGoogleからリダイレクトされる、このプラグイン専用の静的コールバックページ
 *
 * `scripts/merge-outputs.ts`によって`src/contents/oauth-callback.html`がこのURLに配信される
 * Google Cloud ConsoleのOAuthクライアント設定で、承認済みのリダイレクトURIとして登録する必要がある
 */
export const OAUTH_CALLBACK_URL =
  'https://kintone-plugin.konomi.app/gdrive-connect/oauth-callback.html';

/** Googleドライブへの読み書きに必要なOAuthスコープ */
export const DRIVE_OAUTH_SCOPE = 'https://www.googleapis.com/auth/drive';

export const GOOGLE_OAUTH_AUTHORIZATION_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
export const GOOGLE_OAUTH_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
export const GOOGLE_DRIVE_API_BASE_URL = 'https://www.googleapis.com/drive/v3';
export const GOOGLE_DRIVE_UPLOAD_API_BASE_URL = 'https://www.googleapis.com/upload/drive/v3';

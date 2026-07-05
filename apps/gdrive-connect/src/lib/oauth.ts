import {
  DRIVE_OAUTH_SCOPE,
  GOOGLE_OAUTH_AUTHORIZATION_ENDPOINT,
  GOOGLE_OAUTH_TOKEN_ENDPOINT,
  OAUTH_CALLBACK_URL,
} from '@/lib/constants';
import { generateCodeChallenge, generateCodeVerifier, generateState } from '@/lib/pkce';
import { ketch } from './browser';

/** ポップアップウィンドウを介した認可リクエストで発生しうるエラー */
export class OAuthPopupError extends Error {}

interface OAuthCallbackMessage {
  source: 'gdrive-connect-oauth-callback';
  code: string | null;
  state: string | null;
  error: string | null;
}

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === 'string';

const isOAuthCallbackMessage = (data: unknown): data is OAuthCallbackMessage => {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const candidate = data as Partial<OAuthCallbackMessage>;
  return (
    candidate.source === 'gdrive-connect-oauth-callback' &&
    isNullableString(candidate.code) &&
    isNullableString(candidate.state) &&
    isNullableString(candidate.error)
  );
};

/**
 * Google OAuth 2.0の認可エンドポイントURLを構築します(Authorization Code + PKCE)
 */
export const buildAuthUrl = (params: {
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
  scope?: string;
}): string => {
  const { clientId, redirectUri, state, codeChallenge, scope = DRIVE_OAUTH_SCOPE } = params;
  const query = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    // refresh_tokenを取得し、ブラウザを再起動しても再接続なしで利用できるようにする
    access_type: 'offline',
    // 複数のGoogleアカウントがブラウザにログインしている場合に、意図しないアカウントで
    // サイレントに連携されるのを防ぐため、毎回アカウント選択画面を強制表示する。
    // また、access_type=offlineでrefresh_tokenを毎回確実に取得するにはprompt=consentが必要
    prompt: 'select_account consent',
  });
  return `${GOOGLE_OAUTH_AUTHORIZATION_ENDPOINT}?${query.toString()}`;
};

const POPUP_CLOSE_POLL_INTERVAL_MS = 500;

/**
 * ポップアップウィンドウを開き、Googleの認可コードを取得するまで待機します
 *
 * ポップアップブロックを回避するため、ユーザー操作(クリックハンドラ内)から直接呼び出す必要があります
 */
const requestAuthorizationCode = (authUrl: string): Promise<{ code: string; state: string }> => {
  return new Promise((resolve, reject) => {
    const popup = window.open(authUrl, 'gdrive-connect-oauth', 'width=500,height=650');
    if (!popup) {
      reject(new OAuthPopupError('ポップアップウィンドウを開けませんでした。'));
      return;
    }

    let settled = false;

    // kintone側にCross-Origin-Opener-Policyが設定されている環境では、popup.closedへの
    // アクセスがブラウザにブロックされることがある(コンソールに警告が出るのみで例外は投げないことが
    // 多いが、念のため安全に倒す)。判定不能な場合は「閉じられていない」とみなす。
    const isPopupClosed = (): boolean => {
      try {
        return popup.closed;
      } catch {
        return false;
      }
    };

    const closePopup = () => {
      try {
        if (!isPopupClosed()) {
          popup.close();
        }
      } catch {
        // COOP等により閉じられない場合は無視する(ユーザーが手動で閉じればよい)
      }
    };

    const cleanup = () => {
      window.removeEventListener('message', onMessage);
      clearInterval(closeCheckTimer);
    };

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== new URL(OAUTH_CALLBACK_URL).origin) {
        return;
      }
      if (!isOAuthCallbackMessage(event.data)) {
        return;
      }
      settled = true;
      cleanup();
      closePopup();
      const { code, error } = event.data;
      if (error || !code) {
        reject(new OAuthPopupError(error ?? 'Googleからの認可コードを取得できませんでした。'));
        return;
      }
      resolve({ code, state: event.data.state ?? '' });
    };

    const closeCheckTimer = setInterval(() => {
      if (isPopupClosed() && !settled) {
        cleanup();
        reject(new OAuthPopupError('認可がキャンセルされました。'));
      }
    }, POPUP_CLOSE_POLL_INTERVAL_MS);

    window.addEventListener('message', onMessage);
  });
};

interface TokenResponse {
  access_token: string;
  expires_in: number;
  /** access_type=offlineでの初回認可時のみ発行される。以降のrefresh_token交換では返却されない */
  refresh_token?: string;
}

/**
 * トークン交換リクエストのボディを構築します
 *
 * Googleの仕様上、「ウェブアプリケーション」タイプのOAuthクライアントはPKCE使用時も
 * `client_secret`を必須とするため、`code_verifier`と併せて送信する
 */
export const buildTokenRequestBody = (params: {
  code: string;
  codeVerifier: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}): string => {
  const { code, codeVerifier, clientId, clientSecret, redirectUri } = params;
  return new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  }).toString();
};

/**
 * 認可コードをアクセストークンに交換します(`kintone.proxy`経由)
 */
const exchangeCodeForToken = async (params: {
  code: string;
  codeVerifier: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}): Promise<TokenResponse> => {
  const response = await ketch(GOOGLE_OAUTH_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: buildTokenRequestBody(params),
  });
  if (!response.ok) {
    throw new Error(`トークンの取得に失敗しました(status: ${response.status})`);
  }
  return response.json();
};

/** refresh_tokenからの再交換リクエストのボディを構築します */
export const buildRefreshTokenRequestBody = (params: {
  refreshToken: string;
  clientId: string;
  clientSecret: string;
}): string => {
  const { refreshToken, clientId, clientSecret } = params;
  return new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  }).toString();
};

/**
 * refresh_tokenを使い、ポップアップなしでアクセストークンを再取得します
 *
 * refresh_tokenが失効・取り消されている場合(例: 未検証アプリの「テスト」ステータスでは7日で失効する)、
 * Googleは`invalid_grant`エラーを返す。呼び出し側でエラーを捕捉し、再接続を促す必要がある。
 */
export const refreshAccessToken = async (params: {
  refreshToken: string;
  clientId: string;
  clientSecret: string;
}): Promise<{ accessToken: string; expiresAt: number }> => {
  const response = await ketch(GOOGLE_OAUTH_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: buildRefreshTokenRequestBody(params),
  });
  if (!response.ok) {
    throw new Error(`トークンの自動更新に失敗しました(status: ${response.status})`);
  }
  const token: TokenResponse = await response.json();
  return {
    accessToken: token.access_token,
    expiresAt: Date.now() + token.expires_in * 1000,
  };
};

/**
 * Googleへの認可からアクセストークン取得までの一連のOAuthフローを実行します
 *
 * ユーザーの明示的なクリック操作から呼び出してください(ポップアップブロック回避のため)
 */
export const startOAuthFlow = async (params: {
  clientId: string;
  clientSecret: string;
}): Promise<{ accessToken: string; expiresAt: number; refreshToken?: string }> => {
  const { clientId, clientSecret } = params;
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateState();

  const authUrl = buildAuthUrl({
    clientId,
    redirectUri: OAUTH_CALLBACK_URL,
    state,
    codeChallenge,
  });

  const { code, state: returnedState } = await requestAuthorizationCode(authUrl);
  if (returnedState !== state) {
    throw new OAuthPopupError('認可リクエストの整合性を検証できませんでした。');
  }

  const token = await exchangeCodeForToken({
    code,
    codeVerifier,
    clientId,
    clientSecret,
    redirectUri: OAUTH_CALLBACK_URL,
  });

  return {
    accessToken: token.access_token,
    expiresAt: Date.now() + token.expires_in * 1000,
    refreshToken: token.refresh_token,
  };
};

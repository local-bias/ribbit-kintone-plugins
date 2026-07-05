const BASE64URL_LOOKUP = { '+': '-', '/': '_' } as const;

const toBase64Url = (bytes: Uint8Array): string => {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/[+/]/g, (char) => BASE64URL_LOOKUP[char as keyof typeof BASE64URL_LOOKUP])
    .replace(/=+$/, '');
};

/**
 * PKCE(RFC 7636)の`code_verifier`を生成します
 *
 * 32バイトの乱数をbase64url変換するため、43文字(RFC 7636が要求する43〜128文字の範囲内)の文字列になります
 */
export const generateCodeVerifier = (): string => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
};

/**
 * PKCE(RFC 7636)の`code_challenge`を生成します
 *
 * `code_verifier`のSHA-256ハッシュをbase64url変換します(`code_challenge_method=S256`)
 */
export const generateCodeChallenge = async (verifier: string): Promise<string> => {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return toBase64Url(new Uint8Array(digest));
};

/**
 * OAuth認可リクエストの`state`パラメータに使用するランダムな文字列を生成します
 */
export const generateState = (): string => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
};

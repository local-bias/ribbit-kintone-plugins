import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/global', () => ({
  isDev: false,
  isProd: true,
  PLUGIN_ID: 'test-plugin-id',
  GUEST_SPACE_ID: undefined,
  LANGUAGE: 'ja',
}));

import { GOOGLE_OAUTH_AUTHORIZATION_ENDPOINT } from '@/lib/constants';
import { buildAuthUrl, buildRefreshTokenRequestBody, buildTokenRequestBody } from './oauth';

describe('buildAuthUrl', () => {
  it('Google認可エンドポイントを起点としたURLを生成する', () => {
    const url = buildAuthUrl({
      clientId: 'test-client-id',
      redirectUri: 'https://example.com/callback',
      state: 'test-state',
      codeChallenge: 'test-challenge',
    });
    expect(url.startsWith(`${GOOGLE_OAUTH_AUTHORIZATION_ENDPOINT}?`)).toBe(true);
  });

  it('PKCEとAuthorization Codeフローに必要なクエリパラメータを全て含む', () => {
    const url = buildAuthUrl({
      clientId: 'test-client-id',
      redirectUri: 'https://example.com/callback',
      state: 'test-state',
      codeChallenge: 'test-challenge',
    });
    const params = new URL(url).searchParams;
    expect(params.get('client_id')).toBe('test-client-id');
    expect(params.get('redirect_uri')).toBe('https://example.com/callback');
    expect(params.get('response_type')).toBe('code');
    expect(params.get('state')).toBe('test-state');
    expect(params.get('code_challenge')).toBe('test-challenge');
    expect(params.get('code_challenge_method')).toBe('S256');
  });

  it('意図しないGoogleアカウントでの連携を防ぐため、毎回アカウント選択画面を要求する', () => {
    const url = buildAuthUrl({
      clientId: 'test-client-id',
      redirectUri: 'https://example.com/callback',
      state: 'test-state',
      codeChallenge: 'test-challenge',
    });
    const params = new URL(url).searchParams;
    expect(params.get('prompt')).toBe('select_account consent');
  });

  it('refresh_tokenを取得できるよう、access_type=offlineを要求する', () => {
    const url = buildAuthUrl({
      clientId: 'test-client-id',
      redirectUri: 'https://example.com/callback',
      state: 'test-state',
      codeChallenge: 'test-challenge',
    });
    const params = new URL(url).searchParams;
    expect(params.get('access_type')).toBe('offline');
  });

  it('デフォルトでGoogleドライブの完全アクセススコープを要求する', () => {
    const url = buildAuthUrl({
      clientId: 'test-client-id',
      redirectUri: 'https://example.com/callback',
      state: 'test-state',
      codeChallenge: 'test-challenge',
    });
    const params = new URL(url).searchParams;
    expect(params.get('scope')).toBe('https://www.googleapis.com/auth/drive');
  });

  it('scopeを指定した場合はそちらを優先する', () => {
    const url = buildAuthUrl({
      clientId: 'test-client-id',
      redirectUri: 'https://example.com/callback',
      state: 'test-state',
      codeChallenge: 'test-challenge',
      scope: 'https://www.googleapis.com/auth/drive.readonly',
    });
    const params = new URL(url).searchParams;
    expect(params.get('scope')).toBe('https://www.googleapis.com/auth/drive.readonly');
  });
});

describe('buildTokenRequestBody', () => {
  it('client_secretを含む、認可コード交換に必要な全パラメータをフォームエンコードして返す', () => {
    const body = buildTokenRequestBody({
      code: 'test-code',
      codeVerifier: 'test-verifier',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      redirectUri: 'https://example.com/callback',
    });
    const params = new URLSearchParams(body);
    expect(params.get('grant_type')).toBe('authorization_code');
    expect(params.get('code')).toBe('test-code');
    expect(params.get('code_verifier')).toBe('test-verifier');
    expect(params.get('client_id')).toBe('test-client-id');
    expect(params.get('client_secret')).toBe('test-client-secret');
    expect(params.get('redirect_uri')).toBe('https://example.com/callback');
  });
});

describe('buildRefreshTokenRequestBody', () => {
  it('refresh_token grantに必要な全パラメータをフォームエンコードして返す', () => {
    const body = buildRefreshTokenRequestBody({
      refreshToken: 'test-refresh-token',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
    });
    const params = new URLSearchParams(body);
    expect(params.get('grant_type')).toBe('refresh_token');
    expect(params.get('refresh_token')).toBe('test-refresh-token');
    expect(params.get('client_id')).toBe('test-client-id');
    expect(params.get('client_secret')).toBe('test-client-secret');
  });
});

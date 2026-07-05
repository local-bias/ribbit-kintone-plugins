import { describe, expect, it } from 'vitest';
import { generateCodeChallenge, generateCodeVerifier, generateState } from './pkce';

const UNRESERVED_CHARSET_PATTERN = /^[A-Za-z0-9\-._~]+$/;
const BASE64URL_PATTERN = /^[A-Za-z0-9\-_]+$/;

describe('generateCodeVerifier', () => {
  it('生成された文字列がRFC7636の許可文字集合のみで構成される', () => {
    const verifier = generateCodeVerifier();
    expect(verifier).toMatch(UNRESERVED_CHARSET_PATTERN);
  });

  it('生成された文字列の長さがRFC7636の範囲内(43〜128文字)である', () => {
    const verifier = generateCodeVerifier();
    expect(verifier.length).toBeGreaterThanOrEqual(43);
    expect(verifier.length).toBeLessThanOrEqual(128);
  });

  it('呼び出すたびに異なる値を生成する', () => {
    const a = generateCodeVerifier();
    const b = generateCodeVerifier();
    expect(a).not.toBe(b);
  });
});

describe('generateCodeChallenge', () => {
  it('SHA-256ダイジェストをbase64url変換した43文字の文字列を返す', async () => {
    const challenge = await generateCodeChallenge('test-verifier');
    expect(challenge).toMatch(BASE64URL_PATTERN);
    expect(challenge.length).toBe(43);
  });

  it('同一のverifierに対しては常に同じchallengeを返す(決定的)', async () => {
    const a = await generateCodeChallenge('fixed-verifier-value');
    const b = await generateCodeChallenge('fixed-verifier-value');
    expect(a).toBe(b);
  });

  it('異なるverifierに対しては異なるchallengeを返す', async () => {
    const a = await generateCodeChallenge('verifier-a');
    const b = await generateCodeChallenge('verifier-b');
    expect(a).not.toBe(b);
  });
});

describe('generateState', () => {
  it('base64urlの文字集合のみで構成される', () => {
    const state = generateState();
    expect(state).toMatch(BASE64URL_PATTERN);
  });

  it('呼び出すたびに異なる値を生成する', () => {
    const a = generateState();
    const b = generateState();
    expect(a).not.toBe(b);
  });
});

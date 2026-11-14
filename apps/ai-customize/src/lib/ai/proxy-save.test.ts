import { describe, expect, test } from 'vitest';
import { planProxySave } from './proxy-save';

const OPENAI = 'https://api.openai.com/v1/responses';
const settings = {
  providerType: 'openai' as const,
  baseUrl: '',
  azureResourceName: '',
  azureDeploymentName: '',
  azureApiVersion: '',
  model: 'gpt-x',
};
const nothingSaved = { endpoint: '', keyRegistered: false };
const savedOpenAi = { endpoint: OPENAI, keyRegistered: true };

describe('planProxySave', () => {
  test('APIキーを入力したら、送信先へ認証ヘッダーを登録する(初めての送信先は確認する)', () => {
    expect(planProxySave(settings, ' sk-1 ', nothingSaved)).toEqual({
      ok: true,
      register: { url: OPENAI, headers: { authorization: 'Bearer sk-1' } },
      unregister: null,
      registeredProxyEndpoint: OPENAI,
      confirmDestination: true,
    });
  });

  test('保存済みの送信先にキーが登録されていれば、キーを入力しなくても保存できる', () => {
    expect(planProxySave({ ...settings, model: 'other' }, '', savedOpenAi)).toMatchObject({
      ok: true,
      register: null,
      unregister: null,
      registeredProxyEndpoint: OPENAI,
    });
  });

  test('同じホストへキーを入れ直すときは確認しない', () => {
    expect(planProxySave(settings, 'sk-2', savedOpenAi)).toMatchObject({
      ok: true,
      confirmDestination: false,
    });
  });

  test('送信先が変わったら、キーを入力し直すまで保存させない', () => {
    expect(planProxySave({ ...settings, providerType: 'anthropic' }, '', savedOpenAi)).toEqual({
      ok: false,
      reason: 'key-required',
    });
  });

  test('保存済みの送信先でも、キーが実際に登録されていなければ入力させる(インポートした設定)', () => {
    expect(planProxySave(settings, '', { endpoint: OPENAI, keyRegistered: false })).toEqual({
      ok: false,
      reason: 'key-required',
    });
  });

  test('新しい送信先に登録したら、保存済みの旧送信先の登録を無効にし、別ホストなので確認する', () => {
    expect(
      planProxySave({ ...settings, providerType: 'anthropic' }, 'key', savedOpenAi)
    ).toMatchObject({
      ok: true,
      register: { url: 'https://api.anthropic.com/v1/messages', headers: { 'x-api-key': 'key' } },
      unregister: OPENAI,
      confirmDestination: true,
    });
  });

  test('AIの項目を全て空にしたら、保存済みの登録を消す', () => {
    expect(planProxySave({ ...settings, model: '' }, '', savedOpenAi)).toEqual({
      ok: true,
      register: null,
      unregister: OPENAI,
      registeredProxyEndpoint: '',
      confirmDestination: false,
    });
  });

  test('入力が不正なら理由を返して保存させない', () => {
    expect(
      planProxySave(
        { ...settings, providerType: 'custom', baseUrl: 'http://x', model: 'm' },
        'k',
        nothingSaved
      )
    ).toEqual({ ok: false, reason: 'invalid-base-url' });
  });
});

import { describe, expect, test } from 'vitest';
import { createTestCommonConfig } from '@/test/fixtures';
import { checkChatConfig, detectScreen } from './chat-availability';

describe('checkChatConfig', () => {
  const common = createTestCommonConfig({ providerType: 'openai', model: 'gpt-x' });

  test('いまの設定の送信先にAPIキーが登録済みなら使える', () => {
    expect(
      checkChatConfig({ ...common, registeredProxyEndpoint: 'https://api.openai.com/v1/responses' })
    ).toMatchObject({ ok: true });
  });

  test('未登録や、設定を変えて送信先が変わったら使えない', () => {
    expect(checkChatConfig(common)).toEqual({ ok: false, reason: 'key-not-registered' });
    expect(
      checkChatConfig({
        ...common,
        providerType: 'anthropic',
        registeredProxyEndpoint: 'https://api.openai.com/v1/responses',
      })
    ).toEqual({ ok: false, reason: 'key-not-registered' });
    expect(checkChatConfig({ ...common, model: '' })).toEqual({
      ok: false,
      reason: 'model-required',
    });
  });
});

describe('detectScreen', () => {
  const base = 'https://example.cybozu.com';
  test.each([
    [`${base}/k/42/`, 'index', null],
    [`${base}/k/42/?view=5`, 'index', null],
    [`${base}/k/42/edit`, 'create', null],
    [`${base}/k/42/show#record=7`, 'detail', '7'],
    [`${base}/k/42/show#record=7&mode=edit`, 'edit', '7'],
    [`${base}/k/guest/3/42/show#record=7&l.view=1`, 'detail', '7'],
    [`${base}/k/guest/3/42/edit`, 'create', null],
  ])('%s は %s', (url, screen, recordId) => {
    expect(detectScreen(url)).toEqual({ screen, recordId });
  });
});

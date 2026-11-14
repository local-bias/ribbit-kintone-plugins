import { generateText } from 'ai';
import { describe, expect, test } from 'vitest';
import {
  buildAuthHeaders,
  buildProxyEndpoint,
  type ProviderSettings,
  requiresKeyReentry,
} from './endpoint';
import { createLanguageModel, PROXY_MANAGED_API_KEY } from './provider-factory';

const base: ProviderSettings = {
  providerType: 'openai',
  baseUrl: '',
  azureResourceName: '',
  azureDeploymentName: '',
  azureApiVersion: '',
  model: 'model-x',
};

const cases: [string, Partial<ProviderSettings>, string, string][] = [
  ['openai', { providerType: 'openai' }, 'https://api.openai.com/v1/responses', 'authorization'],
  [
    'anthropic',
    { providerType: 'anthropic' },
    'https://api.anthropic.com/v1/messages',
    'x-api-key',
  ],
  [
    'google',
    { providerType: 'google', model: 'gemini-x' },
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-x:generateContent',
    'x-goog-api-key',
  ],
  [
    'azure',
    {
      providerType: 'azure-openai',
      azureResourceName: 'res',
      azureDeploymentName: 'dep',
      azureApiVersion: '2024-10-21',
      model: '',
    },
    'https://res.openai.azure.com/openai/deployments/dep/chat/completions?api-version=2024-10-21',
    'api-key',
  ],
  [
    'azure(APIバージョン未指定)',
    {
      providerType: 'azure-openai',
      azureResourceName: 'res',
      azureDeploymentName: 'dep',
      model: '',
    },
    'https://res.openai.azure.com/openai/deployments/dep/chat/completions?api-version=v1',
    'api-key',
  ],
  [
    'openrouter',
    { providerType: 'openrouter', model: 'a/b' },
    'https://openrouter.ai/api/v1/chat/completions',
    'authorization',
  ],
  [
    'custom',
    { providerType: 'custom', baseUrl: 'https://llm.example.com/v1/' },
    'https://llm.example.com/v1/chat/completions',
    'authorization',
  ],
];

/** 生成リクエストを送らせ、送信先と認証ヘッダーだけを記録する */
const captureRequest = async (settings: ProviderSettings) => {
  let captured: { url: string; method?: string; headers: Headers } | null = null;
  const fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    captured = { url: String(input), method: init?.method, headers: new Headers(init?.headers) };
    throw new Error('captured');
  }) as typeof globalThis.fetch;
  const model = await createLanguageModel(settings, fetch);
  await generateText({ model, prompt: 'x', maxRetries: 0 }).catch(() => {});
  if (captured === null) throw new Error('no request');
  return captured as { url: string; method?: string; headers: Headers };
};

describe('buildProxyEndpoint とプロバイダーの実リクエスト', () => {
  test.each(cases)(
    '%s: 算出したURLへ、sentinelの認証ヘッダーでPOSTする',
    async (_, overrides, url, header) => {
      const settings = { ...base, ...overrides };
      const result = buildProxyEndpoint(settings);
      expect(result).toMatchObject({ ok: true, endpoint: { url, method: 'POST' } });

      const request = await captureRequest(settings);
      expect(request.url).toBe(url);
      expect(request.method).toBe('POST');
      expect(request.headers.get(header)).toContain(PROXY_MANAGED_API_KEY);

      // proxy設定へ保存するヘッダーは、SDKが送るヘッダーと同じ名前・形(保存済みの値で上書きされる)
      const saved = buildAuthHeaders(settings.providerType, 'real-key');
      const [name, value] = Object.entries(saved)[0] ?? [];
      expect(name).toBe(header);
      expect(request.headers.get(header)).toBe(value?.replace('real-key', PROXY_MANAGED_API_KEY));
    }
  );
});

describe('buildProxyEndpoint の検証', () => {
  test('モデル未入力・URLの形を変えるモデルIDやデプロイ名を拒否する', () => {
    expect(buildProxyEndpoint({ ...base, model: ' ' })).toEqual({
      ok: false,
      reason: 'model-required',
    });
    expect(buildProxyEndpoint({ ...base, providerType: 'google', model: '../x' })).toEqual({
      ok: false,
      reason: 'invalid-model',
    });
    expect(
      buildProxyEndpoint({
        ...base,
        providerType: 'azure-openai',
        azureResourceName: 'evil.example.com/x',
        azureDeploymentName: 'dep',
      })
    ).toEqual({ ok: false, reason: 'azure-resource-required' });
    expect(
      buildProxyEndpoint({
        ...base,
        providerType: 'azure-openai',
        azureResourceName: 'res',
        azureDeploymentName: 'dep?x=1',
      })
    ).toEqual({ ok: false, reason: 'azure-deployment-required' });
  });

  test('OpenAI互換APIのベースURLは https で、ユーザー情報・クエリを含まないこと', () => {
    for (const baseUrl of [
      'http://llm.example.com/v1',
      'https://user:pass@llm.example.com/v1',
      'https://llm.example.com/v1?x=1',
      'https://llm.example.com/v1#a',
      'not a url',
    ]) {
      expect(buildProxyEndpoint({ ...base, providerType: 'custom', baseUrl })).toEqual({
        ok: false,
        reason: 'invalid-base-url',
      });
    }
  });
});

describe('requiresKeyReentry', () => {
  test('送信先が変わるときだけAPIキーを登録し直す', () => {
    const google = { ...base, providerType: 'google' as const, model: 'gemini-a' };
    const registered =
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-a:generateContent';
    expect(requiresKeyReentry(registered, google)).toBe(false);
    // Googleはモデルを変えると送信先が変わる
    expect(requiresKeyReentry(registered, { ...google, model: 'gemini-b' })).toBe(true);
    // OpenAIはモデルを変えても送信先は同じ
    expect(
      requiresKeyReentry('https://api.openai.com/v1/responses', { ...base, model: 'other-model' })
    ).toBe(false);
    expect(requiresKeyReentry('', base)).toBe(true);
  });
});

describe('buildProxyEndpoint と createLanguageModel の正規化', () => {
  test.each<[string, Partial<ProviderSettings>]>([
    ['前後の空白のあるモデル', { providerType: 'google', model: ' gemini-x ' }],
    [
      '末尾に複数の/',
      { providerType: 'custom', baseUrl: ' https://LLM.example.com/v1// ', model: 'm' },
    ],
    [
      'Azureの空白',
      {
        providerType: 'azure-openai',
        azureResourceName: ' res ',
        azureDeploymentName: ' dep ',
        azureApiVersion: ' ',
        model: '',
      },
    ],
  ])('%s でも、算出した送信先と実際の送信先が一致する', async (_, overrides) => {
    const settings = { ...base, ...overrides };
    const result = buildProxyEndpoint(settings);
    if (!result.ok) throw new Error(result.reason);
    const request = await captureRequest(settings);
    expect(request.url).toBe(result.endpoint.url);
  });
});

import { describe, expect, test, vi } from 'vitest';
import { buildProxyEndpoint, type ProxyEndpoint } from './endpoint';
import { createRestrictedProxyFetch, type ProxyFetch, ProxyFetchError } from './proxy-fetch';

const endpointResult = buildProxyEndpoint({
  providerType: 'azure-openai',
  baseUrl: '',
  azureResourceName: 'res',
  azureDeploymentName: 'dep',
  azureApiVersion: '2024-10-21',
  model: '',
});
if (!endpointResult.ok) throw new Error('fixture');
const endpoint: ProxyEndpoint = endpointResult.endpoint;
const URL_OK = endpoint.url;

const okResponse = () => new Response('{"ok":true}', { status: 200 });

const setup = (proxyFetch: ProxyFetch = vi.fn(async () => okResponse())) => {
  let fireTimeout = () => {};
  const fetch = createRestrictedProxyFetch({
    endpoint,
    proxyFetch,
    setTimer: (callback) => {
      fireTimeout = callback;
      return () => {};
    },
  });
  return { fetch, proxyFetch, fireTimeout: () => fireTimeout() };
};

const post = { method: 'POST', headers: { 'api-key': 'x' }, body: '{"a":1}' };

describe('createRestrictedProxyFetch', () => {
  test('文字列とRequestのどちらで渡されても、同じURL・メソッド・ヘッダー・本文をproxyへ渡す', async () => {
    const { fetch, proxyFetch } = setup();
    await fetch(URL_OK, post);
    await fetch(new Request(URL_OK, post));
    const calls = vi.mocked(proxyFetch).mock.calls;
    expect(calls).toHaveLength(2);
    for (const [url, init] of calls) {
      expect(url).toBe(URL_OK);
      expect(init?.method).toBe('POST');
      expect(new Headers(init?.headers).get('api-key')).toBe('x');
      expect(init?.body).toBe('{"a":1}');
    }
  });

  test('登録した送信先と完全一致しなければ、通信せずに拒否する', async () => {
    const { fetch, proxyFetch } = setup();
    const blocked = [
      // 前方一致は通さない
      `${URL_OK}&x=1`,
      'https://res.openai.azure.com/openai/deployments/dep/chat/completions/extra?api-version=2024-10-21',
      'https://res.openai.azure.com/openai/deployments/dep/chat/completions',
      'https://res.openai.azure.com.evil.example/openai/deployments/dep/chat/completions?api-version=2024-10-21',
      'https://user@res.openai.azure.com/openai/deployments/dep/chat/completions?api-version=2024-10-21',
      'http://res.openai.azure.com/openai/deployments/dep/chat/completions?api-version=2024-10-21',
      `${URL_OK}#x`,
    ];
    for (const url of blocked) {
      await expect(fetch(url, post)).rejects.toMatchObject({ kind: 'blocked' });
    }
    await expect(fetch(URL_OK, { ...post, method: 'GET', body: undefined })).rejects.toMatchObject({
      kind: 'blocked',
    });
    expect(proxyFetch).not.toHaveBeenCalled();
  });

  test('3xxは最終的な送信先を検証できないためエラーにする', async () => {
    const { fetch } = setup(vi.fn(async () => new Response('', { status: 302 })));
    await expect(fetch(URL_OK, post)).rejects.toMatchObject({ kind: 'redirect' });
  });

  test('ketchが組み立てられない応答(204・範囲外のstatus)は、表示用のエラーにする', async () => {
    for (const status of [204, 0, 600]) {
      const { fetch } = setup(
        vi.fn(async () => new Response('', { status })) // ketchと同じく new Response が投げる
      );
      await expect(fetch(URL_OK, post)).rejects.toMatchObject({ kind: 'invalid-response' });
    }
  });

  test('proxyの失敗はネットワークのエラーにする', async () => {
    const { fetch } = setup(
      vi.fn(async () => {
        throw ['', 502, {}];
      })
    );
    await expect(fetch(URL_OK, post)).rejects.toMatchObject({ kind: 'network' });
  });

  test('中断したらすぐにrejectし、後から届いた応答は捨てる', async () => {
    let resolve: (response: Response) => void = () => {};
    const { fetch } = setup(vi.fn(() => new Promise<Response>((r) => (resolve = r))));
    const controller = new AbortController();
    const pending = fetch(URL_OK, { ...post, signal: controller.signal });
    controller.abort(new DOMException('stop', 'AbortError'));
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    resolve(okResponse());
  });

  test('中断済みのsignalなら送らない', async () => {
    const { fetch, proxyFetch } = setup();
    const controller = new AbortController();
    controller.abort();
    await expect(fetch(URL_OK, { ...post, signal: controller.signal })).rejects.toBeDefined();
    expect(proxyFetch).not.toHaveBeenCalled();
  });

  test('待つ上限を過ぎたらタイムアウトにする', async () => {
    const { fetch, fireTimeout } = setup(vi.fn(() => new Promise<Response>(() => {})));
    const pending = fetch(URL_OK, post);
    // 送信の準備(本文の読み取り)が終わり、待機に入るまで待つ
    await new Promise((resolve) => setTimeout(resolve, 0));
    fireTimeout();
    await expect(pending).rejects.toBeInstanceOf(ProxyFetchError);
    await expect(pending).rejects.toMatchObject({ kind: 'timeout' });
  });
});

describe('createRestrictedProxyFetch と実際の ketch', () => {
  const setupKetch = async (response: [string, number, Record<string, string>]) => {
    const proxy = vi.fn(async () => response);
    vi.stubGlobal('kintone', { plugin: { app: { proxy } } });
    const { createKetch } = await import('@konomi-app/ketch');
    const fetch = createRestrictedProxyFetch({
      endpoint,
      proxyFetch: createKetch({ pluginId: 'plugin-x', debug: false }),
    });
    return { fetch, proxy };
  };

  test('sentinelの認証ヘッダーを取り除き、URL・メソッド・本文を kintone.plugin.app.proxy へ渡す', async () => {
    const { fetch, proxy } = await setupKetch(['{"ok":true}', 200, {}]);
    const response = await fetch(URL_OK, {
      method: 'POST',
      headers: { 'api-key': '__KINTONE_PROXY_MANAGED__', 'content-type': 'application/json' },
      body: '{"a":1}',
    });
    expect(await response.json()).toEqual({ ok: true });
    expect(proxy).toHaveBeenCalledWith(
      'plugin-x',
      URL_OK,
      'POST',
      { 'content-type': 'application/json' },
      '{"a":1}'
    );
  });

  test('204 や範囲外のstatusは、例外ではなく表示用のエラーにする', async () => {
    for (const status of [204, 0, 600]) {
      const { fetch } = await setupKetch(['', status, {}]);
      await expect(fetch(URL_OK, post)).rejects.toMatchObject({ kind: 'invalid-response' });
    }
  });
});

import { describe, expect, test, vi } from 'vitest';
import type { AssetPermission } from '@/schema/asset';
import type { AssetGrants } from './asset-filter';
import { type AssetKintoneOptions, createAssetKintone, type KintoneGlobal } from './asset-kintone';
import { createEventBridge } from './event-bridge';
import { PERMISSION_DENIED_CODE, type PermissionDeniedError } from './permission-error';

const ORIGIN = 'https://example.cybozu.com';

const createReal = () => {
  const api = Object.assign(
    vi.fn((..._args: unknown[]) => Promise.resolve({ ok: true })),
    { url: vi.fn((path: string) => `${ORIGIN}${path}`), urlForGet: vi.fn() }
  );
  // 本物の api.url は列挙できない可能性があるため、列挙不可のプロパティも用意する
  Object.defineProperty(api, 'getConcurrencyLimit', {
    value: vi.fn(() => 10),
    enumerable: false,
  });
  const proxy = Object.assign(
    vi.fn((..._args: unknown[]) => Promise.resolve(['body', 200, {}])),
    { upload: vi.fn((..._args: unknown[]) => Promise.resolve(['body', 200, {}])) }
  );
  const pluginProxy = vi.fn();
  return {
    events: { on: vi.fn(), off: vi.fn() },
    api,
    proxy,
    plugin: { app: { proxy: pluginProxy, getConfig: vi.fn(() => ({ a: '1' })) } },
    getRequestToken: vi.fn(() => 'token'),
    app: { getId: () => 42 },
    Promise,
  };
};

const setup = (permissions: AssetPermission[] = [], externalUrls: string[] = []) => {
  const real = createReal();
  const grants: { current: AssetGrants } = { current: { permissions, externalUrls } };
  const bridge = createEventBridge({
    registerNative: vi.fn(),
    canDeliver: () => true,
    rankOf: () => 0,
    onHandlerError: vi.fn(),
    onRejectedType: vi.fn(),
    onIgnoredThenable: vi.fn(),
    submitErrorMessage: 'error',
  });
  const onDenied = vi.fn<(error: PermissionDeniedError) => void>();
  const options: AssetKintoneOptions = {
    real: real as unknown as KintoneGlobal,
    assetId: '12',
    bridge,
    getGrants: () => grants.current,
    origin: ORIGIN,
    onDenied,
    describeDenial: (denial) => `denied ${denial.operation}`,
  };
  const facade = createAssetKintone(options) as unknown as ReturnType<typeof createReal>;
  return { real, facade, bridge, grants, onDenied };
};

/** 権限なしのファサードを作るための最小の設定 */
const setupOptions = (): AssetKintoneOptions => ({
  real: createReal() as unknown as KintoneGlobal,
  assetId: '1',
  bridge: createEventBridge({
    registerNative: vi.fn(),
    canDeliver: () => true,
    rankOf: () => 0,
    onHandlerError: vi.fn(),
    onRejectedType: vi.fn(),
    onIgnoredThenable: vi.fn(),
    submitErrorMessage: 'error',
  }),
  getGrants: () => ({ permissions: [], externalUrls: [] }),
  origin: ORIGIN,
  onDenied: vi.fn(),
  describeDenial: () => 'denied',
});

describe('createAssetKintone: kintone.api', () => {
  test('GET は常に本物へ委譲する', async () => {
    const { real, facade } = setup();
    await facade.api('/k/v1/record.json', 'GET', { app: 1, id: 1 });
    expect(real.api).toHaveBeenCalledWith('/k/v1/record.json', 'GET', { app: 1, id: 1 });
  });

  test('権限の無い PUT は本物を呼ばずに reject する', async () => {
    const { real, facade, onDenied } = setup();
    await expect(facade.api('/k/v1/record.json', 'PUT', { app: 1 })).rejects.toMatchObject({
      code: PERMISSION_DENIED_CODE,
      denial: {
        assetId: '12',
        operation: 'kintone.api',
        required: ['put'],
        method: 'PUT',
        target: '/k/v1/record',
      },
    });
    expect(real.api).not.toHaveBeenCalled();
    expect(onDenied).toHaveBeenCalledTimes(1);
  });

  test('権限があれば PUT を委譲する', async () => {
    const { real, facade } = setup(['put']);
    await facade.api('/k/v1/record.json', 'PUT', { app: 1 });
    expect(real.api).toHaveBeenCalledTimes(1);
  });

  test('bulkRequest に削除が含まれれば、削除の権限が無い限り止める', async () => {
    const { real, facade } = setup(['put']);
    const params = {
      requests: [
        { method: 'PUT', api: '/k/v1/record.json', payload: {} },
        { method: 'DELETE', api: '/k/v1/records.json', payload: {} },
      ],
    };
    await expect(facade.api('/k/v1/bulkRequest.json', 'POST', params)).rejects.toBeDefined();
    expect(real.api).not.toHaveBeenCalled();
  });

  test('コールバック形式では失敗コールバックを非同期で呼び、undefined を返す', async () => {
    const { real, facade } = setup();
    const success = vi.fn();
    const failure = vi.fn();
    expect(facade.api('/k/v1/record.json', 'DELETE', {}, success, failure)).toBeUndefined();
    expect(failure).not.toHaveBeenCalled();
    await Promise.resolve();
    expect(failure).toHaveBeenCalledWith(expect.objectContaining({ code: PERMISSION_DENIED_CODE }));
    expect(success).not.toHaveBeenCalled();
    expect(real.api).not.toHaveBeenCalled();
  });

  test('権限を外した直後の呼び出しから止まる', async () => {
    const { facade, grants } = setup(['put']);
    await facade.api('/k/v1/record.json', 'PUT', {});
    grants.current = { permissions: [], externalUrls: [] };
    await expect(facade.api('/k/v1/record.json', 'PUT', {})).rejects.toBeDefined();
  });

  test('api.url などのプロパティ(列挙不可を含む)を引き継ぐ', () => {
    const { real, facade } = setup();
    expect(facade.api.url('/k/v1/record.json')).toBe(`${ORIGIN}/k/v1/record.json`);
    expect(real.api.url).toHaveBeenCalled();
    expect(
      (facade.api as unknown as { getConcurrencyLimit: () => number }).getConcurrencyLimit()
    ).toBe(10);
  });
});

describe('createAssetKintone: kintone.proxy', () => {
  const API = 'https://api.example.com/v1/zip?code=1';

  test('外部通信が禁止なら止める', async () => {
    const { real, facade } = setup();
    await expect(facade.proxy(API, 'GET', {}, {})).rejects.toMatchObject({
      denial: { operation: 'kintone.proxy', target: 'https://api.example.com/v1/zip' },
    });
    expect(real.proxy).not.toHaveBeenCalled();
  });

  test('指定先のみなら、通信先に一致するURLだけ委譲する', async () => {
    const { real, facade } = setup(['external-listed'], ['https://api.example.com/v1/']);
    await facade.proxy(API, 'GET', {}, {});
    expect(real.proxy).toHaveBeenCalledTimes(1);
    await expect(facade.proxy('https://api.example.com/v10/', 'GET', {}, {})).rejects.toBeDefined();
    await expect(
      facade.proxy('https://api.example.com.evil.example/v1/', 'GET', {}, {})
    ).rejects.toBeDefined();
    expect(real.proxy).toHaveBeenCalledTimes(1);
  });

  test('指定先のみなら、照合した正規形を送り、解釈が割れる形は送らない', async () => {
    const { real, facade } = setup(['external-listed'], ['https://api.example.com/v1/']);
    await facade.proxy('HTTPS://API.example.com:443/v1/a/../b?q=1', 'GET', {}, {});
    expect(real.proxy).toHaveBeenCalledWith('https://api.example.com/v1/b?q=1', 'GET', {}, {});
    for (const url of [
      'https://api.example.com\\@evil.example/v1/',
      'https://api.example.com/v1/..%2f..%2fadmin',
      'https://api.example.com/v1/\tx',
    ]) {
      await expect(facade.proxy(url, 'GET', {}, {})).rejects.toBeDefined();
    }
    expect(real.proxy).toHaveBeenCalledTimes(1);
  });

  test('すべてなら委譲する', async () => {
    const { real, facade } = setup(['external-all']);
    await facade.proxy('https://anywhere.example/', 'POST', {}, {});
    expect(real.proxy).toHaveBeenCalledTimes(1);
  });

  test('proxy.upload も同じ規則で判定する', async () => {
    const { real, facade } = setup(['external-listed'], ['https://files.example.com/']);
    await facade.proxy.upload('https://files.example.com/up', 'POST', {}, {});
    await expect(
      facade.proxy.upload('https://evil.example/up', 'POST', {}, {})
    ).rejects.toBeDefined();
    expect(real.proxy.upload).toHaveBeenCalledTimes(1);
  });
});

describe('createAssetKintone: その他', () => {
  test('plugin.app.proxy は権限に関係なく拒否し、getConfig は委譲する', async () => {
    const { real, facade } = setup(['unrestricted']);
    await expect(
      (facade.plugin.app.proxy as unknown as (...args: unknown[]) => Promise<unknown>)(
        'plugin-id',
        'https://api.openai.com/v1/responses',
        'POST',
        {},
        {}
      )
    ).rejects.toMatchObject({ denial: { operation: 'kintone.plugin.app.proxy' } });
    expect(real.plugin.app.proxy).not.toHaveBeenCalled();
    expect(facade.plugin.app.getConfig()).toEqual({ a: '1' });
  });

  test('書き込み権限が無ければ getRequestToken を拒否する', () => {
    const { real, facade } = setup(['external-all']);
    expect(() => facade.getRequestToken()).toThrow();
    expect(real.getRequestToken).not.toHaveBeenCalled();
  });

  test('書き込み権限があれば getRequestToken を返す', () => {
    const { facade } = setup(['post']);
    expect(facade.getRequestToken()).toBe('token');
  });

  test('events.on はブリッジへアセットIDつきで登録し、本物には登録しない', () => {
    const { real, facade, bridge } = setup();
    const handler = vi.fn((event) => event);
    facade.events.on('app.record.detail.show', handler);
    expect(real.events.on).not.toHaveBeenCalled();
    bridge.dispatch('app.record.detail.show', { type: 'app.record.detail.show' });
    expect(handler).toHaveBeenCalled();
  });

  test('差し替えていないメンバーは本物を参照する', () => {
    const { real, facade } = setup();
    expect(facade.app).toBe(real.app);
    expect(facade.Promise).toBe(Promise);
  });

  test('プロトタイプをたどっても本物の kintone とその入れ子に届かない', () => {
    const { real, facade } = setup();
    const reachable = (start: unknown): unknown[] => {
      const chain: unknown[] = [];
      for (
        let current: unknown = Object.getPrototypeOf(start);
        current !== null;
        current = Object.getPrototypeOf(current)
      ) {
        chain.push(current);
      }
      return chain;
    };
    for (const [target, original] of [
      [facade, real],
      [facade.events, real.events],
      [facade.plugin, real.plugin],
      [facade.plugin.app, real.plugin.app],
    ] as const) {
      expect(reachable(target)).not.toContain(original);
      expect(Object.getPrototypeOf(target)).toBe(Object.prototype);
    }
    // 本物の関数そのものも、写したメンバーからは取り出せない
    expect(facade.getRequestToken).not.toBe(real.getRequestToken);
    expect((Object.getPrototypeOf(facade) as { api?: unknown }).api).toBeUndefined();
  });

  test('差し替えない関数は、静的メンバーを持ったまま参照で写す', () => {
    const real = createReal();
    const withStatic = Object.assign(real, {
      util: Object.assign(() => 'called', { helper: () => 'static' }),
    });
    const facade = createAssetKintone({
      ...setupOptions(),
      real: withStatic as unknown as KintoneGlobal,
    }) as unknown as typeof withStatic;
    expect(facade.util).toBe(withStatic.util);
    expect(facade.util.helper()).toBe('static');
  });

  test('this を使う本物のメンバーも、ファサードから呼べる', () => {
    const real = createReal();
    const withThis = Object.assign(real, {
      app: { getId: () => 42 },
      getLoginUser(this: { name: string }) {
        return this.name;
      },
      name: 'root',
    });
    const facade = createAssetKintone({
      real: withThis as unknown as KintoneGlobal,
      assetId: '1',
      bridge: createEventBridge({
        registerNative: vi.fn(),
        canDeliver: () => true,
        rankOf: () => 0,
        onHandlerError: vi.fn(),
        onRejectedType: vi.fn(),
        onIgnoredThenable: vi.fn(),
        submitErrorMessage: 'error',
      }),
      getGrants: () => ({ permissions: [], externalUrls: [] }),
      origin: ORIGIN,
      onDenied: vi.fn(),
      describeDenial: () => 'denied',
    }) as unknown as typeof withThis;
    expect(facade.getLoginUser()).toBe('root');
  });

  test('凍結された kintone でも作れる', () => {
    const real = Object.freeze(createReal());
    expect(() =>
      createAssetKintone({
        real: real as unknown as KintoneGlobal,
        assetId: '1',
        bridge: createEventBridge({
          registerNative: vi.fn(),
          canDeliver: () => true,
          rankOf: () => 0,
          onHandlerError: vi.fn(),
          onRejectedType: vi.fn(),
          onIgnoredThenable: vi.fn(),
          submitErrorMessage: 'error',
        }),
        getGrants: () => ({ permissions: [], externalUrls: [] }),
        origin: ORIGIN,
        onDenied: vi.fn(),
        describeDenial: () => 'denied',
      })
    ).not.toThrow();
  });
});

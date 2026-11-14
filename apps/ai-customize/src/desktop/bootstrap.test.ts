import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { PluginConfig } from '@/schema/plugin-config';
import { createTestCommonConfig } from '@/test/fixtures';

/**
 * 起動処理の結合テスト
 *
 * 偽の`kintone` / `window` / `document` / `location`の上で、
 * 取得 → 起動ゲート → アセットの評価 → イベント配信 → 権限による拒否 を通しで確かめる
 */

const ORIGIN = 'https://example.cybozu.com';

type Handler = (event: Record<string, unknown>) => unknown;

const config: PluginConfig = {
  version: 1,
  common: createTestCommonConfig({ assetAppId: '99' }),
  conditions: [],
};

vi.mock('@/lib/config-restore', () => ({ restorePluginConfig: () => config }));

const record = (id: string, overrides: Record<string, unknown>) => {
  const values: Record<string, unknown> = {
    $id: id,
    $revision: '1',
    title: `asset ${id}`,
    targetAppId: '42',
    targetSpaceId: '0',
    kind: 'JavaScript',
    code: '',
    scope: '全員',
    status: '有効',
    作成者: { code: 'sato', name: '佐藤' },
    permissions: [],
    externalUrls: '',
    order: '100',
    screens: [],
    ...overrides,
  };
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      key === '作成者' ? { type: 'CREATOR', value } : { value },
    ])
  );
};

const createFakeElement = () => ({
  attributes: {} as Record<string, string>,
  dataset: {} as Record<string, string>,
  textContent: null as string | null,
  disabled: false,
  isConnected: false,
  setAttribute(name: string, value: string) {
    this.attributes[name] = value;
  },
  replaceChildren() {},
  addEventListener() {},
  remove() {},
});

const setupEnvironment = (params: { records: unknown[]; search?: string }) => {
  const handlers = new Map<string, Handler[]>();
  let releaseRecords!: () => void;
  const recordsReady = new Promise<void>((resolve) => {
    releaseRecords = resolve;
  });
  const api = Object.assign(
    vi.fn(async (path: string, method: string) => {
      if (path === '/k/v1/records.json' && method === 'GET') {
        await recordsReady;
        return { records: params.records };
      }
      return { ok: true };
    }),
    { url: (path: string) => `${ORIGIN}${path}` }
  );
  const kintone = {
    $PLUGIN_ID: 'plugin',
    events: {
      on: vi.fn((types: string | string[], handler: Handler) => {
        for (const type of Array.isArray(types) ? types : [types]) {
          handlers.set(type, [...(handlers.get(type) ?? []), handler]);
        }
      }),
      off: vi.fn(),
    },
    api,
    proxy: Object.assign(vi.fn(), { upload: vi.fn() }),
    plugin: { app: { getConfig: () => ({}), proxy: vi.fn() } },
    app: { getId: () => 42 },
    getLoginUser: () => ({ code: 'tanaka', name: '田中', language: 'ja' }),
    getRequestToken: () => 'token',
    Promise,
  };
  const head: ReturnType<typeof createFakeElement>[] = [];
  const storage = new Map<string, string>();

  vi.stubGlobal('kintone', kintone);
  vi.stubGlobal('location', {
    origin: ORIGIN,
    href: `${ORIGIN}/k/42/show${params.search ?? ''}#record=1`,
    search: params.search ?? '',
    pathname: '/k/42/show',
  });
  vi.stubGlobal('window', {
    setTimeout: (callback: () => void, ms: number) => setTimeout(callback, ms),
    clearTimeout: (id: ReturnType<typeof setTimeout>) => clearTimeout(id),
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
      key: (index: number) => [...storage.keys()][index] ?? null,
      get length() {
        return storage.size;
      },
    },
  });
  vi.stubGlobal('document', {
    createElement: () => createFakeElement(),
    head: { appendChild: (node: ReturnType<typeof createFakeElement>) => head.push(node) },
    body: { appendChild: vi.fn() },
    addEventListener: vi.fn(),
  });

  const fire = (type: string, event: Record<string, unknown> = {}) =>
    (handlers.get(type) ?? []).map((handler) => handler({ type, record: {}, ...event }));

  return { kintone, handlers, head, releaseRecords, fire };
};

const importBootstrap = async () => {
  vi.resetModules();
  return (await import('./bootstrap')).bootstrap;
};

describe('bootstrap(結合)', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  test('show系4イベントを同期で登録し、取得前の show は保留してからアセットへ配信する', async () => {
    const env = setupEnvironment({
      records: [
        record('1', {
          code: [
            "kintone.events.on('app.record.detail.show', (event) => {",
            '  event.marked = true;',
            '  return event;',
            '});',
          ].join('\n'),
        }),
        record('2', { kind: 'CSS', code: '.a { color: red; }' }),
      ],
    });
    const bootstrap = await importBootstrap();
    bootstrap();

    expect([...env.handlers.keys()].sort()).toEqual([
      'app.record.create.show',
      'app.record.detail.show',
      'app.record.edit.show',
      'app.record.index.show',
    ]);

    const [pending] = env.fire('app.record.detail.show');
    expect(pending).toBeInstanceOf(Promise);
    env.releaseRecords();
    await expect(pending).resolves.toMatchObject({ marked: true });
    expect(env.head.map((style) => style.textContent)).toEqual(['.a { color: red; }']);
  });

  test('権限の無い PUT を保存時に止め、本物の kintone.api へは送らない', async () => {
    const env = setupEnvironment({
      records: [
        record('1', {
          code: [
            "kintone.events.on('app.record.edit.submit', async (event) => {",
            "  await kintone.api('/k/v1/record.json', 'PUT', { app: 7, id: 1, record: {} });",
            '  return event;',
            '});',
          ].join('\n'),
        }),
      ],
    });
    const bootstrap = await importBootstrap();
    bootstrap();
    env.releaseRecords();
    await env.fire('app.record.edit.show')[0];

    const [result] = env.fire('app.record.edit.submit');
    await expect(result).resolves.toMatchObject({ error: expect.any(String) });
    expect(env.kintone.api).not.toHaveBeenCalledWith('/k/v1/record.json', 'PUT', expect.anything());
  });

  test('更新の権限があれば PUT を本物へ送る', async () => {
    const env = setupEnvironment({
      records: [
        record('1', {
          permissions: ['更新(PUT)'],
          code: [
            "kintone.events.on('app.record.edit.submit', async (event) => {",
            "  await kintone.api('/k/v1/record.json', 'PUT', { app: 7, id: 1, record: {} });",
            '  return event;',
            '});',
          ].join('\n'),
        }),
      ],
    });
    const bootstrap = await importBootstrap();
    bootstrap();
    env.releaseRecords();
    await env.fire('app.record.edit.show')[0];

    const [result] = env.fire('app.record.edit.submit');
    await expect(result).resolves.not.toHaveProperty('error');
    expect(env.kintone.api).toHaveBeenCalledWith('/k/v1/record.json', 'PUT', expect.anything());
  });

  test('他人の private アセットと迂回パターンを含むアセットは実行しない', async () => {
    const env = setupEnvironment({
      records: [
        record('1', {
          scope: '自分だけ',
          code: "kintone.events.on('app.record.detail.show', (e) => { e.other = true; return e; });",
        }),
        record('2', {
          code: "kintone.events.on('app.record.detail.show', (e) => { e.bypass = true; return e; }); window.kintone;",
        }),
      ],
    });
    const bootstrap = await importBootstrap();
    bootstrap();
    env.releaseRecords();
    const result = await env.fire('app.record.detail.show')[0];
    expect(result).not.toHaveProperty('other');
    expect(result).not.toHaveProperty('bypass');
  });

  test('セーフモードではイベントを登録せず、アセットを取得しない', async () => {
    const env = setupEnvironment({ records: [], search: '?ai-customize=off' });
    const bootstrap = await importBootstrap();
    bootstrap();
    expect(env.kintone.events.on).not.toHaveBeenCalled();
    expect(env.kintone.api).not.toHaveBeenCalled();
  });
});

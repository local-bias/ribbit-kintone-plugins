import { describe, expect, test } from 'vitest';
import type { AssetScope } from '@/schema/asset';
import { createTestAsset } from '@/test/fixtures';
import {
  type ApplyContext,
  checkCapabilityPolicy,
  isExternalTargetAllowed,
  isScreenTarget,
  mergePanelAssets,
  selectApplicableCss,
  shouldApply,
  sortAssets,
  validateAssetSet,
} from './asset-filter';
import { MAX_ASSETS_PER_APP, MAX_TOTAL_CODE_BYTES } from './constants';

const ORIGIN = 'https://example.cybozu.com';

const createContext = (overrides: Partial<ApplyContext> = {}): ApplyContext => ({
  target: { spaceId: '0', appId: '42' },
  loginUserCode: 'tanaka',
  mutedIds: new Set(),
  safeMode: false,
  ...overrides,
});

describe('shouldApply', () => {
  test.each<[AssetScope, string, string, boolean, boolean, boolean, boolean]>([
    // scope,   owner,  loginUser, enabled, muted, safeMode, expected
    ['private', 'sato', 'sato', true, false, false, true],
    ['private', 'sato', 'tanaka', true, false, false, false], // 他人のprivate
    ['private', '', '', true, false, false, false], // 所有者不明のprivateは誰にも適用しない
    ['public', 'sato', 'tanaka', true, false, false, true],
    ['public', 'sato', 'tanaka', false, false, false, false], // 無効
    ['public', 'sato', 'tanaka', true, true, false, false], // ローカル無効
    ['public', 'sato', 'tanaka', true, false, true, false], // セーフモード
  ])(
    '%s / owner=%s / login=%s / enabled=%s / muted=%s / safe=%s -> %s',
    (scope, ownerCode, loginUserCode, enabled, muted, safeMode, expected) => {
      const asset = createTestAsset({ scope, ownerCode, enabled });
      const context = createContext({
        loginUserCode,
        safeMode,
        mutedIds: new Set(muted ? [asset.id] : []),
      });
      expect(shouldApply(asset, context)).toBe(expected);
    }
  );

  test('空のコードは適用しない', () => {
    expect(shouldApply(createTestAsset({ code: '  \n' }), createContext())).toBe(false);
  });

  test.each([[{ targetAppId: '43' }], [{ targetSpaceId: '5' }], [{ targetAppId: '' }]])(
    '対象座標が違えば適用しない %j',
    (overrides) => {
      expect(shouldApply(createTestAsset(overrides), createContext())).toBe(false);
    }
  );
});

describe('isScreenTarget', () => {
  test.each([
    [[], 'index', true],
    [['detail'], 'index', false],
    [['index', 'detail'], 'index', true],
  ] as const)('%j に %s -> %s', (screens, screen, expected) => {
    expect(isScreenTarget(createTestAsset({ screens: [...screens] }), screen)).toBe(expected);
  });
});

describe('sortAssets', () => {
  test('order 昇順、同じならID昇順。元の配列は変えない', () => {
    const assets = [
      createTestAsset({ id: '10', order: 200 }),
      createTestAsset({ id: '3', order: 100 }),
      createTestAsset({ id: '2', order: 100 }),
    ];
    expect(sortAssets(assets).map((asset) => asset.id)).toEqual(['2', '3', '10']);
    expect(assets.map((asset) => asset.id)).toEqual(['10', '3', '2']);
  });
});

describe('isExternalTargetAllowed', () => {
  test.each([
    [[], [], 'https://api.example.com/v1/', false],
    [['external-listed'], [], 'https://api.example.com/v1/', false],
    [['external-listed'], ['https://api.example.com/v1/'], 'https://api.example.com/v1/zip', true],
    [['external-listed'], ['https://api.example.com/v1/'], 'https://api.example.com/v2/', false],
    [['external-listed'], ['https://api.example.com/'], null, false],
    [['external-all'], [], 'https://anywhere.example/', true],
    [['external-all'], [], null, true],
    [['unrestricted'], [], null, true],
    [['put'], ['https://api.example.com/'], 'https://api.example.com/', false],
  ] as const)('%j %j %s -> %s', (permissions, externalUrls, target, expected) => {
    const asset = createTestAsset({
      permissions: [...permissions],
      externalUrls: [...externalUrls],
    });
    expect(isExternalTargetAllowed(asset, target)).toBe(expected);
  });
});

describe('checkCapabilityPolicy', () => {
  test('迂回パターンの無いJSは実行してよい', () => {
    expect(checkCapabilityPolicy(createTestAsset(), ORIGIN)).toEqual({ allowed: true });
  });

  test('迂回パターンを含むJSは、制限なしが無ければ止める', () => {
    const asset = createTestAsset({ code: "window.kintone.api('/k/v1/record.json', 'PUT', {});" });
    expect(checkCapabilityPolicy(asset, ORIGIN)).toMatchObject({
      allowed: false,
      reason: 'bypass',
      details: [{ pattern: '.kintone', line: 1 }],
    });
  });

  test('制限なしなら迂回パターンを含むJSも実行してよい', () => {
    const asset = createTestAsset({ code: "fetch('/x');", permissions: ['unrestricted'] });
    expect(checkCapabilityPolicy(asset, ORIGIN)).toEqual({ allowed: true });
  });

  test('外部参照が許可されていないCSSは止める', () => {
    const asset = createTestAsset({
      kind: 'css',
      code: "@import 'https://fonts.example.com/css';\n.a { background: url(https://img.example.com/a.png) }",
      permissions: ['external-listed'],
      externalUrls: ['https://fonts.example.com/'],
    });
    expect(checkCapabilityPolicy(asset, ORIGIN)).toEqual({
      allowed: false,
      reason: 'external',
      details: [{ target: 'https://img.example.com/a.png', line: 2 }],
    });
  });

  describe('JSの外部リソースの読み込み(CSSと同じ基準)', () => {
    const code = "img.src = 'https://img.example.com/a.png';";

    test('外部通信の許可が無ければ止める', () => {
      expect(checkCapabilityPolicy(createTestAsset({ code }), ORIGIN)).toEqual({
        allowed: false,
        reason: 'external',
        details: [{ target: 'https://img.example.com/a.png', line: 1 }],
      });
    });

    test('通信先に一致すれば実行してよい', () => {
      const asset = createTestAsset({
        code,
        permissions: ['external-listed'],
        externalUrls: ['https://img.example.com/'],
      });
      expect(checkCapabilityPolicy(asset, ORIGIN)).toEqual({ allowed: true });
    });

    test('kintoneと同じオリジン・相対URLは外部通信に数えない', () => {
      const asset = createTestAsset({
        code: `img.src = '${ORIGIN}/k/api/blob/a.png'; icon.src = '/k/static/a.png';`,
      });
      expect(checkCapabilityPolicy(asset, ORIGIN)).toEqual({ allowed: true });
    });

    test('組み立てた送信先は、指定先のみでは許可せず、すべてなら許可する', () => {
      const concatenated = "img.src = 'https://img.example.com/?d=' + data;";
      const listed = createTestAsset({
        code: concatenated,
        permissions: ['external-listed'],
        externalUrls: ['https://img.example.com/'],
      });
      expect(checkCapabilityPolicy(listed, ORIGIN)).toEqual({
        allowed: false,
        reason: 'external',
        details: [{ target: null, line: 1 }],
      });
      const all = createTestAsset({ code: concatenated, permissions: ['external-all'] });
      expect(checkCapabilityPolicy(all, ORIGIN)).toEqual({ allowed: true });
    });

    test('迂回パターンの判定を先に行う', () => {
      const asset = createTestAsset({ code: `${code}\nfetch('/x');` });
      expect(checkCapabilityPolicy(asset, ORIGIN)).toMatchObject({
        allowed: false,
        reason: 'bypass',
      });
    });
  });

  test('外部参照が全て許可されたCSSは適用してよい', () => {
    const asset = createTestAsset({
      kind: 'css',
      code: "@import 'https://fonts.example.com/css';",
      permissions: ['external-listed'],
      externalUrls: ['https://fonts.example.com/'],
    });
    expect(checkCapabilityPolicy(asset, ORIGIN)).toEqual({ allowed: true });
  });
});

describe('validateAssetSet', () => {
  test('上限件数を超えたら全体を実行しない', () => {
    const assets = Array.from({ length: MAX_ASSETS_PER_APP + 1 }, (_, index) =>
      createTestAsset({ id: String(index + 1) })
    );
    expect(validateAssetSet(assets)).toEqual({
      ok: false,
      reason: 'too-many',
      count: MAX_ASSETS_PER_APP + 1,
    });
  });

  test('有効なコードの合計が上限を超えたら全体を実行しない', () => {
    const half = 'a'.repeat(MAX_TOTAL_CODE_BYTES / 2 + 1);
    expect(
      validateAssetSet([
        createTestAsset({ id: '1', code: half }),
        createTestAsset({ id: '2', code: half }),
      ])
    ).toMatchObject({ ok: false, reason: 'too-large' });
  });

  test('無効なアセットは合計に数えない', () => {
    const half = 'a'.repeat(MAX_TOTAL_CODE_BYTES / 2 + 1);
    expect(
      validateAssetSet([
        createTestAsset({ id: '1', code: half }),
        createTestAsset({ id: '2', code: half, enabled: false }),
      ])
    ).toEqual({ ok: true });
  });
});

describe('mergePanelAssets', () => {
  test('パネルが知っているものはパネルの状態(新しい)を、知らないものは取得した状態を使う', () => {
    const loaded = [createTestAsset({ id: '1' }), createTestAsset({ id: '2' })];
    const panel = [createTestAsset({ id: '2', enabled: false }), createTestAsset({ id: '3' })];
    expect(mergePanelAssets(loaded, panel).map(({ id, enabled }) => [id, enabled])).toEqual([
      ['1', true],
      ['2', false],
      ['3', true],
    ]);
  });
});

describe('selectApplicableCss', () => {
  test('適用してよいCSSだけを、実行順に返す(JS・無効・ローカル無効・外部参照の未許可を除く)', () => {
    const css = (overrides: Parameters<typeof createTestAsset>[0]) =>
      createTestAsset({ kind: 'css', code: '.a{}', ...overrides });
    const selected = selectApplicableCss(
      [
        css({ id: '4', order: 200 }),
        css({ id: '2', order: 100 }),
        css({ id: '5', enabled: false }),
        css({ id: '6' }),
        css({ id: '7', code: '.a{background:url(https://img.example.com/a.png)}' }),
        createTestAsset({ id: '8', kind: 'js' }),
      ],
      createContext({ mutedIds: new Set(['6']) }),
      ORIGIN
    );
    expect(selected.map((asset) => asset.id)).toEqual(['2', '4']);
  });
});

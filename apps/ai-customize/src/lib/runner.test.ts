import { describe, expect, test, vi } from 'vitest';
import type { Asset } from '@/schema/asset';
import { createTestAsset } from '@/test/fixtures';
import { EVALUATION_WARNING_MS } from './constants';
import type { DiagnosticEntry } from './diagnostics';
import { buildAssetSource, createRunner, type RunnerOptions } from './runner';

const setup = (overrides: Partial<RunnerOptions> = {}) => {
  const entries: DiagnosticEntry[] = [];
  const options: RunnerOptions = {
    createFacade: vi.fn((asset: Asset) => ({ facadeOf: asset.id })),
    createContext: vi.fn((asset, screen) => ({ screen, assetId: asset.id }) as never),
    checkPolicy: () => ({ allowed: true }),
    record: (entry) => entries.push(entry),
    now: () => 0,
    ...overrides,
  };
  return { runner: createRunner(options), options, entries };
};

describe('buildAssetSource', () => {
  test('strict mode と sourceURL を付ける', () => {
    expect(buildAssetSource({ id: '12', title: 'Check Amount!', code: 'a();' })).toBe(
      '"use strict";\na();\n//# sourceURL=ai-customize/12-Check-Amount.js'
    );
  });

  test('英数字の無いタイトルはIDだけにする', () => {
    expect(buildAssetSource({ id: '3', title: '保存前チェック', code: '' })).toContain(
      'sourceURL=ai-customize/3.js'
    );
  });

  test('行末コメントで終わるコードでも sourceURL が独立した行になる', () => {
    expect(buildAssetSource({ id: '1', title: '', code: 'a(); // end' })).toMatch(
      /\/\/ end\n\/\/# sourceURL=/
    );
  });
});

describe('createRunner', () => {
  test('ファサードと context を渡して評価する', () => {
    const received: unknown[] = [];
    const { runner } = setup({
      compile: () => (kintone, context) => received.push(kintone, context),
    });
    runner.evaluatePending([createTestAsset({ id: '7' })], 'detail');
    expect(received).toEqual([{ facadeOf: '7' }, { screen: 'detail', assetId: '7' }]);
  });

  test('本物の new Function で、引数の kintone が識別子 kintone になる', () => {
    const seen: unknown[] = [];
    const facade = { events: { on: (type: string) => seen.push(type) } };
    const { runner } = setup({ createFacade: () => facade });
    runner.evaluatePending(
      [createTestAsset({ code: "kintone.events.on('app.record.detail.show');" })],
      'detail'
    );
    expect(seen).toEqual(['app.record.detail.show']);
  });

  test('1アセットは1回だけ評価する(画面が変わっても)', () => {
    const compile = vi.fn(() => () => undefined);
    const { runner } = setup({ compile });
    const asset = createTestAsset({ screens: [] });
    runner.evaluatePending([asset], 'detail');
    runner.evaluatePending([asset], 'edit');
    expect(compile).toHaveBeenCalledTimes(1);
  });

  test('適用画面外のアセットは、その画面が来るまで評価しない', () => {
    const compile = vi.fn(() => () => undefined);
    const { runner } = setup({ compile });
    const asset = createTestAsset({ screens: ['edit'] });
    runner.evaluatePending([asset], 'detail');
    expect(compile).not.toHaveBeenCalled();
    runner.evaluatePending([asset], 'edit');
    expect(compile).toHaveBeenCalledTimes(1);
  });

  test('CSSアセットは評価しない', () => {
    const compile = vi.fn(() => () => undefined);
    const { runner } = setup({ compile });
    runner.evaluatePending([createTestAsset({ kind: 'css', code: '.a{}' })], 'detail');
    expect(compile).not.toHaveBeenCalled();
  });

  test('例外は記録し、他のアセットの評価を止めない', () => {
    const { runner, entries } = setup();
    runner.evaluatePending(
      [
        createTestAsset({ id: '1', code: "throw new Error('boom');" }),
        createTestAsset({ id: '2', code: 'const ok = 1;' }),
      ],
      'detail'
    );
    expect(entries).toEqual([
      { kind: 'evaluation-failed', assetId: '1', error: expect.any(Error) },
    ]);
  });

  test('構文エラーも記録する', () => {
    const { runner, entries } = setup();
    runner.evaluatePending([createTestAsset({ code: 'const = ;' })], 'detail');
    expect(entries[0]).toMatchObject({ kind: 'evaluation-failed', assetId: '1' });
  });

  test('ポリシーで止めたアセットは評価しない', () => {
    const compile = vi.fn(() => () => undefined);
    const { runner, entries } = setup({
      compile,
      checkPolicy: () => ({
        allowed: false,
        reason: 'bypass',
        details: [{ pattern: 'fetch', line: 1 }],
      }),
    });
    runner.evaluatePending([createTestAsset()], 'detail');
    expect(compile).not.toHaveBeenCalled();
    expect(entries[0]).toMatchObject({ kind: 'blocked', assetId: '1' });
  });

  test('評価に時間がかかったら記録する', () => {
    let time = 0;
    const { runner, entries } = setup({
      now: () => time,
      compile: () => () => {
        time += EVALUATION_WARNING_MS + 1;
      },
    });
    runner.evaluatePending([createTestAsset()], 'detail');
    expect(entries).toEqual([
      { kind: 'slow-evaluation', assetId: '1', ms: EVALUATION_WARNING_MS + 1 },
    ]);
  });

  test('評価できたJSのIDを返す(止めたもの・例外を投げたものは含めない)', () => {
    const { runner } = setup({
      checkPolicy: (asset) =>
        asset.id === '2'
          ? { allowed: false, reason: 'bypass', details: [{ pattern: 'fetch', line: 1 }] }
          : { allowed: true },
      compile: (source) => () => {
        if (source.includes('throw')) throw new Error('x');
      },
    });
    runner.evaluatePending(
      [
        createTestAsset({ id: '1' }),
        createTestAsset({ id: '2' }),
        createTestAsset({ id: '3', code: 'throw 1;' }),
      ],
      'detail'
    );
    expect(runner.evaluatedIds()).toEqual(new Set(['1']));
  });
});

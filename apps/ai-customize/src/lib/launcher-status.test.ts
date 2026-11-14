import { describe, expect, test } from 'vitest';
import { summarizeLauncher, toRuntimePhase } from './launcher-status';

const status = (overrides = {}) => ({
  loaded: false,
  loadError: null,
  timedOut: false,
  ...overrides,
});

describe('toRuntimePhase', () => {
  test.each([
    [true, status(), 'safe-mode'],
    [false, status({ loadError: { reason: 'too-many', count: 101 } }), 'failed'],
    [false, status({ timedOut: true, loaded: true }), 'timed-out'],
    [false, status({ loaded: true }), 'ready'],
    [false, status(), 'loading'],
  ] as const)('safeMode=%s / %o -> %s', (safeMode, runtimeStatus, expected) => {
    expect(toRuntimePhase(safeMode, runtimeStatus)).toBe(expected);
  });
});

describe('summarizeLauncher', () => {
  test('適用中の件数、問題の有無、読み込めなかったかを返す', () => {
    expect(
      summarizeLauncher({
        phase: 'ready',
        appliedIds: new Set(['1', '2']),
        problemAssetIds: new Set(['2']),
      })
    ).toEqual({ appliedCount: 2, hasProblems: true, notLoaded: false, safeMode: false });
  });

  test('タイムアウト・取得失敗は「読み込めなかった」。セーフモードは件数を出さない', () => {
    expect(
      summarizeLauncher({ phase: 'timed-out', appliedIds: new Set(), problemAssetIds: new Set() })
    ).toMatchObject({ notLoaded: true });
    expect(
      summarizeLauncher({ phase: 'failed', appliedIds: new Set(), problemAssetIds: new Set() })
    ).toMatchObject({ notLoaded: true });
    expect(
      summarizeLauncher({
        phase: 'safe-mode',
        appliedIds: new Set(['1']),
        problemAssetIds: new Set(),
      })
    ).toEqual({ appliedCount: 0, hasProblems: false, notLoaded: false, safeMode: true });
  });
});

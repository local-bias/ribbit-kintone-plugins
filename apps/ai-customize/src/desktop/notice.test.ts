import { describe, expect, test } from 'vitest';
import { shouldShowAfterDismiss } from './notice';

describe('shouldShowAfterDismiss', () => {
  test.each([
    // 閉じた時の重要度, 新しい通知の重要度, 表示するか
    [null, 'info', true],
    ['info', 'info', false],
    ['info', 'warning', true],
    ['warning', 'warning', false],
    ['warning', 'info', false],
    ['warning', 'error', true],
    ['error', 'error', false],
  ] as const)('閉じた=%s / 新しい=%s -> %s', (dismissed, level, expected) => {
    expect(shouldShowAfterDismiss(dismissed, level)).toBe(expected);
  });
});

import { describe, expect, test } from 'vitest';
import { formatRelativeTime } from './relative-time';

const now = new Date('2026-09-28T12:00:00Z');

describe('formatRelativeTime', () => {
  test.each([
    ['2026-09-28T11:59:30Z', '30 seconds ago'],
    ['2026-09-28T11:00:00Z', '1 hour ago'],
    ['2026-09-25T12:00:00Z', '3 days ago'],
    ['2026-06-28T12:00:00Z', '3 months ago'],
    ['2024-09-28T12:00:00Z', '2 years ago'],
  ])('%s -> %s', (value, expected) => {
    expect(formatRelativeTime(value, now, 'en')).toBe(expected);
  });

  test('日本語でも表示できる', () => {
    expect(formatRelativeTime('2026-09-25T12:00:00Z', now, 'ja')).toBe('3 日前');
  });

  test('解釈できない値は空文字', () => {
    expect(formatRelativeTime('not a date', now, 'en')).toBe('');
  });
});

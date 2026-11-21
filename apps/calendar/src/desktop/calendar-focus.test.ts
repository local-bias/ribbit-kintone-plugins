import { describe, expect, it } from 'vitest';
import {
  buildVisibleRange,
  getRangePosition,
  isIsoDate,
  resolveFocusedDate,
  toCalendarIsoDate,
} from './calendar-focus';

const ZONE = 'Asia/Tokyo';

/** FullCalendar(UTC-coercionモード)が渡す日付マーカー: UTCの値が、そのタイムゾーンの壁時計時刻を表す */
const marker = (isoDate: string) => new Date(`${isoDate}T00:00:00Z`);

describe('isIsoDate', () => {
  it('accepts only yyyy-MM-dd strings', () => {
    expect(isIsoDate('2026-11-20')).toBe(true);
    expect(isIsoDate('2026-11-20T00:00:00')).toBe(false);
    expect(isIsoDate('"]; .evil')).toBe(false);
  });
});

describe('toCalendarIsoDate', () => {
  it('reads a UTC-coerced marker as the wall-clock date, without shifting to the previous day', () => {
    expect(toCalendarIsoDate(marker('2026-11-20'), ZONE)).toBe('2026-11-20');
  });

  it('keeps the date for zones behind UTC as well', () => {
    expect(toCalendarIsoDate(marker('2026-11-20'), 'America/Los_Angeles')).toBe('2026-11-20');
  });
});

describe('buildVisibleRange', () => {
  it('converts the exclusive end of a month view into its last day', () => {
    expect(
      buildVisibleRange({
        currentStart: marker('2026-11-01'),
        currentEnd: marker('2026-12-01'),
        zone: ZONE,
      })
    ).toEqual({ start: '2026-11-01', last: '2026-11-30' });
  });

  it('builds a single-day range for the day view', () => {
    expect(
      buildVisibleRange({
        currentStart: marker('2026-11-20'),
        currentEnd: marker('2026-11-21'),
        zone: ZONE,
      })
    ).toEqual({ start: '2026-11-20', last: '2026-11-20' });
  });

  it('returns null for an empty or inverted range', () => {
    expect(
      buildVisibleRange({
        currentStart: marker('2026-11-20'),
        currentEnd: marker('2026-11-20'),
        zone: ZONE,
      })
    ).toBeNull();
  });
});

describe('getRangePosition', () => {
  const week = { start: '2026-11-15', last: '2026-11-21' };

  it('marks the first, middle and last days of the visible range', () => {
    expect(getRangePosition('2026-11-15', week)).toBe('start');
    expect(getRangePosition('2026-11-18', week)).toBe('middle');
    expect(getRangePosition('2026-11-21', week)).toBe('end');
  });

  it('returns null outside the range', () => {
    expect(getRangePosition('2026-11-14', week)).toBeNull();
    expect(getRangePosition('2026-11-22', week)).toBeNull();
  });

  it('compares across month and year boundaries', () => {
    const range = { start: '2026-12-27', last: '2027-01-02' };
    expect(getRangePosition('2026-12-31', range)).toBe('middle');
    expect(getRangePosition('2027-01-02', range)).toBe('end');
  });

  it('draws no band for a single-day range or when no range is known', () => {
    expect(getRangePosition('2026-11-20', { start: '2026-11-20', last: '2026-11-20' })).toBeNull();
    expect(getRangePosition('2026-11-20', null)).toBeNull();
  });
});

describe('resolveFocusedDate', () => {
  const november = { start: '2026-11-01', last: '2026-11-30' };
  const december = { start: '2026-12-01', last: '2026-12-31' };

  it('keeps the day of month when moving to the next month (FullCalendar resets to the 1st)', () => {
    expect(
      resolveFocusedDate({
        previousRange: november,
        previousFocusedDate: '2026-11-20',
        nextRange: december,
        calendarDate: '2026-12-01',
      })
    ).toBe('2026-12-20');
  });

  it('keeps the weekday when moving to the previous week', () => {
    expect(
      resolveFocusedDate({
        previousRange: { start: '2026-11-15', last: '2026-11-21' },
        previousFocusedDate: '2026-11-18',
        nextRange: { start: '2026-11-08', last: '2026-11-14' },
        calendarDate: '2026-11-08',
      })
    ).toBe('2026-11-11');
  });

  it('clamps to the last day when the next month is shorter', () => {
    expect(
      resolveFocusedDate({
        previousRange: { start: '2027-01-01', last: '2027-01-31' },
        previousFocusedDate: '2027-01-31',
        nextRange: { start: '2027-02-01', last: '2027-02-28' },
        calendarDate: '2027-02-01',
      })
    ).toBe('2027-02-28');
  });

  it('uses the calendar date for a date picked in the mini calendar, even at a range start', () => {
    // ミニカレンダーで翌月1日を選んだ場合: 選択中の日付は既に選んだ日付に更新されている
    expect(
      resolveFocusedDate({
        previousRange: november,
        previousFocusedDate: '2026-12-01',
        nextRange: december,
        calendarDate: '2026-12-01',
      })
    ).toBe('2026-12-01');
  });

  it('uses the calendar date for "today" within the same range', () => {
    expect(
      resolveFocusedDate({
        previousRange: november,
        previousFocusedDate: '2026-11-05',
        nextRange: november,
        calendarDate: '2026-11-20',
      })
    ).toBe('2026-11-20');
  });

  it('uses the calendar date when jumping to a non-adjacent range', () => {
    expect(
      resolveFocusedDate({
        previousRange: { start: '2026-08-01', last: '2026-08-31' },
        previousFocusedDate: '2026-08-10',
        nextRange: november,
        calendarDate: '2026-11-01',
      })
    ).toBe('2026-11-01');
  });

  it('falls back to the calendar date on the first render', () => {
    expect(
      resolveFocusedDate({
        previousRange: null,
        previousFocusedDate: null,
        nextRange: november,
        calendarDate: '2026-11-20',
      })
    ).toBe('2026-11-20');
  });
});

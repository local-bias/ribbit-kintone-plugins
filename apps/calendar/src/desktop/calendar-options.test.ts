import { DateTime } from 'luxon';
import { describe, expect, it } from 'vitest';
import {
  buildEventOrder,
  buildViewButtons,
  compareSortValues,
  getScrollTimeAroundNow,
  isDayViewSelectable,
  resolveFirstDay,
  resolveInitialView,
  resolveSlotRange,
} from './calendar-options';

describe('resolveFirstDay', () => {
  it('returns the configured weekday as is', () => {
    expect(resolveFirstDay(0, 'Asia/Tokyo')).toBe(0);
    expect(resolveFirstDay(1, 'Asia/Tokyo')).toBe(1);
    expect(resolveFirstDay(6, 'Asia/Tokyo')).toBe(6);
  });

  it("resolves the special 'today' value to today's weekday in the given zone", () => {
    // 2026-11-15(日) 23:30 UTC = 2026-11-16(月) 08:30 JST
    const now = DateTime.fromISO('2026-11-15T23:30:00Z');
    expect(resolveFirstDay(-1, 'Asia/Tokyo', now)).toBe(1);
    expect(resolveFirstDay(-1, 'UTC', now)).toBe(0);
  });

  it('falls back to Sunday for out-of-range values', () => {
    expect(resolveFirstDay(7, 'Asia/Tokyo')).toBe(0);
    expect(resolveFirstDay(Number.NaN, 'Asia/Tokyo')).toBe(0);
  });
});

describe('buildViewButtons', () => {
  it('shows every view when nothing is selected', () => {
    expect(buildViewButtons([])).toBe(
      'dayGridMonth,timeGridWeek,timeGridFiveDay,timeGridThreeDay,timeGridDay'
    );
  });

  it('keeps the canonical order regardless of the selection order', () => {
    expect(buildViewButtons(['timeGridDay', 'dayGridMonth'])).toBe('dayGridMonth,timeGridDay');
  });

  it('hides the switcher when only a single view is selected', () => {
    expect(buildViewButtons(['timeGridWeek'])).toBe('');
  });
});

describe('resolveInitialView', () => {
  it('prefers the view stored for this tab', () => {
    expect(
      resolveInitialView({ stored: 'timeGridDay', initialView: 'dayGridMonth', visibleViews: [] })
    ).toBe('timeGridDay');
  });

  it('ignores an unknown stored value', () => {
    expect(
      resolveInitialView({ stored: 'listWeek', initialView: 'dayGridMonth', visibleViews: [] })
    ).toBe('dayGridMonth');
    expect(
      resolveInitialView({ stored: null, initialView: 'dayGridMonth', visibleViews: [] })
    ).toBe('dayGridMonth');
  });

  it('falls back to the first selectable view when the initial view is not selectable', () => {
    expect(
      resolveInitialView({
        stored: null,
        initialView: 'timeGridWeek',
        visibleViews: ['dayGridMonth'],
      })
    ).toBe('dayGridMonth');
  });

  it('ignores a stored view that is no longer selectable', () => {
    expect(
      resolveInitialView({
        stored: 'timeGridDay',
        initialView: 'dayGridMonth',
        visibleViews: ['dayGridMonth', 'timeGridWeek'],
      })
    ).toBe('dayGridMonth');
  });
});

describe('getScrollTimeAroundNow', () => {
  it('scrolls to one hour before the current time in the given zone', () => {
    const now = DateTime.fromISO('2026-11-16T01:45:00Z');
    expect(getScrollTimeAroundNow('Asia/Tokyo', now)).toBe('09:00:00');
  });

  it('does not go back past midnight', () => {
    const now = DateTime.fromISO('2026-11-16T15:20:00Z');
    expect(getScrollTimeAroundNow('Asia/Tokyo', now)).toBe('00:00:00');
  });
});

describe('isDayViewSelectable', () => {
  it('is true when the day view can be switched to', () => {
    expect(isDayViewSelectable([])).toBe(true);
    expect(isDayViewSelectable(['dayGridMonth', 'timeGridDay'])).toBe(true);
  });

  it('is false when the day view is not among the selectable views', () => {
    expect(isDayViewSelectable(['dayGridMonth', 'timeGridWeek'])).toBe(false);
  });
});

describe('resolveSlotRange', () => {
  it('keeps a valid range, including one that spans midnight', () => {
    expect(resolveSlotRange({ slotMinTime: '8', slotMaxTime: '20' })).toEqual({
      slotMinTime: '8',
      slotMaxTime: '20',
    });
    expect(resolveSlotRange({ slotMinTime: '18', slotMaxTime: '30' })).toEqual({
      slotMinTime: '18',
      slotMaxTime: '30',
    });
  });

  it('falls back to the whole day when the end is not after the start', () => {
    expect(resolveSlotRange({ slotMinTime: '20', slotMaxTime: '8' })).toEqual({
      slotMinTime: '0:00:00',
      slotMaxTime: '24:00:00',
    });
  });

  it('falls back to the defaults for empty values', () => {
    expect(resolveSlotRange({ slotMinTime: '', slotMaxTime: '' })).toEqual({
      slotMinTime: '0:00:00',
      slotMaxTime: '24:00:00',
    });
  });
});

describe('compareSortValues', () => {
  const sort = (values: (string | number | null)[], order: 'asc' | 'desc') =>
    values
      .map((sortValue) => ({ sortValue }))
      .sort((a, b) => compareSortValues(a, b, order))
      .map(({ sortValue }) => sortValue);

  it('orders numbers numerically, treating 0 as a regular value', () => {
    expect(sort([10, null, 0, 9], 'asc')).toEqual([0, 9, 10, null]);
  });

  it('always puts empty values last, even in descending order', () => {
    expect(sort([10, null, 0, 9], 'desc')).toEqual([10, 9, 0, null]);
  });

  it('compares strings with localeCompare', () => {
    expect(sort(['b', 'a', null, 'c'], 'asc')).toEqual(['a', 'b', 'c', null]);
  });
});

describe('buildEventOrder', () => {
  it('uses the FullCalendar default order when no sort field is configured', () => {
    expect(buildEventOrder({ sortField: '', sortOrder: 'asc' })).toEqual([
      'start',
      '-duration',
      'allDay',
      'title',
    ]);
  });

  it('orders events that start at the same time by the sort value', () => {
    const order = buildEventOrder({ sortField: 'priority', sortOrder: 'asc' });
    expect(order[0]).toBe('start');
    expect(typeof order[1]).toBe('function');
    expect(order.slice(2)).toEqual(['-duration', 'allDay', 'title']);
  });

  it('passes the sort order to the comparator', () => {
    const [, asc] = buildEventOrder({ sortField: 'priority', sortOrder: 'asc' });
    const [, desc] = buildEventOrder({ sortField: 'priority', sortOrder: 'desc' });
    const low = { sortValue: 1 };
    const high = { sortValue: 2 };
    type Comparator = (a: { sortValue: number }, b: { sortValue: number }) => number;
    expect((asc as Comparator)(low, high)).toBeLessThan(0);
    expect((desc as Comparator)(low, high)).toBeGreaterThan(0);
  });
});

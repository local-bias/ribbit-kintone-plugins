import { DateTime, Settings } from 'luxon';
import { afterEach, describe, expect, it } from 'vitest';
import {
  calendarDateInputToDateTime,
  calendarAllDayEndToInclusive,
  calendarEventDatesToKintone,
  calendarRangeToAllDay,
  getDefaultAllDayRange,
  kintoneRecordDatesToCalendar,
} from './date-conversion';

afterEach(() => {
  Settings.defaultZone = 'system';
});

describe('kintoneRecordDatesToCalendar / calendarEventDatesToKintone round-trip', () => {
  it('all-day single-day range: kintone inclusive end -> calendar exclusive end -> back', () => {
    const toCalendar = kintoneRecordDatesToCalendar({
      startValue: '2026-07-03',
      endValue: '2026-07-03',
      allDay: true,
      zone: 'Asia/Tokyo',
    });
    expect(toCalendar).toEqual({ start: '2026-07-03', end: '2026-07-04' });

    const toKintone = calendarEventDatesToKintone({
      start: toCalendar.start,
      end: toCalendar.end,
      allDay: true,
      startFieldType: 'DATE',
      endFieldType: 'DATE',
      zone: 'Asia/Tokyo',
    });
    expect(toKintone).toEqual({ start: '2026-07-03', end: '2026-07-03' });
  });

  it('all-day multi-day range preserves the last inclusive day symmetrically', () => {
    const toCalendar = kintoneRecordDatesToCalendar({
      startValue: '2026-07-01',
      endValue: '2026-07-03',
      allDay: true,
      zone: 'Asia/Tokyo',
    });
    expect(toCalendar).toEqual({ start: '2026-07-01', end: '2026-07-04' });

    const toKintone = calendarEventDatesToKintone({
      start: toCalendar.start,
      end: toCalendar.end,
      allDay: true,
      startFieldType: 'DATE',
      endFieldType: 'DATE',
      zone: 'Asia/Tokyo',
    });
    expect(toKintone).toEqual({ start: '2026-07-01', end: '2026-07-03' });
  });

  it('is idempotent under repeated round-trips (simulating repeated drags)', () => {
    let kintoneValues = { start: '2026-07-01', end: '2026-07-03' };

    for (let i = 0; i < 5; i++) {
      const calendar = kintoneRecordDatesToCalendar({
        startValue: kintoneValues.start,
        endValue: kintoneValues.end,
        allDay: true,
        zone: 'Asia/Tokyo',
      });
      const back = calendarEventDatesToKintone({
        start: calendar.start,
        end: calendar.end,
        allDay: true,
        startFieldType: 'DATE',
        endFieldType: 'DATE',
        zone: 'Asia/Tokyo',
      });
      kintoneValues = { start: back.start!, end: back.end! };
    }

    expect(kintoneValues).toEqual({ start: '2026-07-01', end: '2026-07-03' });
  });

  it('clamps a zero/negative-length all-day selection to a single day instead of end < start', () => {
    const toKintone = calendarEventDatesToKintone({
      start: '2026-07-03',
      end: '2026-07-03',
      allDay: true,
      startFieldType: 'DATE',
      endFieldType: 'DATE',
      zone: 'Asia/Tokyo',
    });
    expect(toKintone).toEqual({ start: '2026-07-03', end: '2026-07-03' });
  });

  it('missing end field is passed through as null/undefined without throwing', () => {
    const toCalendar = kintoneRecordDatesToCalendar({
      startValue: '2026-07-03',
      endValue: undefined,
      allDay: true,
      zone: 'Asia/Tokyo',
    });
    expect(toCalendar).toEqual({ start: '2026-07-03', end: undefined });

    const toKintone = calendarEventDatesToKintone({
      start: '2026-07-03',
      end: undefined,
      allDay: true,
      startFieldType: 'DATE',
      endFieldType: undefined,
      zone: 'Asia/Tokyo',
    });
    expect(toKintone).toEqual({ start: '2026-07-03', end: null });
  });

  it('timed (non-all-day) DATETIME values round-trip exactly, independent of browser zone', () => {
    Settings.defaultZone = 'America/New_York';

    const toCalendar = kintoneRecordDatesToCalendar({
      startValue: '2026-07-08T03:00:00Z',
      endValue: '2026-07-08T04:00:00Z',
      allDay: false,
      zone: 'Asia/Tokyo',
    });
    // 03:00Z is 12:00 in Tokyo (UTC+9)
    expect(toCalendar).toEqual({ start: '2026-07-08T12:00:00', end: '2026-07-08T13:00:00' });

    const toKintone = calendarEventDatesToKintone({
      start: toCalendar.start,
      end: toCalendar.end,
      allDay: false,
      startFieldType: 'DATETIME',
      endFieldType: 'DATETIME',
      zone: 'Asia/Tokyo',
    });
    expect(DateTime.fromISO(toKintone.start!).toUTC().toISO({ suppressMilliseconds: true })).toBe(
      '2026-07-08T03:00:00Z'
    );
    expect(DateTime.fromISO(toKintone.end!).toUTC().toISO({ suppressMilliseconds: true })).toBe(
      '2026-07-08T04:00:00Z'
    );
  });

  it('mixed DATE start + DATETIME end config forces all-day and truncates the end instant', () => {
    const toCalendar = kintoneRecordDatesToCalendar({
      startValue: '2026-07-01',
      endValue: '2026-07-03T15:00:00Z', // 2026-07-04 00:00 JST
      allDay: true,
      zone: 'Asia/Tokyo',
    });
    // end instant falls at the start of 07-04 in Tokyo -> startOf('day') keeps it on 07-04,
    // then +1 day (inclusive -> exclusive) gives 07-05
    expect(toCalendar).toEqual({ start: '2026-07-01', end: '2026-07-05' });
  });
});

describe('calendarDateInputToDateTime', () => {
  it('decodes a FullCalendar UTC-coerced marker Date as the wall-clock time in `zone`', () => {
    // A marker Date whose UTC getters read 12:00 on 2026-07-08 (the login user's wall time).
    const marker = new Date('2026-07-08T12:00:00Z');
    const dt = calendarDateInputToDateTime(marker, 'Asia/Tokyo');
    expect(dt.zoneName).toBe('Asia/Tokyo');
    expect(dt.toFormat("yyyy-MM-dd'T'HH:mm:ss")).toBe('2026-07-08T12:00:00');
  });

  it('decodes an offset-less canonical string as wall time in `zone`', () => {
    const dt = calendarDateInputToDateTime('2026-07-08T12:00:00', 'Asia/Tokyo');
    expect(dt.toFormat("yyyy-MM-dd'T'HH:mm:ss")).toBe('2026-07-08T12:00:00');
  });

  it('decodes a date-only string as the start of that day in `zone`', () => {
    const dt = calendarDateInputToDateTime('2026-07-03', 'Asia/Tokyo');
    expect(dt.toFormat('yyyy-MM-dd HH:mm:ss')).toBe('2026-07-03 00:00:00');
  });
});

describe('calendarEventDatesToKintone with timed values forced to all-day', () => {
  // FAB(右下の追加ボタン)はDATE型フィールドでも時刻付きの既定値を作るため、全日として保存する際に
  // 「排他的な終了日 → -1日」をそのまま適用すると終了日が開始日の前日になっていた
  it('keeps a same-day timed range on that day for DATE fields', () => {
    const toKintone = calendarEventDatesToKintone({
      start: '2026-11-16T10:30:00',
      end: '2026-11-16T11:00:00',
      allDay: true,
      startFieldType: 'DATE',
      endFieldType: 'DATE',
      zone: 'Asia/Tokyo',
    });
    expect(toKintone).toEqual({ start: '2026-11-16', end: '2026-11-16' });
  });

  it('keeps a timed end that crosses midnight on its own (inclusive) day', () => {
    const toKintone = calendarEventDatesToKintone({
      start: '2026-11-16T23:30:00',
      end: '2026-11-17T00:30:00',
      allDay: true,
      startFieldType: 'DATE',
      endFieldType: 'DATE',
      zone: 'Asia/Tokyo',
    });
    expect(toKintone).toEqual({ start: '2026-11-16', end: '2026-11-17' });
  });

  it('pins a DATETIME end to the start of its own day', () => {
    const toKintone = calendarEventDatesToKintone({
      start: '2026-11-16T10:30:00',
      end: '2026-11-16T11:00:00',
      allDay: true,
      startFieldType: 'DATETIME',
      endFieldType: 'DATETIME',
      zone: 'Asia/Tokyo',
    });
    expect(DateTime.fromISO(toKintone.end!).setZone('Asia/Tokyo').toFormat('yyyy-MM-dd HH:mm')).toBe(
      '2026-11-16 00:00'
    );
  });
});

describe('calendarAllDayEndToInclusive', () => {
  const zone = 'Asia/Tokyo';
  const day = (value: string) => calendarDateInputToDateTime(value, zone);

  it('shifts an exclusive midnight end back by one day', () => {
    expect(calendarAllDayEndToInclusive(day('2026-11-17'), day('2026-11-16')).toISODate()).toBe(
      '2026-11-16'
    );
  });

  it('keeps a non-midnight end on its own day', () => {
    expect(
      calendarAllDayEndToInclusive(day('2026-11-16T11:00:00'), day('2026-11-16T10:30:00')).toISODate()
    ).toBe('2026-11-16');
  });

  it('never returns a day before the start day', () => {
    expect(calendarAllDayEndToInclusive(day('2026-11-16'), day('2026-11-16')).toISODate()).toBe(
      '2026-11-16'
    );
  });
});

describe('getDefaultAllDayRange', () => {
  it('returns today as start and tomorrow as the exclusive end in `zone`', () => {
    const now = DateTime.fromISO('2026-11-16T23:45:00', { zone: 'Asia/Tokyo' });
    expect(getDefaultAllDayRange('Asia/Tokyo', now)).toEqual({
      start: '2026-11-16',
      end: '2026-11-17',
    });
  });

  it('round-trips to a single-day kintone DATE range', () => {
    const now = DateTime.fromISO('2026-11-16T10:10:00', { zone: 'Asia/Tokyo' });
    const range = getDefaultAllDayRange('Asia/Tokyo', now);
    const toKintone = calendarEventDatesToKintone({
      ...range,
      allDay: true,
      startFieldType: 'DATE',
      endFieldType: 'DATE',
      zone: 'Asia/Tokyo',
    });
    expect(toKintone).toEqual({ start: '2026-11-16', end: '2026-11-16' });
  });
});

describe('calendarRangeToAllDay', () => {
  const zone = 'Asia/Tokyo';

  it('turns a same-day time-slot selection into a single all-day day', () => {
    expect(
      calendarRangeToAllDay({ start: '2026-11-16T10:00:00', end: '2026-11-16T11:00:00', zone })
    ).toEqual({ start: '2026-11-16', end: '2026-11-17' });
  });

  it('keeps the last day of a multi-day time-slot selection', () => {
    expect(
      calendarRangeToAllDay({ start: '2026-11-16T10:00:00', end: '2026-11-18T11:00:00', zone })
    ).toEqual({ start: '2026-11-16', end: '2026-11-19' });
  });

  it('treats a selection ending exactly at midnight as ending the previous day', () => {
    expect(
      calendarRangeToAllDay({ start: '2026-11-16T22:00:00', end: '2026-11-17T00:00:00', zone })
    ).toEqual({ start: '2026-11-16', end: '2026-11-17' });
  });

  it('leaves an already all-day range unchanged', () => {
    expect(calendarRangeToAllDay({ start: '2026-11-16', end: '2026-11-18', zone })).toEqual({
      start: '2026-11-16',
      end: '2026-11-18',
    });
  });

  it('passes through missing values', () => {
    expect(calendarRangeToAllDay({ start: '2026-11-16', end: undefined, zone })).toEqual({
      start: '2026-11-16',
      end: undefined,
    });
  });
});

describe('calendarAllDayEndToInclusive without start', () => {
  it('still shifts a midnight end back by one day', () => {
    const end = calendarDateInputToDateTime('2026-11-17', 'Asia/Tokyo');
    expect(calendarAllDayEndToInclusive(end).toISODate()).toBe('2026-11-16');
  });

  it('clamps an end before the start to the start day', () => {
    const start = calendarDateInputToDateTime('2026-11-18', 'Asia/Tokyo');
    const end = calendarDateInputToDateTime('2026-11-16T09:00:00', 'Asia/Tokyo');
    expect(calendarAllDayEndToInclusive(end, start).toISODate()).toBe('2026-11-18');
  });
});

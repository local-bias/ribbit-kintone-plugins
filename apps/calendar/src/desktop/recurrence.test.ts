import { DateTime, Settings } from 'luxon';
import { afterEach, describe, expect, it } from 'vitest';
import {
  applyRecurrenceMetaToEventInput,
  buildRRuleString,
  calendarDurationBetween,
  parseRecurrenceMeta,
  parseRRuleString,
  pluginWeekdayToRRuleWeekday,
  rruleWeekdayToPluginWeekday,
  RecurrenceFormState,
  serializeRecurrenceMeta,
} from './recurrence';

afterEach(() => {
  Settings.defaultZone = 'system';
});

describe('weekday numbering conversion', () => {
  it('maps the plugin numbering (Sunday=0) onto rrule numbering (Monday=0)', () => {
    // Sunday
    expect(pluginWeekdayToRRuleWeekday(0)).toBe(6);
    // Monday
    expect(pluginWeekdayToRRuleWeekday(1)).toBe(0);
    // Saturday
    expect(pluginWeekdayToRRuleWeekday(6)).toBe(5);
  });

  it('is the exact inverse of pluginWeekdayToRRuleWeekday for every day', () => {
    for (let plugin = 0; plugin < 7; plugin++) {
      const rruleDay = pluginWeekdayToRRuleWeekday(plugin);
      expect(rruleWeekdayToPluginWeekday(rruleDay)).toBe(plugin);
    }
  });
});

describe('buildRRuleString / parseRRuleString round-trip', () => {
  const startDt = DateTime.fromISO('2026-07-14T10:00:00', { zone: 'Asia/Tokyo' }); // a Tuesday

  it('WEEKLY with explicit weekdays, and BYDAY reflects the plugin->rrule conversion', () => {
    const form: RecurrenceFormState = {
      freq: 'WEEKLY',
      interval: 2,
      byweekday: [0, 2], // Sunday, Tuesday (plugin numbering)
      monthlyMode: 'dayOfMonth',
      end: { type: 'never' },
    };
    const rule = buildRRuleString(form, startDt);
    expect(rule).toContain('FREQ=WEEKLY');
    expect(rule).toContain('INTERVAL=2');
    expect(rule).toContain('BYDAY=SU,TU');
    expect(rule).not.toContain('DTSTART');

    const parsed = parseRRuleString(rule);
    expect(parsed).toEqual(form);
  });

  it('WEEKLY with no explicit weekday defaults to the series start weekday', () => {
    const form: RecurrenceFormState = {
      freq: 'WEEKLY',
      interval: 1,
      byweekday: [],
      monthlyMode: 'dayOfMonth',
      end: { type: 'never' },
    };
    const rule = buildRRuleString(form, startDt); // startDt is a Tuesday
    expect(rule).toContain('BYDAY=TU');
  });

  it('MONTHLY dayOfMonth mode pins BYMONTHDAY to the start date', () => {
    const form: RecurrenceFormState = {
      freq: 'MONTHLY',
      interval: 1,
      byweekday: [],
      monthlyMode: 'dayOfMonth',
      end: { type: 'never' },
    };
    const rule = buildRRuleString(form, startDt); // 2026-07-14
    expect(rule).toContain('BYMONTHDAY=14');

    const parsed = parseRRuleString(rule);
    expect(parsed.monthlyMode).toBe('dayOfMonth');
  });

  it('MONTHLY weekdayOfMonth mode pins BYDAY + BYSETPOS to "2nd Tuesday"', () => {
    const form: RecurrenceFormState = {
      freq: 'MONTHLY',
      interval: 1,
      byweekday: [],
      monthlyMode: 'weekdayOfMonth',
      end: { type: 'never' },
    };
    // 2026-07-14 is the 2nd Tuesday of July 2026
    const rule = buildRRuleString(form, startDt);
    expect(rule).toContain('BYDAY=TU');
    expect(rule).toContain('BYSETPOS=2');

    const parsed = parseRRuleString(rule);
    expect(parsed.monthlyMode).toBe('weekdayOfMonth');
  });

  it('YEARLY pins BYMONTH + BYMONTHDAY to the start date', () => {
    const form: RecurrenceFormState = {
      freq: 'YEARLY',
      interval: 1,
      byweekday: [],
      monthlyMode: 'dayOfMonth',
      end: { type: 'never' },
    };
    const rule = buildRRuleString(form, startDt);
    expect(rule).toContain('BYMONTH=7');
    expect(rule).toContain('BYMONTHDAY=14');
  });

  it('DAILY needs no derived fields', () => {
    const form: RecurrenceFormState = {
      freq: 'DAILY',
      interval: 3,
      byweekday: [],
      monthlyMode: 'dayOfMonth',
      end: { type: 'never' },
    };
    const rule = buildRRuleString(form, startDt);
    expect(rule).toBe('RRULE:FREQ=DAILY;INTERVAL=3');
  });

  it('end condition "afterCount" round-trips as COUNT', () => {
    const form: RecurrenceFormState = {
      freq: 'DAILY',
      interval: 1,
      byweekday: [],
      monthlyMode: 'dayOfMonth',
      end: { type: 'afterCount', count: 10 },
    };
    const rule = buildRRuleString(form, startDt);
    expect(rule).toContain('COUNT=10');
    expect(parseRRuleString(rule).end).toEqual({ type: 'afterCount', count: 10 });
  });

  it('end condition "onDate" round-trips to the same calendar date, independent of browser zone', () => {
    Settings.defaultZone = 'America/New_York';
    const form: RecurrenceFormState = {
      freq: 'DAILY',
      interval: 1,
      byweekday: [],
      monthlyMode: 'dayOfMonth',
      end: { type: 'onDate', date: '2026-08-31' },
    };
    const rule = buildRRuleString(form, startDt);
    expect(parseRRuleString(rule).end).toEqual({ type: 'onDate', date: '2026-08-31' });
  });

  it('end condition "never" produces no COUNT/UNTIL', () => {
    const form: RecurrenceFormState = {
      freq: 'WEEKLY',
      interval: 1,
      byweekday: [1],
      monthlyMode: 'dayOfMonth',
      end: { type: 'never' },
    };
    const rule = buildRRuleString(form, startDt);
    expect(rule).not.toContain('COUNT');
    expect(rule).not.toContain('UNTIL');
  });
});

describe('parseRecurrenceMeta / serializeRecurrenceMeta', () => {
  it('round-trips a master meta', () => {
    const meta = { kind: 'master' as const, rrule: 'RRULE:FREQ=WEEKLY', exceptions: ['2026-07-01T10:00:00'] };
    expect(parseRecurrenceMeta(serializeRecurrenceMeta(meta))).toEqual(meta);
  });

  it('round-trips an override meta', () => {
    const meta = { kind: 'override' as const, masterId: '42', originalStart: '2026-07-08T10:00:00' };
    expect(parseRecurrenceMeta(serializeRecurrenceMeta(meta))).toEqual(meta);
  });

  it.each([undefined, null, '', 'not json', '{}', '{"kind":"bogus"}', '{"kind":"master"}'])(
    'falls back to null for unparsable input: %s',
    (raw) => {
      expect(parseRecurrenceMeta(raw as string | undefined | null)).toBeNull();
    }
  );
});

describe('calendarDurationBetween', () => {
  it('computes the millisecond span between two calendar-space values', () => {
    const duration = calendarDurationBetween('2026-07-08T10:00:00', '2026-07-08T12:30:00', 'Asia/Tokyo');
    expect(duration).toEqual({ milliseconds: 2.5 * 60 * 60 * 1000 });
  });
});

describe('applyRecurrenceMetaToEventInput', () => {
  it('for an override: passes through unchanged, with no rrule/duration/exdate', () => {
    const meta = { kind: 'override' as const, masterId: '1', originalStart: '2026-07-08T10:00:00' };
    const result = applyRecurrenceMetaToEventInput({
      meta,
      start: '2026-07-08T10:00:00',
      end: '2026-07-08T11:00:00',
      zone: 'Asia/Tokyo',
    });
    expect(result).toEqual({ extendedProps: { recurrence: meta } });
  });

  it('for a master: injects the real dtstart and produces rrule/duration/exdate/editable', () => {
    const meta = {
      kind: 'master' as const,
      rrule: 'RRULE:FREQ=WEEKLY;BYDAY=TU',
      exceptions: ['2026-07-21T10:00:00'],
    };
    const result = applyRecurrenceMetaToEventInput({
      meta,
      start: '2026-07-14T10:00:00',
      end: '2026-07-14T11:00:00',
      zone: 'Asia/Tokyo',
    });

    expect(result.editable).toBe(false);
    expect(result.duration).toEqual({ milliseconds: 60 * 60 * 1000 });
    expect(result.rrule).toContain('DTSTART');
    expect(result.rrule).toContain('FREQ=WEEKLY');
    expect(result.exdate).toHaveLength(1);
    expect(result.extendedProps.recurrence).toEqual(meta);
  });

  it('regression: exdate entries are ISO strings, not Date objects', () => {
    // @fullcalendar/rrule parses `exdate` entries with FullCalendar's plain ISO-string
    // marker parser (not DateEnv.createMarkerMeta) — passing raw Date objects makes that
    // parser return null, which crashes later property access ("Cannot read properties of
    // null (reading 'marker')") as soon as a master has at least one exception.
    const meta = {
      kind: 'master' as const,
      rrule: 'RRULE:FREQ=WEEKLY;BYDAY=TU',
      exceptions: ['2026-07-21T10:00:00', '2026-07-28'],
    };
    const result = applyRecurrenceMetaToEventInput({
      meta,
      start: '2026-07-14T10:00:00',
      end: '2026-07-14T11:00:00',
      zone: 'Asia/Tokyo',
    });

    expect(result.exdate).toHaveLength(2);
    for (const value of result.exdate!) {
      expect(typeof value).toBe('string');
      expect(Number.isNaN(Date.parse(value))).toBe(false);
    }
  });
});

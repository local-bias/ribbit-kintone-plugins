import { DateTime, Settings } from 'luxon';
import { RRule } from 'rrule';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
  vi.useRealTimers();
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

describe('applyRecurrenceMetaToEventInput: generated occurrence times', () => {
  // The pattern text stored per record is deliberately DTSTART-agnostic. `RRule.fromString`
  // used to be asked for its *parsed* options, which fills BYHOUR/BYMINUTE/BYSECOND from
  // `new Date()` whenever no dtstart is present — so every occurrence rendered at the current
  // wall clock (and drifted forward a minute at a time) instead of the record's start time.
  const occurrencesOf = (rrule: string, count: number): string[] =>
    RRule.fromString(rrule)
      .all((_, index) => index < count)
      .map((date) => date.toISOString());

  beforeEach(() => {
    // A "now" deliberately unlike the fixtures' 10:00 start, so any leakage is visible.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-16T03:47:19.000Z'));
  });

  const buildMaster = (rrule: string) =>
    applyRecurrenceMetaToEventInput({
      meta: { kind: 'master' as const, rrule, exceptions: [] },
      start: '2026-07-14T10:00:00', // a Tuesday
      end: '2026-07-14T11:00:00',
      zone: 'Asia/Tokyo',
    });

  it('never leaks the current clock into the rule text', () => {
    const { rrule } = buildMaster('RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=TU');
    expect(rrule).toBe('DTSTART:20260714T100000Z\nRRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=TU');
    expect(rrule).not.toMatch(/BYHOUR|BYMINUTE|BYSECOND/);
  });

  it('WEEKLY: every occurrence keeps the record start time', () => {
    const { rrule } = buildMaster('RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=TU');
    expect(occurrencesOf(rrule!, 3)).toEqual([
      '2026-07-14T10:00:00.000Z',
      '2026-07-21T10:00:00.000Z',
      '2026-07-28T10:00:00.000Z',
    ]);
  });

  it('MONTHLY: the first occurrence is the series start itself, not the next month', () => {
    const { rrule } = buildMaster('RRULE:FREQ=MONTHLY;INTERVAL=1;BYMONTHDAY=14');
    expect(occurrencesOf(rrule!, 3)).toEqual([
      '2026-07-14T10:00:00.000Z',
      '2026-08-14T10:00:00.000Z',
      '2026-09-14T10:00:00.000Z',
    ]);
  });

  it('DAILY: interval and count survive the dtstart injection', () => {
    const { rrule } = buildMaster('RRULE:FREQ=DAILY;INTERVAL=3;COUNT=3');
    expect(occurrencesOf(rrule!, 5)).toEqual([
      '2026-07-14T10:00:00.000Z',
      '2026-07-17T10:00:00.000Z',
      '2026-07-20T10:00:00.000Z',
    ]);
  });

  it('YEARLY: BYMONTH/BYMONTHDAY survive the dtstart injection', () => {
    const { rrule } = buildMaster('RRULE:FREQ=YEARLY;INTERVAL=1;BYMONTH=7;BYMONTHDAY=14');
    expect(occurrencesOf(rrule!, 2)).toEqual([
      '2026-07-14T10:00:00.000Z',
      '2027-07-14T10:00:00.000Z',
    ]);
  });

  it('produces the exact same rule text whatever the current clock says', () => {
    const first = buildMaster('RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=TU').rrule;
    vi.setSystemTime(new Date('2026-07-16T03:48:19.000Z')); // one minute later
    expect(buildMaster('RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=TU').rrule).toBe(first);
  });

  it('exdate entries line up exactly with the generated occurrences', () => {
    const result = applyRecurrenceMetaToEventInput({
      meta: {
        kind: 'master' as const,
        rrule: 'RRULE:FREQ=WEEKLY;INTERVAL=1;BYDAY=TU',
        exceptions: ['2026-07-21T10:00:00'],
      },
      start: '2026-07-14T10:00:00',
      end: '2026-07-14T11:00:00',
      zone: 'Asia/Tokyo',
    });
    // An EXDATE only removes an occurrence when it matches to the millisecond.
    expect(result.exdate).toEqual(['2026-07-21T10:00:00.000Z']);
    expect(occurrencesOf(result.rrule!, 3)).toContain('2026-07-21T10:00:00.000Z');
  });

  it('falls back to a plain event (no rrule) when the stored pattern is unusable', () => {
    for (const broken of ['', 'not a rule', 'RRULE:INTERVAL=2']) {
      const result = buildMaster(broken);
      expect(result.rrule).toBeUndefined();
      expect(result.extendedProps.recurrence.kind).toBe('master');
    }
  });
});

describe('parseRRuleString: no current-clock defaults', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // A Friday — the weekday rrule would otherwise substitute for a missing BYDAY.
    vi.setSystemTime(new Date('2026-07-17T03:47:19.000Z'));
  });

  it('leaves byweekday empty when the pattern has no BYDAY', () => {
    expect(parseRRuleString('RRULE:FREQ=WEEKLY;INTERVAL=1').byweekday).toEqual([]);
  });

  it('falls back to the default form for unusable pattern text instead of throwing', () => {
    for (const broken of ['', 'not a rule']) {
      expect(() => parseRRuleString(broken)).not.toThrow();
      expect(parseRRuleString(broken)).toEqual({
        freq: 'WEEKLY',
        interval: 1,
        byweekday: [],
        monthlyMode: 'dayOfMonth',
        end: { type: 'never' },
      });
    }
  });
});

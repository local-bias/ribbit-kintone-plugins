import {
  calendarDateInputToDateTime,
  calendarValueToUtcCoercedDate,
  DATE_FORMAT,
  dateTimeToUtcCoercedDate,
} from '@/desktop/date-conversion';
import { DateInput, DurationInput } from '@fullcalendar/core';
import { DateTime } from 'luxon';
import { ByWeekday, Frequency, Options, RRule } from 'rrule';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Stored JSON shape (one kintone text field holds this per record)
// ---------------------------------------------------------------------------

export const RecurrenceMasterMetaSchema = z.object({
  kind: z.literal('master'),
  /**
   * DTSTART-agnostic RRULE pattern text, e.g. "RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE".
   * Deliberately never carries a DTSTART line: the record's own start field is the single
   * source of truth for occurrence #1 / the pattern's anchor date. Baking DTSTART into this
   * string too would require keeping both in sync on every start-date edit.
   */
  rrule: z.string(),
  /** Calendar-space start strings of occurrences to exclude from rendering — populated when
   *  a single occurrence is detached (edited) or deleted. Equivalent to iCal's EXDATE. */
  exceptions: z.array(z.string()),
});
export type RecurrenceMasterMeta = z.infer<typeof RecurrenceMasterMetaSchema>;

export const RecurrenceOverrideMetaSchema = z.object({
  kind: z.literal('override'),
  /** kintone $id of the master record this occurrence was detached from. */
  masterId: z.string(),
  /** Calendar-space start string of the original (undetached) occurrence this record
   *  replaces. Also the value appended to the master's `exceptions`. */
  originalStart: z.string(),
});
export type RecurrenceOverrideMeta = z.infer<typeof RecurrenceOverrideMetaSchema>;

export const RecurrenceMetaSchema = z.discriminatedUnion('kind', [
  RecurrenceMasterMetaSchema,
  RecurrenceOverrideMetaSchema,
]);
export type RecurrenceMeta = z.infer<typeof RecurrenceMetaSchema>;

/** Empty/unparsable/absent => plain (non-recurring) record. Never throws. */
export const parseRecurrenceMeta = (raw: string | undefined | null): RecurrenceMeta | null => {
  if (!raw) return null;
  try {
    const result = RecurrenceMetaSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
};

export const serializeRecurrenceMeta = (meta: RecurrenceMeta): string => JSON.stringify(meta);

// ---------------------------------------------------------------------------
// Weekday numbering conversion
//
// This plugin's own convention (WEEK_DAYS in src/lib/calendar.ts, the `daysOfWeek` schema
// field, JS `Date#getDay()`) is Sunday=0..Saturday=6. The `rrule` package numbers weekdays
// Monday=0..Sunday=6. Every place that crosses this boundary must go through these two
// functions — never compare/assign the raw numbers directly.
// ---------------------------------------------------------------------------

export const pluginWeekdayToRRuleWeekday = (pluginWeekday: number): number => (pluginWeekday + 6) % 7;
export const rruleWeekdayToPluginWeekday = (rruleWeekday: number): number => (rruleWeekday + 1) % 7;

/** Luxon's `DateTime#weekday` is ISO (Monday=1..Sunday=7); `% 7` maps it onto this plugin's
 *  Sunday=0..Saturday=6 numbering directly (Sunday 7 -> 0, Monday 1 -> 1, ... Saturday 6 -> 6). */
export const pluginWeekdayFromDateTime = (dateTime: DateTime): number => dateTime.weekday % 7;

// ---------------------------------------------------------------------------
// Friendly recurrence builder-form state <-> RRULE string
// ---------------------------------------------------------------------------

export type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type RecurrenceMonthlyMode = 'dayOfMonth' | 'weekdayOfMonth';
export type RecurrenceEndCondition =
  | { type: 'never' }
  | { type: 'onDate'; date: string } // calendar-space DATE_FORMAT string, inclusive last day
  | { type: 'afterCount'; count: number };

export type RecurrenceFormState = {
  freq: RecurrenceFrequency;
  interval: number;
  /** Plugin weekday numbers (0=Sun..6=Sat). Only meaningful for `freq === 'WEEKLY'`. Empty
   *  means "same weekday as the series start", resolved against `startDt` when building. */
  byweekday: number[];
  /** Only meaningful for `freq === 'MONTHLY'`. */
  monthlyMode: RecurrenceMonthlyMode;
  end: RecurrenceEndCondition;
};

const FREQUENCY_TO_RRULE: Record<RecurrenceFrequency, Frequency> = {
  DAILY: RRule.DAILY,
  WEEKLY: RRule.WEEKLY,
  MONTHLY: RRule.MONTHLY,
  YEARLY: RRule.YEARLY,
};
const RRULE_TO_FREQUENCY: Partial<Record<Frequency, RecurrenceFrequency>> = {
  [RRule.DAILY]: 'DAILY',
  [RRule.WEEKLY]: 'WEEKLY',
  [RRule.MONTHLY]: 'MONTHLY',
  [RRule.YEARLY]: 'YEARLY',
};

/**
 * Builds a DTSTART-agnostic RRULE pattern string from the friendly form state.
 *
 * `startDt` (the series' own start, already anchored to the login user's zone) is used only
 * to resolve values the form itself doesn't ask for explicitly (default weekly weekday, the
 * monthly/yearly day-of-month or nth-weekday-of-month) — never persisted as DTSTART.
 */
export const buildRRuleString = (form: RecurrenceFormState, startDt: DateTime): string => {
  const options: Partial<Options> = {
    freq: FREQUENCY_TO_RRULE[form.freq],
    interval: Math.max(1, form.interval),
  };

  if (form.freq === 'WEEKLY') {
    const pluginWeekdays = form.byweekday.length > 0 ? form.byweekday : [pluginWeekdayFromDateTime(startDt)];
    options.byweekday = pluginWeekdays.map(pluginWeekdayToRRuleWeekday);
  } else if (form.freq === 'MONTHLY') {
    if (form.monthlyMode === 'weekdayOfMonth') {
      const nth = Math.ceil(startDt.day / 7);
      options.byweekday = [pluginWeekdayToRRuleWeekday(pluginWeekdayFromDateTime(startDt))];
      options.bysetpos = nth >= 5 ? -1 : nth; // "5th" doesn't exist every month; fall back to "last"
    } else {
      options.bymonthday = startDt.day;
    }
  } else if (form.freq === 'YEARLY') {
    options.bymonth = startDt.month;
    options.bymonthday = startDt.day;
  }

  if (form.end.type === 'afterCount') {
    options.count = Math.max(1, form.end.count);
  } else if (form.end.type === 'onDate') {
    // Inclusive: stop only after the end of that calendar day, so an occurrence landing on
    // this day still counts.
    const untilDt = DateTime.fromISO(form.end.date, { zone: startDt.zoneName ?? undefined }).endOf('day');
    options.until = dateTimeToUtcCoercedDate(untilDt);
  }

  return new RRule(options).toString();
};

const WEEKDAY_STRING_TO_RRULE_WEEKDAY: Record<string, number> = {
  MO: 0,
  TU: 1,
  WE: 2,
  TH: 3,
  FR: 4,
  SA: 5,
  SU: 6,
};

/**
 * Extracts *only* the fields the stored pattern text actually spells out.
 *
 * `RRule.fromString(...).options` must never be used for this. `parseOptions` fills every
 * unspecified field with a default derived from `dtstart`, and a DTSTART-agnostic pattern has
 * no dtstart — so rrule substitutes `new Date()`. That silently bakes the *current* clock into
 * `byhour`/`byminute`/`bysecond` (plus the weekday / day-of-month fallbacks), which is what
 * made every occurrence render at "now" and creep forward one minute at a time.
 * `RRule.parseString` performs no such defaulting.
 *
 * Returns `null` when the text is not a usable pattern (empty / hand-edited field), so callers
 * can fall back instead of throwing out of a render.
 */
const parseStoredRRuleOptions = (rrule: string): Partial<Options> | null => {
  try {
    const options = RRule.parseString(rrule);
    return options?.freq != null ? options : null;
  } catch (error) {
    console.warn('繰り返しパターンの解析に失敗しました', { rrule, error });
    return null;
  }
};

/** Normalizes `RRule.parseString`'s `byweekday` (a number, a `Weekday`, a `'MO'`-style string,
 *  or an array of those) into plain rrule weekday numbers. */
const toRRuleWeekdayNumbers = (byweekday: Options['byweekday'] | undefined): number[] => {
  if (byweekday == null) return [];
  const entries: ByWeekday[] = Array.isArray(byweekday) ? byweekday : [byweekday];
  return entries.map((entry) => {
    if (typeof entry === 'number') return entry;
    if (typeof entry === 'string') return WEEKDAY_STRING_TO_RRULE_WEEKDAY[entry.toUpperCase()] ?? 0;
    return entry.weekday;
  });
};

/** Inverse of {@link buildRRuleString} — reconstructs form state for the edit-series UI. */
export const parseRRuleString = (rrule: string): RecurrenceFormState => {
  const options = parseStoredRRuleOptions(rrule);

  const freqKey: RecurrenceFrequency =
    (options?.freq != null ? RRULE_TO_FREQUENCY[options.freq] : undefined) ?? 'WEEKLY';
  const rruleWeekdays = toRRuleWeekdayNumbers(options?.byweekday);
  const { count, until } = options ?? {};

  const end: RecurrenceEndCondition =
    count != null
      ? { type: 'afterCount', count }
      : until != null
        ? { type: 'onDate', date: DateTime.fromJSDate(until, { zone: 'utc' }).toFormat(DATE_FORMAT) }
        : { type: 'never' };

  const monthlyMode: RecurrenceMonthlyMode =
    freqKey === 'MONTHLY' && rruleWeekdays.length > 0 ? 'weekdayOfMonth' : 'dayOfMonth';

  return {
    freq: freqKey,
    interval: options?.interval || 1,
    byweekday: freqKey === 'WEEKLY' ? rruleWeekdays.map(rruleWeekdayToPluginWeekday) : [],
    monthlyMode,
    end,
  };
};

// ---------------------------------------------------------------------------
// EventInput assembly — the one place FullCalendar-facing recurrence fields are produced
// ---------------------------------------------------------------------------

/** Length of one occurrence, as a FullCalendar `DurationInput`. */
export const calendarDurationBetween = (start: DateInput, end: DateInput, zone: string): DurationInput => {
  const startDt = calendarDateInputToDateTime(start, zone);
  const endDt = calendarDateInputToDateTime(end, zone);
  return { milliseconds: endDt.diff(startDt).as('milliseconds') };
};

export type RecurrenceEventFields = {
  rrule?: string;
  duration?: DurationInput;
  exdate?: string[];
  editable?: boolean;
  extendedProps: { recurrence: RecurrenceMeta };
};

/** True when the produced fields actually drive FullCalendar's rrule plugin — i.e. the caller
 *  must drop the event's own `start`/`end`. False for overrides and unparsable patterns, which
 *  keep rendering from their own `start`/`end`. */
export const hasRecurrenceExpansion = (
  fields: RecurrenceEventFields
): fields is RecurrenceEventFields & { rrule: string } => fields.rrule != null;

/**
 * Turns a `RecurrenceMeta` + the record's own start/end into the FullCalendar-facing fields.
 *
 * For a master: `start`/`end` must NOT also be set on the resulting event — FullCalendar's
 * rrule plugin derives every occurrence's date from `rrule`+`duration`, not `start`/`end`.
 * For an override: no FullCalendar-specific fields are produced; the record keeps rendering
 * via its own plain `start`/`end` like any non-recurring record.
 */
export const applyRecurrenceMetaToEventInput = (params: {
  meta: RecurrenceMeta;
  start: DateInput;
  end: DateInput;
  zone: string;
}): RecurrenceEventFields => {
  const { meta, start, end, zone } = params;

  if (meta.kind === 'override') {
    return { extendedProps: { recurrence: meta } };
  }

  const startDt = calendarDateInputToDateTime(start, zone);
  const dtstart = dateTimeToUtcCoercedDate(startDt);

  // Re-inject the real dtstart (from the record's own start field) into the stored,
  // DTSTART-agnostic pattern, then re-serialize — this is the only place dtstart and the
  // stored pattern are combined. Only the fields the pattern itself spells out may be carried
  // over (see `parseStoredRRuleOptions`); anything rrule would default from a missing dtstart
  // would pin the whole series to the current clock instead of the record's start time.
  const storedOptions = parseStoredRRuleOptions(meta.rrule);
  if (!storedOptions) {
    // Unusable pattern text: give up on expansion rather than throwing out of the render, and
    // let the caller keep drawing this record as a single event from its own start/end.
    return { extendedProps: { recurrence: meta } };
  }
  const fullRule = new RRule({ ...storedOptions, dtstart });

  // @fullcalendar/rrule parses `exdate` entries with FullCalendar's plain ISO-string marker
  // parser (not DateEnv.createMarkerMeta), which only accepts strings — a raw `Date` object
  // silently fails to parse (returns null) and crashes later property access. `toISOString()`
  // keeps the same UTC-coerced wall-clock numbers, just as a string instead of a Date.
  const exdate = meta.exceptions.map((iso) => calendarValueToUtcCoercedDate(iso, zone).toISOString());

  return {
    rrule: fullRule.toString(),
    duration: calendarDurationBetween(start, end, zone),
    exdate,
    editable: false,
    extendedProps: { recurrence: meta },
  };
};

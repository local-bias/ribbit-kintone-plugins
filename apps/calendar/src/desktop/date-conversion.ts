import { DateInput } from '@fullcalendar/core';
import { DateTime } from 'luxon';

export type CalendarFieldType = 'DATE' | 'DATETIME';

/** Canonical FullCalendar-space string formats used throughout this plugin. */
export const DATE_FORMAT = 'yyyy-MM-dd';
export const WALL_TIME_FORMAT = "yyyy-MM-dd'T'HH:mm:ss";

/** The kintone login user's timezone — the single timezone this plugin renders and saves in. */
export const getLoginUserTimezone = (): string => kintone.getLoginUser().timezone;

/**
 * Decodes any FullCalendar `DateInput` into a Luxon `DateTime` anchored to `zone`.
 *
 * FullCalendar is given a named `timeZone` prop without a timezone plugin installed, so it
 * runs in "UTC-coercion" mode: the `Date` objects it hands back through callbacks
 * (`eventChange`, `select`, `EventApi.start`, ...) are not real instants — their UTC getters
 * hold the *wall-clock* time in that named zone. `keepLocalTime` re-anchors those numbers to
 * `zone` without shifting them, which is the correct way to read them back.
 */
export const calendarDateInputToDateTime = (input: DateInput, zone: string): DateTime => {
  if (typeof input === 'string') {
    return DateTime.fromISO(input, { zone });
  }
  if (typeof input === 'number') {
    return DateTime.fromSeconds(input, { zone });
  }
  if (Array.isArray(input)) {
    const [year, month = 0, day = 1, hour = 0, minute = 0, second = 0, millisecond = 0] = input;
    return DateTime.fromObject(
      { year, month: month + 1, day, hour, minute, second, millisecond },
      { zone }
    );
  }
  return DateTime.fromJSDate(input, { zone: 'utc' }).setZone(zone, { keepLocalTime: true });
};

/**
 * Re-anchors a `DateTime` to the "UTC-coerced" representation FullCalendar (and the `rrule`
 * library, which has no IANA timezone concept of its own) expect: a JS `Date` whose UTC
 * getters hold the wall-clock numbers, with the original zone discarded. Inverse of reading
 * a marker Date back via `calendarDateInputToDateTime(date, zone)`.
 */
export const dateTimeToUtcCoercedDate = (dateTime: DateTime): Date =>
  dateTime.setZone('utc', { keepLocalTime: true }).toJSDate();

/** Encodes a calendar-space `DateInput` directly as a UTC-coerced `Date`. */
export const calendarValueToUtcCoercedDate = (input: DateInput, zone: string): Date =>
  dateTimeToUtcCoercedDate(calendarDateInputToDateTime(input, zone));

/** Formats a `DateTime` back into the canonical calendar-space string. */
export const dateTimeToCalendarValue = (dateTime: DateTime, allDay: boolean): string =>
  dateTime.toFormat(allDay ? DATE_FORMAT : WALL_TIME_FORMAT);

/**
 * Converts kintone record field values into FullCalendar-space `{ start, end }` strings.
 *
 * kintone's DATE end value is *inclusive* ("through this day"); FullCalendar's all-day `end`
 * is *exclusive* ("up to, not including, this day") — so all-day ends get +1 day here. Values
 * are anchored to `zone` so a DATETIME instant lands on the correct calendar day for the
 * viewing user, not the server's.
 */
export const kintoneRecordDatesToCalendar = (params: {
  startValue: string | undefined;
  endValue: string | undefined;
  allDay: boolean;
  zone: string;
}): { start: string | undefined; end: string | undefined } => {
  const { startValue, endValue, allDay, zone } = params;

  const parse = (value: string | undefined) => (value ? DateTime.fromISO(value, { zone }) : undefined);

  const startDt = parse(startValue);
  const endDt = parse(endValue);

  if (!allDay) {
    return {
      start: startDt ? dateTimeToCalendarValue(startDt, false) : undefined,
      end: endDt ? dateTimeToCalendarValue(endDt, false) : undefined,
    };
  }

  return {
    start: startDt ? dateTimeToCalendarValue(startDt.startOf('day'), true) : undefined,
    end: endDt ? dateTimeToCalendarValue(endDt.startOf('day').plus({ days: 1 }), true) : undefined,
  };
};

/**
 * Converts FullCalendar-space event values back into kintone record field values.
 * Inverse of {@link kintoneRecordDatesToCalendar}: all-day ends get −1 day.
 */
export const calendarEventDatesToKintone = (params: {
  start: DateInput | undefined;
  end: DateInput | undefined;
  allDay: boolean;
  startFieldType: CalendarFieldType;
  endFieldType: CalendarFieldType | undefined;
  zone: string;
}): { start: string | null; end: string | null } => {
  const { start, end, allDay, startFieldType, endFieldType, zone } = params;

  const startDt = start ? calendarDateInputToDateTime(start, zone) : undefined;
  let endDt = end ? calendarDateInputToDateTime(end, zone) : undefined;

  if (allDay && endDt) {
    // Defensive clamp: a zero/negative-length selection (e.g. a missing end filled in with
    // the start value) collapses to a single day instead of producing an end before start.
    endDt = startDt && endDt <= startDt ? startDt : endDt.minus({ days: 1 });
  }

  const format = (dt: DateTime | undefined, fieldType: CalendarFieldType | undefined): string | null => {
    if (!dt || !fieldType) return null;
    if (fieldType === 'DATE') {
      return dt.toFormat(DATE_FORMAT);
    }
    // A DATETIME field storing an all-day value is pinned to the start of that calendar day.
    return (allDay ? dt.startOf('day') : dt).toISO();
  };

  return {
    start: format(startDt, startFieldType),
    end: format(endDt, endFieldType),
  };
};

/** Default start/end for a brand-new timed event, rounded to the nearest half hour, in `zone`. */
export const getDefaultStartDate = (zone: string): string => {
  const now = DateTime.now().setZone(zone);
  const { minute } = now;
  const rounded = [0, 30].includes(minute)
    ? now
    : minute < 30
      ? now.set({ minute: 30 })
      : now.plus({ hours: 1 }).set({ minute: 0 });
  return dateTimeToCalendarValue(rounded, false);
};

export const getDefaultEndDate = (zone: string): string => {
  const now = DateTime.now().setZone(zone);
  const { minute } = now;
  const rounded =
    minute === 0
      ? now.set({ minute: 30 })
      : minute === 30
        ? now.plus({ hours: 1 }).set({ minute: 0 })
        : minute < 30
          ? now.plus({ hours: 1 }).set({ minute: 30 })
          : now.plus({ hours: 2 }).set({ minute: 0 });
  return dateTimeToCalendarValue(rounded, false);
};

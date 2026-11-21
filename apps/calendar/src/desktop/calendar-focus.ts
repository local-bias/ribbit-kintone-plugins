import type { DateInput } from '@fullcalendar/core';
import { DateTime } from 'luxon';
import { calendarDateInputToDateTime } from './date-conversion';

/**
 * サイドバーのミニカレンダーとメインのカレンダーを連動させるための日付ユーティリティ。
 *
 * 日付はすべて、ログインユーザーのタイムゾーンにおける`yyyy-MM-dd`形式の文字列で扱う。
 * FullCalendarは名前付きタイムゾーン(UTC-coercionモード)で動作しているため、`Date`を
 * そのまま受け渡すと日付がずれる(例: 日本時間の0時は前日のUTC時刻)。文字列であれば
 * FullCalendar・ミニカレンダーのどちらでもタイムゾーンの影響を受けずに同じ日付を指せる。
 */

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** メインのカレンダーが表示している期間(両端を含む) */
export interface CalendarVisibleRange {
  /** 期間の初日 */
  start: string;
  /** 期間の最終日 */
  last: string;
}

/** ミニカレンダー上で、表示期間の帯のどこに位置する日付か */
export type RangePosition = 'start' | 'middle' | 'end';

export const isIsoDate = (value: string): boolean => ISO_DATE_PATTERN.test(value);

/** FullCalendarの日付(UTC-coercionされた`Date`等)を、指定タイムゾーンの`yyyy-MM-dd`に変換する */
export const toCalendarIsoDate = (input: DateInput, zone: string): string | null =>
  calendarDateInputToDateTime(input, zone).toISODate();

/**
 * FullCalendarのビューが持つ「現在の期間」(`view.currentStart`〜`view.currentEnd`、終端は含まない)
 * から、両端を含む表示期間を組み立てる。
 *
 * 月表示の`currentStart`/`currentEnd`は、グリッドに見えている前後の月の日付を含まない
 * 「その月そのもの」の期間を指す。
 */
export const buildVisibleRange = (params: {
  currentStart: DateInput;
  currentEnd: DateInput;
  zone: string;
}): CalendarVisibleRange | null => {
  const { currentStart, currentEnd, zone } = params;
  const start = toCalendarIsoDate(currentStart, zone);
  const last = calendarDateInputToDateTime(currentEnd, zone).minus({ days: 1 }).toISODate();
  if (!start || !last || last < start) {
    return null;
  }
  return { start, last };
};

const isInRange = (date: string, range: CalendarVisibleRange): boolean =>
  range.start <= date && date <= range.last;

const shiftIsoDate = (date: string, days: number): string | null =>
  DateTime.fromISO(date, { zone: 'utc' }).plus({ days }).toISODate();

const daysBetween = (from: string, to: string): number =>
  Math.round(
    DateTime.fromISO(to, { zone: 'utc' }).diff(DateTime.fromISO(from, { zone: 'utc' }), 'days').days
  );

/** `next`が`previous`の直後、または直前の期間かどうか(前後の期間への移動で起こる) */
const areAdjacentRanges = (previous: CalendarVisibleRange, next: CalendarVisibleRange): boolean =>
  next.start === shiftIsoDate(previous.last, 1) || next.last === shiftIsoDate(previous.start, -1);

/**
 * メインのカレンダーの表示期間が変わったときの、選択中の日付を決める。
 *
 * FullCalendarは前後の期間へ移動(PREV/NEXT)すると「現在の日付」を新しい期間の初日に
 * 置き換えるため、そのままでは選んでいない日付(翌月1日・翌週の週初めなど)が選択中になる。
 * 一般的なカレンダーアプリと同様、前後の期間へ移動した場合は、期間内での位置(週表示なら
 * 同じ曜日、月表示なら同じ日)を保った日付を選択中にする。移動先の期間が短い場合は
 * 最終日に丸める(1/31から翌月へ移動すると2/28)。
 *
 * それ以外(ミニカレンダーでの選択・「今日」・表示の切り替え)は、FullCalendarの
 * 「現在の日付」をそのまま使う。
 */
export const resolveFocusedDate = (params: {
  previousRange: CalendarVisibleRange | null;
  previousFocusedDate: string | null;
  nextRange: CalendarVisibleRange;
  calendarDate: string | null;
}): string => {
  const { previousRange, previousFocusedDate, nextRange, calendarDate } = params;
  const fallback = calendarDate ?? nextRange.start;

  if (
    !previousRange ||
    !previousFocusedDate ||
    calendarDate !== nextRange.start ||
    !areAdjacentRanges(previousRange, nextRange) ||
    !isInRange(previousFocusedDate, previousRange)
  ) {
    return fallback;
  }

  const offset = daysBetween(previousRange.start, previousFocusedDate);
  const shifted = shiftIsoDate(nextRange.start, offset);
  if (!shifted) {
    return fallback;
  }
  return shifted > nextRange.last ? nextRange.last : shifted;
};

/**
 * 日付が表示期間のどこに位置するかを返す。期間外、または期間が1日だけの場合(日表示など。
 * 選択中の日付の強調表示だけで十分なため帯は描かない)は`null`を返す。
 *
 * `yyyy-MM-dd`形式の文字列は辞書順と日付順が一致するため、そのまま比較できる。
 */
export const getRangePosition = (
  date: string,
  range: CalendarVisibleRange | null
): RangePosition | null => {
  if (!range || range.start === range.last) {
    return null;
  }
  if (!isInRange(date, range)) {
    return null;
  }
  if (date === range.start) {
    return 'start';
  }
  if (date === range.last) {
    return 'end';
  }
  return 'middle';
};

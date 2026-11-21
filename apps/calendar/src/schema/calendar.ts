import { z } from 'zod';

/**
 * カレンダーの表示形式
 *
 * - dayGridMonth: 月表示
 * - timeGridWeek: 週表示
 * - timeGridDay: 日表示
 * - timeGridFiveDay: 5日表示
 * - timeGridThreeDay: 3日表示
 */
export const CALENDAR_VIEW_TYPES = [
  'dayGridMonth',
  'timeGridWeek',
  'timeGridDay',
  'timeGridFiveDay',
  'timeGridThreeDay',
] as const;

// 配列から型を作成
export type CalendarViewType = (typeof CALENDAR_VIEW_TYPES)[number];

export const CalendarViewTypeSchema = z.enum(CALENDAR_VIEW_TYPES);

/** ヘッダーの切り替えボタンの並び順(期間の長い順) */
export const VIEW_BUTTON_ORDER: readonly CalendarViewType[] = [
  'dayGridMonth',
  'timeGridWeek',
  'timeGridFiveDay',
  'timeGridThreeDay',
  'timeGridDay',
];

/**
 * 時間枠ビューの1マスあたりの時間(FullCalendarの`slotDuration`)として選択できる値
 */
export const SLOT_DURATION_OPTIONS = [
  '00:05:00',
  '00:10:00',
  '00:15:00',
  '00:20:00',
  '00:30:00',
  '01:00:00',
  '02:00:00',
] as const;

export const DEFAULT_SLOT_DURATION = '00:30:00';

/**
 * 週の始まりの曜日として「今日の曜日」を表す特別な値
 *
 * 0〜6(日曜日〜土曜日)以外の値として扱い、表示時に今日の曜日へ解決する
 */
export const FIRST_DAY_TODAY = -1;

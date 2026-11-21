/**
 * FullCalendarに渡す表示オプションを、プラグインの設定値から組み立てる純粋関数群
 *
 * kintoneのグローバル変数に依存しないようにしておき、単体テストできるようにしている
 */
import {
  CALENDAR_VIEW_TYPES,
  type CalendarViewType,
  FIRST_DAY_TODAY,
  VIEW_BUTTON_ORDER,
} from '@/schema/calendar';
import type { EventSortOrder } from '@/schema/plugin-config';
import { DateTime } from 'luxon';

/** 現在時刻付近へ自動スクロールする際、現在時刻より何時間前を表示の先頭にするか */
const SCROLL_HOURS_BEFORE_NOW = 1;

/** FullCalendarの既定の`eventOrder`のうち、先頭の開始日時 */
const START_ORDER = 'start';
/** FullCalendarの既定の`eventOrder`のうち、開始日時以降の並び順 */
const ORDER_AFTER_START = ['-duration', 'allDay', 'title'];
/** FullCalendarの既定の`eventOrder` */
const DEFAULT_EVENT_ORDER = [START_ORDER, ...ORDER_AFTER_START];

/** 表示時間帯の設定が不正な場合に使用する既定値(0時〜24時) */
const DEFAULT_SLOT_MIN_TIME = '0:00:00';
const DEFAULT_SLOT_MAX_TIME = '24:00:00';

const isCalendarViewType = (value: unknown): value is CalendarViewType =>
  typeof value === 'string' && (CALENDAR_VIEW_TYPES as readonly string[]).includes(value);

/**
 * 設定上の「週の始まりの曜日」を、FullCalendarの`firstDay`(0: 日曜日〜6: 土曜日)に解決します
 *
 * `FIRST_DAY_TODAY`の場合は、指定したタイムゾーンにおける今日の曜日を返します
 */
export const resolveFirstDay = (
  firstDay: number,
  zone: string,
  now: DateTime = DateTime.now()
): number => {
  if (firstDay === FIRST_DAY_TODAY) {
    // luxonは月曜日=1〜日曜日=7のため、日曜日=0に揃える
    return now.setZone(zone).weekday % 7;
  }
  if (Number.isInteger(firstDay) && firstDay >= 0 && firstDay <= 6) {
    return firstDay;
  }
  return 0;
};

/** ヘッダーに表示する表示形式の切り替えボタンを、表示形式の既定の並び順で返します */
export const getSelectableViews = (
  visibleViews: readonly CalendarViewType[]
): CalendarViewType[] =>
  visibleViews.length === 0
    ? [...VIEW_BUTTON_ORDER]
    : VIEW_BUTTON_ORDER.filter((view) => visibleViews.includes(view));

/**
 * FullCalendarの`headerToolbar`に指定する表示形式の切り替えボタンの定義を返します
 *
 * 選択できる表示形式が1つしかない場合は、切り替えボタン自体を表示しません
 */
export const buildViewButtons = (visibleViews: readonly CalendarViewType[]): string => {
  const views = getSelectableViews(visibleViews);
  return views.length <= 1 ? '' : views.join(',');
};

/**
 * カレンダーの初期表示形式を決定します
 *
 * 同じタブで前回表示していた表示形式があれば、それが現在も選択できる場合に限り優先します
 */
export const resolveInitialView = (params: {
  stored: string | null;
  initialView: CalendarViewType;
  visibleViews: readonly CalendarViewType[];
}): CalendarViewType => {
  const { stored, initialView, visibleViews } = params;
  const selectableViews = getSelectableViews(visibleViews);
  if (isCalendarViewType(stored) && selectableViews.includes(stored)) {
    return stored;
  }
  // 切り替えボタンに無い表示形式で開くと戻れなくなるため、選択できる表示形式に揃える
  return selectableViews.includes(initialView) ? initialView : (selectableViews[0] ?? initialView);
};

/**
 * 日付のクリックで日表示へ移動できるかどうか
 *
 * 日表示が切り替えボタンに含まれない場合に移動すると、元の表示形式に戻れなくなるため
 */
export const isDayViewSelectable = (visibleViews: readonly CalendarViewType[]): boolean =>
  getSelectableViews(visibleViews).includes('timeGridDay');

const toHour = (time: string) => Number(time.split(':')[0]);

/**
 * 表示時間帯の設定を検証し、終了が開始より後でない場合は0時〜24時にします
 *
 * 終了は24時より後(日をまたぐ時間帯)も指定できます
 */
export const resolveSlotRange = (params: {
  slotMinTime: string;
  slotMaxTime: string;
}): { slotMinTime: string; slotMaxTime: string } => {
  const { slotMinTime, slotMaxTime } = params;
  const min = toHour(slotMinTime);
  const max = toHour(slotMaxTime);
  if (
    !slotMinTime ||
    !slotMaxTime ||
    !Number.isFinite(min) ||
    !Number.isFinite(max) ||
    max <= min
  ) {
    return { slotMinTime: DEFAULT_SLOT_MIN_TIME, slotMaxTime: DEFAULT_SLOT_MAX_TIME };
  }
  return { slotMinTime, slotMaxTime };
};

/**
 * 時間枠ビューの初期スクロール位置(`scrollTime`)として、現在時刻の少し前の時刻を返します
 *
 * 日付をまたいで前日に戻ることはないよう、0時より前にはしません
 */
export const getScrollTimeAroundNow = (zone: string, now: DateTime = DateTime.now()): string => {
  const hour = Math.max(now.setZone(zone).hour - SCROLL_HOURS_BEFORE_NOW, 0);
  return `${String(hour).padStart(2, '0')}:00:00`;
};

type SortValue = string | number | null | undefined;

/**
 * 並び順のフィールドの値(`PluginCalendarEvent.sortValue`)を比較します
 *
 * FullCalendar標準の比較では`0`と空の値が同順位になり、降順では空の値が先頭に来てしまうため、
 * 空の値は並び順に関わらず常に末尾に並べる
 */
export const compareSortValues = (
  a: { sortValue?: SortValue },
  b: { sortValue?: SortValue },
  order: EventSortOrder
): number => {
  const left = a.sortValue ?? null;
  const right = b.sortValue ?? null;
  if (left === null || right === null) {
    if (left === right) return 0;
    return left === null ? 1 : -1;
  }
  const result =
    typeof left === 'number' && typeof right === 'number'
      ? left - right
      : String(left).localeCompare(String(right));
  return order === 'desc' ? -result : result;
};

type EventOrderSpec =
  | string
  | ((a: { sortValue?: SortValue }, b: { sortValue?: SortValue }) => number);

/**
 * FullCalendarの`eventOrder`を組み立てます
 *
 * 並び順のフィールドが指定されている場合、同じ時刻に始まる予定はそのフィールドの値で並べます
 * (FullCalendarは比較関数に`extendedProps`を展開したオブジェクトを渡すため、`sortValue`を参照できる)
 */
export const buildEventOrder = (params: {
  sortField: string;
  sortOrder: EventSortOrder;
}): EventOrderSpec[] => {
  const { sortField, sortOrder } = params;
  if (!sortField) {
    return [...DEFAULT_EVENT_ORDER];
  }
  return [START_ORDER, (a, b) => compareSortValues(a, b, sortOrder), ...ORDER_AFTER_START];
};

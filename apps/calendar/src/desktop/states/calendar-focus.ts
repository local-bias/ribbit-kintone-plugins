import {
  buildVisibleRange,
  type CalendarVisibleRange,
  isIsoDate,
  resolveFocusedDate,
  toCalendarIsoDate,
} from '@/desktop/calendar-focus';
import { getLoginUserTimezone } from '@/desktop/date-conversion';
import { VIEW_ROOT_ID } from '@/lib/static';
import type { DatesSetArg } from '@fullcalendar/core';
import { atom } from 'jotai';
import { fullcalendarApiAtom } from './calendar';

/**
 * サイドバーのミニカレンダーとメインのカレンダーの連動状態。
 *
 * 一般的なカレンダーアプリ(Googleカレンダー・Outlook等)と同様に、
 * - ミニカレンダーには、メインのカレンダーが表示している期間を帯で示す
 * - メインのカレンダーで前後の期間・今日へ移動すると、ミニカレンダーも追従する
 * - ミニカレンダーで選んだ日付は、メインのカレンダー上でも強調表示する
 * ことで、月表示のように表示期間が変わらない操作でも、何が起きたかを分かるようにする。
 */

/** メインのカレンダーが表示している期間 */
export const calendarVisibleRangeAtom = atom<CalendarVisibleRange | null>(null);

/**
 * 選択中の日付(`yyyy-MM-dd`)。前後の期間へ移動すると、期間内での位置を保ったまま移動する
 * (`resolveFocusedDate`を参照)。
 */
export const focusedDateAtom = atom<string | null>(null);

/**
 * メインのカレンダーの表示期間・日付が変わるたびに増えるカウンター。ミニカレンダーの
 * 表示月を、選択中の日付の月へ戻すきっかけとして使う(選択中の日付が変わらない操作、
 * 例えばミニカレンダーで別の月を見ている間にメインで「今日」を押した場合にも戻すため)。
 */
export const calendarFocusRevisionAtom = atom(0);

/** ミニカレンダーで選んだ直後の日付。メインのカレンダーの描画後(`datesSet`)に強調アニメーションを再生する */
const pendingFlashDateAtom = atom<string | null>(null);

/** 選択直後に一度だけ再生する、日付セルの強調アニメーションの色(ミニカレンダーの選択色に揃える) */
const FLASH_COLOR = 'rgba(25, 118, 210, 0.28)';
const FLASH_COLOR_TRANSPARENT = 'rgba(25, 118, 210, 0)';
/** 時間軸のある表示で、選択中の列の見出しに引く下線(desktop.cssの指定と揃える) */
const HEADER_UNDERLINE = 'inset 0 -3px 0 0 #1976d2';
const FLASH_DURATION_MS = 900;
/** 日付セルが見つからない場合に、FullCalendarの描画を待つ最大フレーム数 */
const MAX_FLASH_WAIT_FRAMES = 10;

const prefersReducedMotion = (): boolean =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const findDateCells = (date: string): HTMLElement[] => {
  const root = document.getElementById(VIEW_ROOT_ID);
  if (!root) return [];
  return Array.from(root.querySelectorAll<HTMLElement>(`.fc [data-date="${date}"]`));
};

/**
 * 背景色ではなく内側の影(`inset` box-shadow)で塗る。土日のセルには背景色が`!important`で
 * 指定されており、`!important`はアニメーションより優先されるため、背景色のアニメーションは
 * 土日のセルで再生されない。列の見出しは常設の下線も影で描いているため、下線を保ったまま重ねる。
 */
const buildFlashKeyframes = (cell: HTMLElement): Keyframe[] => {
  const base = cell.matches('.fc-col-header-cell') ? `${HEADER_UNDERLINE}, ` : '';
  return [
    { boxShadow: `${base}inset 0 0 0 100vmax ${FLASH_COLOR}` },
    { boxShadow: `${base}inset 0 0 0 100vmax ${FLASH_COLOR_TRANSPARENT}` },
  ];
};

/**
 * メインのカレンダー上の指定日のセルを一瞬強調する。月表示で同じ月の日付を選んだときのように、
 * 表示期間が変わらず画面がまったく動かない場合でも、選択が反映されたことを伝えるため。
 *
 * `datesSet`(描画後)から呼び出すが、念のためセルが見つからない場合は数フレーム待つ。
 * OSで動きを減らす設定(`prefers-reduced-motion`)にしているユーザーにはアニメーションを
 * 再生しない(選択中の日付の強調表示自体は残る)。
 */
const flashCalendarDate = (date: string): void => {
  if (prefersReducedMotion()) return;

  const tryFlash = (frame: number) => {
    const cells = findDateCells(date);
    if (cells.length === 0) {
      if (frame < MAX_FLASH_WAIT_FRAMES) {
        requestAnimationFrame(() => tryFlash(frame + 1));
      }
      return;
    }
    for (const cell of cells) {
      cell.animate?.(buildFlashKeyframes(cell), {
        duration: FLASH_DURATION_MS,
        easing: 'ease-out',
      });
    }
  };
  tryFlash(0);
};

/**
 * メインのカレンダーの表示期間・日付が変わったとき(`datesSet`)に、連動状態を同期する。
 *
 * FullCalendarは`gotoDate`・前後の期間への移動・表示の切り替えのたびに`datesSet`を発火する。
 */
export const syncCalendarFocusAtom = atom(null, (get, set, { view }: DatesSetArg) => {
  const zone = getLoginUserTimezone();
  const nextRange = buildVisibleRange({
    currentStart: view.currentStart,
    currentEnd: view.currentEnd,
    zone,
  });
  if (!nextRange) return;

  const calendarDate = toCalendarIsoDate(view.calendar.getDate(), zone);
  const focusedDate = resolveFocusedDate({
    previousRange: get(calendarVisibleRangeAtom),
    previousFocusedDate: get(focusedDateAtom),
    nextRange,
    calendarDate,
  });

  set(calendarVisibleRangeAtom, nextRange);
  set(focusedDateAtom, focusedDate);
  set(calendarFocusRevisionAtom, (revision) => revision + 1);

  // FullCalendarの「現在の日付」も選択中の日付に揃え、表示を切り替えたときに選択中の日付を
  // 含む期間が表示されるようにする。同じ期間内の移動なので表示期間は変わらず、次の`datesSet`
  // では日付が一致するため、これ以上は繰り返さない。描画中の再入を避けるため、処理後に行う
  if (focusedDate !== calendarDate) {
    queueMicrotask(() => view.calendar.gotoDate(focusedDate));
  }

  if (get(pendingFlashDateAtom) === focusedDate) {
    set(pendingFlashDateAtom, null);
    flashCalendarDate(focusedDate);
  }
});

/** ミニカレンダーで選んだ日付へ、メインのカレンダーを移動する */
export const focusCalendarDateAtom = atom(null, (get, set, date: string) => {
  if (!isIsoDate(date)) return;

  const api = get(fullcalendarApiAtom);
  if (!api) return;

  set(focusedDateAtom, date);
  set(pendingFlashDateAtom, date);
  // `Date`ではなく`yyyy-MM-dd`の文字列で渡し、FullCalendar側のタイムゾーンで解釈させる。
  // 表示期間が変わらない場合も`datesSet`は発火し、そこで強調アニメーションを再生する
  api.gotoDate(date);
});

import {
  applyRecurrenceMetaToEventInput,
  hasRecurrenceExpansion,
  type RecurrenceMeta,
} from '@/desktop/recurrence';
import type { Assignee } from '@/desktop/assignee';
import {
  type CalendarFilters,
  hasActiveFilters,
  isShownUnderFilters,
} from '@/desktop/event-filters';
import { isDev } from '@/lib/global';
import type { DateSelectArg, EventInput } from '@fullcalendar/core';
import { getYuruChara } from '@konomi-app/kintone-utilities';
import { produce } from 'immer';
import { atom } from 'jotai';
import {
  completeCalendarEvent,
  forceAllDayCalendarEvent,
  getDefaultAllDayRange,
  getDefaultEndDate,
  getDefaultStartDate,
} from '../actions';
import { isDetailedModeAtom, openDetailedCreateDialogAtom } from './detailed-dialog';
import { dialogPropsAtom, dialogShownAtom } from './dialog';
import { loginUserAtom } from './kintone';
import { isTimeSupportedAtom } from './plugin';
import { displayingAssigneesAtom, displayingCategoriesAtom } from './sidebar';
import type { ComponentRef } from 'react';
import type FullCalendar from '@fullcalendar/react';

export type PluginCalendarEvent = EventInput & {
  note?: string;
  category?: string;
  /** カレンダー上に表示するタイトル(表示用タイトルのフィールドが設定されている場合のみ) */
  displayTitle?: string;
  /** 同じ時刻の予定の並び順を決める比較値(`buildEventOrder`を参照) */
  sortValue?: string | number | null;
  /** 背景イベント判定用のチェックボックスで選択されている値(他の選択肢を保持するため) */
  backgroundFieldValues?: string[];
  /**
   * 予定の担当者(サイドバーの絞り込みに使用する)
   *
   * `[]`は担当者なし、`undefined`は担当者のフィールドが未設定、または保存前・保存直後で
   * まだ取得していないことを表す(取得していない予定は絞り込みの対象外として常に表示する)
   */
  assignees?: Assignee[];
  __quickSearch?: string;
  extendedProps?: {
    recurrence?: RecurrenceMeta;
  };
};

export const fullcalendarRefAtom = atom<ComponentRef<typeof FullCalendar> | null>(null);
export const fullcalendarApiAtom = atom((get) => get(fullcalendarRefAtom)?.getApi());

export const calendarEventsAtom = atom<PluginCalendarEvent[]>([]);

export const searchInputAtom = atom<string>('');
export const handleSearchInputChangeAtom = atom(
  null,
  (_, set, event: React.ChangeEvent<HTMLInputElement>) => {
    set(searchInputAtom, event.target.value);
  }
);

/** 正規化済みの検索語 */
const searchWordsAtom = atom<string[]>((get) =>
  get(searchInputAtom)
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 0)
    .map((word) => getYuruChara(word))
);

/** サイドバーで指定されている絞り込みの条件(カテゴリー・担当者・キーワード検索) */
export const calendarFiltersAtom = atom<CalendarFilters>((get) => ({
  categories: get(displayingCategoriesAtom),
  assignees: get(displayingAssigneesAtom),
  searchWords: get(searchWordsAtom),
}));

/**
 * 編集中の新しい予定(保存前の下書き)のID
 *
 * ダイアログの入力内容(`dialogPropsAtom`)を直接参照すると、打鍵のたびにカレンダー全体の予定が
 * 再計算されるため、IDだけを取り出して値が変わったときのみ下流を再計算させる
 */
const draftEventIdAtom = atom((get) => {
  const { new: isNew, event } = get(dialogPropsAtom);
  return isNew ? event.id : undefined;
});

/** サイドバーの絞り込みの条件をすべて満たす予定(カテゴリー・担当者・キーワード検索はAND条件) */
export const filteredCalendarEventsAtom = atom<PluginCalendarEvent[]>((get) => {
  const allEvents = get(calendarEventsAtom);
  const filters = get(calendarFiltersAtom);
  if (!hasActiveFilters(filters)) {
    return allEvents;
  }

  // 編集中の新しい予定(保存前の下書き)は、絞り込みに関係なく表示する(操作中に消えないように)
  const draftId = get(draftEventIdAtom);

  return allEvents.filter(
    (event) => (draftId && event.id === draftId) || isShownUnderFilters(event, filters)
  );
});

/**
 * FullCalendarに直接渡すためのイベント一覧。
 *
 * `calendarEventsAtom`(および通常のダイアログ編集ロジック)はマスターレコードでも常に
 * `start`/`end`(=シリーズ第1回の日時)を保持する「ドメイン表現」だが、FullCalendarの
 * rruleプラグインは`start`/`end`ではなく`rrule`/`duration`からオカレンスを算出するため、
 * 描画直前のこの一段でのみマスターを変換する。
 */
export const renderableCalendarEventsAtom = atom<PluginCalendarEvent[]>((get) => {
  const events = get(filteredCalendarEventsAtom);
  const { timezone } = get(loginUserAtom);

  return events.map((event) => {
    if (event.extendedProps?.recurrence?.kind !== 'master' || !event.start || !event.end) {
      return event;
    }
    const recurrenceFields = applyRecurrenceMetaToEventInput({
      meta: event.extendedProps.recurrence,
      start: event.start,
      end: event.end,
      zone: timezone,
    });
    // 繰り返しパターンが壊れている等でrrule展開が組み立てられなかった場合は、start/endを
    // 消してしまうとイベントごと消えてしまうため、そのまま単発イベントとして描画する。
    if (!hasRecurrenceExpansion(recurrenceFields)) {
      return event;
    }
    return { ...event, start: undefined, end: undefined, ...recurrenceFields };
  });
});

export const handleCalendarDateSelectAtom = atom(null, async (get, set, props: DateSelectArg) => {
  isDev && console.info('📅 日付が選択されました', props);

  const temporaryKey = Math.random().toString();

  const selected = completeCalendarEvent({
    id: temporaryKey,
    allDay: props.allDay,
    start: props.startStr,
    end: props.endStr,
    __quickSearch: '',
  });
  // 日付型フィールドでは保存時に全日が強制されるため、時間枠ビューでの選択も下書きの時点で
  // 全日に揃える(表示・入力・保存で全日の扱いがずれないように)
  const completed = get(isTimeSupportedAtom) ? selected : forceAllDayCalendarEvent(selected);

  // 詳細編集モードでは独自ダイアログの代わりにkintone標準画面のiframeダイアログを開くため、
  // 下書きイベントをcalendarEventsAtomにpushしない(キャンセル時の後始末が不要になるように)
  if (get(isDetailedModeAtom)) {
    await set(openDetailedCreateDialogAtom, { event: completed });
    return;
  }

  set(calendarEventsAtom, (current) => produce(current, (draft) => [...draft, completed]));
  set(dialogPropsAtom, {
    new: true,
    event: completed,
  });
  set(dialogShownAtom, true);
});

export const handleCalendarEventAddAtom = atom(null, (get, set, props: EventInput) => {
  console.info('📅 イベントが追加されました', props);
});

export const handleTemporaryEventAddAtom = atom(null, async (get, set) => {
  const temporaryKey = Math.random().toString();
  // フィールド設定がDATE型なら常に全日イベントになる(actions.tsの強制ルールと同じ)
  const isTimeSupported = get(isTimeSupportedAtom);
  const allDay = !isTimeSupported;
  // 全日イベントには時刻付きの既定値ではなく「当日〜翌日(排他的終了)」を渡す。時刻付きのまま
  // 渡すと、終了日の表示・保存時の変換(排他的→包含的)がずれる原因になる
  const { start, end } = allDay
    ? getDefaultAllDayRange()
    : { start: getDefaultStartDate(), end: getDefaultEndDate() };

  const completed = completeCalendarEvent({
    id: temporaryKey,
    allDay,
    title: '',
    start,
    end,
    __quickSearch: '',
  });

  if (get(isDetailedModeAtom)) {
    await set(openDetailedCreateDialogAtom, { event: completed });
    return;
  }

  set(calendarEventsAtom, (current) => produce(current, (draft) => [...draft, completed]));
  set(dialogPropsAtom, { new: true, event: completed });
  set(dialogShownAtom, true);
});

import { atom } from 'jotai';
import type { EventOccurrenceTarget } from './event-operations';

export type EventContextMenuState = EventOccurrenceTarget & {
  /** メニューを表示する位置(ビューポート座標) */
  x: number;
  y: number;
};

export const eventContextMenuAtom = atom<EventContextMenuState | null>(null);

export const closeEventContextMenuAtom = atom(null, (_, set) => {
  set(eventContextMenuAtom, null);
});

/** カレンダーの予定の要素に、右クリックメニューで操作対象を特定するための情報を付与する属性 */
export const EVENT_DATA_ATTRIBUTES = {
  id: 'data-ribbit-event-id',
  start: 'data-ribbit-occurrence-start',
  end: 'data-ribbit-occurrence-end',
} as const;

const EVENT_SELECTOR = `[${EVENT_DATA_ATTRIBUTES.id}]`;

/**
 * 右クリックされた位置にある予定の要素を探します
 *
 * 背景イベントは日付セルなどの下層に描画されるため、イベントの発生元の要素だけでなく、
 * 同じ座標に重なっているすべての要素から探す
 */
export const findEventElementAt = (event: MouseEvent): Element | null => {
  const target = event.target instanceof Element ? event.target.closest(EVENT_SELECTOR) : null;
  if (target) {
    return target;
  }
  return (
    document
      .elementsFromPoint(event.clientX, event.clientY)
      .find((element) => element.matches(EVENT_SELECTOR)) ?? null
  );
};

export const readEventTarget = (element: Element): EventOccurrenceTarget | null => {
  const eventId = element.getAttribute(EVENT_DATA_ATTRIBUTES.id);
  if (!eventId) {
    return null;
  }
  return {
    eventId,
    occurrenceStart: element.getAttribute(EVENT_DATA_ATTRIBUTES.start) ?? '',
    occurrenceEnd: element.getAttribute(EVENT_DATA_ATTRIBUTES.end) ?? '',
  };
};

export const openEventContextMenuAtom = atom(null, (_, set, event: MouseEvent) => {
  const element = findEventElementAt(event);
  const target = element ? readEventTarget(element) : null;
  if (!target) {
    // 予定以外の場所では、ブラウザ標準のメニューをそのまま表示する
    return;
  }
  event.preventDefault();
  set(eventContextMenuAtom, { ...target, x: event.clientX, y: event.clientY });
});

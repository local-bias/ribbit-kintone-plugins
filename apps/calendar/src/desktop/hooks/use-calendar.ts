import { extractErrorMessage } from '@/lib/error';
import { isDev } from '@/lib/global';
import { t } from '@/lib/i18n-plugin';
import { EventChangeArg, EventClickArg, EventRemoveArg } from '@fullcalendar/core';
import { atom, useSetAtom } from 'jotai';
import { enqueueSnackbar } from 'notistack';
import { reschedule } from '../actions';
import { calendarEventsAtom } from '../states/calendar';
import { detailedDialogAtom, isDetailedModeAtom } from '../states/detailed-dialog';
import { dialogPropsAtom, dialogShownAtom } from '../states/dialog';
import { appPropertiesAtom, loadingAtom, pluginConditionAtom } from '../states/kintone';
import { openOccurrenceScopeDialogAtom } from '../states/recurrence';

const handleCalendarEventDeleteAtom = atom(null, (get, set, props: EventRemoveArg) => {
  console.info('📅 イベントが削除されました', props);
});

const handleCalendarEventClickAtom = atom(null, (get, set, props: EventClickArg) => {
  const calendarEvents = get(calendarEventsAtom);
  const foundEvent = calendarEvents.find(
    (event) => event.id && props.event.id && event.id === props.event.id
  );
  if (!foundEvent) {
    enqueueSnackbar(t('desktop.error.eventClickFailed'), { variant: 'error' });
    return;
  }

  // 繰り返し予定のマスターの場合、クリックされたのは仮想オカレンスなので通常の編集ダイアログの
  // 代わりに「この回のみ/シリーズ全体」選択ダイアログを開く。クリックされた実際のオカレンス日時は
  // props.event.startStr/endStrから取得する(foundEvent.start/endはマスター=第1回の日時のため)。
  if (foundEvent.extendedProps?.recurrence?.kind === 'master') {
    set(openOccurrenceScopeDialogAtom, {
      master: foundEvent,
      occurrenceStart: props.event.startStr,
      occurrenceEnd: props.event.endStr,
    });
    return;
  }

  if (get(isDetailedModeAtom) && foundEvent.id) {
    set(detailedDialogAtom, { mode: 'edit', recordId: foundEvent.id });
    return;
  }

  set(dialogPropsAtom, {
    new: false,
    event: foundEvent,
  });
  set(dialogShownAtom, true);
});

const handleCalendarEventChangeAtom = atom(null, async (get, set, props: EventChangeArg) => {
  set(loadingAtom, true);

  try {
    const changed = props.event;

    const properties = await get(appPropertiesAtom);
    const events = get(calendarEventsAtom);
    let index = 0;
    const targetEvent = events.find(({ id }, i) => {
      index = i;
      return id === props.event.id;
    });
    if (!targetEvent) {
      console.warn('更新対象レコードに紐づくカレンダーイベントの取得に失敗しました');
      return;
    }

    // 繰り返し予定のマスターはeditable:falseでドラッグ・リサイズ不可のはずだが、念のための
    // 防御ガード(日時変更は編集ダイアログの「シリーズ全体を編集」からのみ行う)。
    if (targetEvent.extendedProps?.recurrence?.kind === 'master') {
      console.warn('繰り返し予定のマスターはドラッグ操作の対象外です。予期しないeventChangeを無視します');
      return;
    }

    console.log({ changed, targetEvent });

    // `changed.start`/`end` are FullCalendar's UTC-coerced marker Dates; use the string
    // getters instead, which are the canonical calendar-space values this plugin persists.
    const newEvent = {
      ...targetEvent,
      start: changed.startStr || targetEvent.start,
      end: changed.endStr || targetEvent.end,
    };
    set(calendarEventsAtom, (current) => {
      const newEvents = [...current];
      newEvents[index] = newEvent;
      return newEvents;
    });

    const condition = get(pluginConditionAtom);
    await reschedule({
      calendarEvent: newEvent,
      condition: condition!,
      properties,
    });
    isDev && console.info('レコードを更新しました');
  } catch (error) {
    console.error(error);
    enqueueSnackbar(t('desktop.error.recordUpdateFailed', extractErrorMessage(error)), {
      variant: 'error',
    });
  } finally {
    set(loadingAtom, false);
  }
});

export const useCalendar = () => {
  const onCalendarEventRemove = useSetAtom(handleCalendarEventDeleteAtom);
  const onCalendarEventClick = useSetAtom(handleCalendarEventClickAtom);
  const onCalendarEventChange = useSetAtom(handleCalendarEventChangeAtom);

  return { onCalendarEventClick, onCalendarEventChange, onCalendarEventRemove };
};

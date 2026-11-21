import { extractErrorMessage } from '@/lib/error';
import { isDev } from '@/lib/global';
import { t } from '@/lib/i18n-plugin';
import type { EventChangeArg, EventClickArg, EventRemoveArg } from '@fullcalendar/core';
import { atom, useSetAtom } from 'jotai';
import { enqueueSnackbar } from 'notistack';
import { reschedule } from '../actions';
import { getRecordDetailUrl } from '../record-url';
import { calendarEventsAtom } from '../states/calendar';
import { requestConfirmAtom } from '../states/confirm';
import { openEventEditorAtom } from '../states/event-operations';
import { appPropertiesAtom, loadingAtom, pluginConditionAtom } from '../states/kintone';
import { notifyIfHiddenByFiltersAtom } from '../states/filter-notice';
import { refreshComputedValuesAtom } from '../states/refresh';

const handleCalendarEventDeleteAtom = atom(null, (get, set, props: EventRemoveArg) => {
  console.info('📅 イベントが削除されました', props);
});

/**
 * 修飾キー付きのクリックで、レコードの詳細画面を別タブ(Ctrl/⌘)・別ウィンドウ(Shift)に開きます
 *
 * @returns 別タブ・別ウィンドウで開いた場合は`true`
 */
const openInNewContextIfRequested = (jsEvent: MouseEvent, recordId: string | undefined) => {
  if (!recordId || !(jsEvent.ctrlKey || jsEvent.metaKey || jsEvent.shiftKey)) {
    return false;
  }
  jsEvent.preventDefault();
  const features = jsEvent.shiftKey ? 'noopener,popup' : 'noopener';
  window.open(getRecordDetailUrl(recordId), '_blank', features);
  return true;
};

const handleCalendarEventClickAtom = atom(null, (_, set, props: EventClickArg) => {
  if (openInNewContextIfRequested(props.jsEvent, props.event.id)) {
    return;
  }
  // 繰り返し予定の場合、クリックされた実際の回の日時はprops.event.startStr/endStrから取得する
  set(openEventEditorAtom, {
    eventId: props.event.id,
    occurrenceStart: props.event.startStr,
    occurrenceEnd: props.event.endStr,
  });
});

const handleCalendarEventChangeAtom = atom(null, async (get, set, props: EventChangeArg) => {
  set(loadingAtom, true);

  try {
    const changed = props.event;

    const properties = await get(appPropertiesAtom);
    const events = get(calendarEventsAtom);
    const targetEvent = events.find(({ id }) => id === props.event.id);
    if (!targetEvent) {
      console.warn('更新対象レコードに紐づくカレンダーイベントの取得に失敗しました');
      return;
    }

    // 繰り返し予定のマスターはeditable:falseでドラッグ・リサイズ不可のはずだが、念のための
    // 防御ガード(日時変更は編集ダイアログの「シリーズ全体を編集」からのみ行う)。
    if (targetEvent.extendedProps?.recurrence?.kind === 'master') {
      console.warn(
        '繰り返し予定のマスターはドラッグ操作の対象外です。予期しないeventChangeを無視します'
      );
      return;
    }

    const condition = get(pluginConditionAtom);
    if (condition?.confirmsReschedule) {
      // 確認ダイアログの表示中はローディング表示にしない
      set(loadingAtom, false);
      const confirmed = await set(requestConfirmAtom, {
        title: t('desktop.confirm.rescheduleTitle'),
        message: t(
          'desktop.confirm.rescheduleMessage',
          targetEvent.displayTitle || targetEvent.title || t('desktop.calendar.noTitle')
        ),
      });
      if (!confirmed) {
        props.revert();
        return;
      }
      set(loadingAtom, true);
    }

    // `changed.start`/`end` are FullCalendar's UTC-coerced marker Dates; use the string
    // getters instead, which are the canonical calendar-space values this plugin persists.
    const newEvent = {
      ...targetEvent,
      start: changed.startStr || targetEvent.start,
      end: changed.endStr || targetEvent.end,
    };
    // 確認ダイアログの表示中に一覧が更新されている可能性があるため、位置ではなくIDで置き換える
    set(calendarEventsAtom, (current) =>
      current.map((event) => (event.id === newEvent.id ? newEvent : event))
    );

    await reschedule({
      calendarEvent: newEvent,
      condition: condition!,
      properties,
    });
    isDev && console.info('レコードを更新しました');
    if (newEvent.id) {
      await set(refreshComputedValuesAtom, newEvent.id);
      set(notifyIfHiddenByFiltersAtom, newEvent.id);
    }
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

/**
 * 既存の予定に対する操作(編集・複製・削除・カテゴリーの変更)
 *
 * 予定の編集ダイアログと、カレンダー上の右クリックメニューの両方から利用する
 */
import { extractErrorMessage } from '@/lib/error';
import { GUEST_SPACE_ID } from '@/lib/global';
import { t } from '@/lib/i18n-plugin';
import { deleteAllRecords, getAppId } from '@konomi-app/kintone-utilities';
import { produce } from 'immer';
import { atom } from 'jotai';
import { enqueueSnackbar } from 'notistack';
import { addNewRecord, completeCalendarEvent, getEventColors, reschedule } from '../actions';
import { buildCopiedEvent } from '../event-field-values';
import { calendarEventsAtom, type PluginCalendarEvent } from './calendar';
import { requestConfirmAtom } from './confirm';
import { detailedDialogAtom, isDetailedModeAtom } from './detailed-dialog';
import { dialogPropsAtom, dialogShownAtom } from './dialog';
import { appPropertiesAtom, loadingAtom, pluginConditionAtom } from './kintone';
import {
  handleDeleteSeriesAtom,
  occurrenceContextAtom,
  openOccurrenceScopeDialogAtom,
} from './recurrence';
import { refreshComputedValuesAtom } from './refresh';

export type EventOccurrenceTarget = {
  eventId: string;
  /** 操作対象の回の日時(繰り返し予定の場合、マスターの第1回ではなく実際の回の日時) */
  occurrenceStart: string;
  occurrenceEnd: string;
};

const findEvent = (events: PluginCalendarEvent[], eventId: string) =>
  events.find((event) => event.id && event.id === eventId);

const isRecurrenceMaster = (event: PluginCalendarEvent) =>
  event.extendedProps?.recurrence?.kind === 'master';

/** 予定の編集画面(簡易編集ダイアログ、詳細編集ダイアログ、繰り返し予定の範囲選択)を開きます */
export const openEventEditorAtom = atom(null, (get, set, target: EventOccurrenceTarget) => {
  const foundEvent = findEvent(get(calendarEventsAtom), target.eventId);
  if (!foundEvent) {
    enqueueSnackbar(t('desktop.error.eventClickFailed'), { variant: 'error' });
    return;
  }

  // 繰り返し予定のマスターの場合、対象は仮想の回なので、通常の編集ダイアログの代わりに
  // 「この回のみ/シリーズ全体」選択ダイアログを開く
  if (isRecurrenceMaster(foundEvent)) {
    set(openOccurrenceScopeDialogAtom, {
      master: foundEvent,
      occurrenceStart: target.occurrenceStart,
      occurrenceEnd: target.occurrenceEnd,
    });
    return;
  }

  if (get(isDetailedModeAtom) && foundEvent.id) {
    set(detailedDialogAtom, { mode: 'edit', recordId: foundEvent.id });
    return;
  }

  set(dialogPropsAtom, { new: false, event: foundEvent });
  set(dialogShownAtom, true);
});

/** 予定を複製して新しいレコードとして登録します */
export const copyCalendarEventAtom = atom(null, async (get, set, event: PluginCalendarEvent) => {
  if (!event.id) {
    enqueueSnackbar(t('desktop.error.cannotCopyNewEvent'), { variant: 'error' });
    return false;
  }

  set(loadingAtom, true);
  try {
    const condition = get(pluginConditionAtom);
    const properties = await get(appPropertiesAtom);
    const newEvent = await addNewRecord({
      calendarEvent: completeCalendarEvent(
        buildCopiedEvent(event, t('desktop.error.eventCopySuffix'))
      ),
      condition: condition!,
      properties,
    });
    set(calendarEventsAtom, (current) => [...current, newEvent]);
    if (newEvent.id) {
      await set(refreshComputedValuesAtom, newEvent.id);
    }
    enqueueSnackbar(t('desktop.toast.eventCopied'), { variant: 'success' });
    return true;
  } catch (error) {
    console.error(error);
    enqueueSnackbar(t('desktop.error.recordSaveFailed', extractErrorMessage(error)), {
      variant: 'error',
    });
    return false;
  } finally {
    set(loadingAtom, false);
  }
});

/**
 * 確認のうえ、予定(レコード)を削除します
 *
 * 繰り返し予定のマスターの場合は、削除する範囲(この回のみ/シリーズ全体)の選択ダイアログを開きます
 */
export const deleteCalendarEventAtom = atom(
  null,
  async (get, set, target: EventOccurrenceTarget): Promise<boolean> => {
    const event = findEvent(get(calendarEventsAtom), target.eventId);
    if (!event?.id) {
      enqueueSnackbar(t('desktop.error.eventRecordNotFound'), { variant: 'error' });
      return false;
    }
    if (isRecurrenceMaster(event)) {
      set(openOccurrenceScopeDialogAtom, {
        master: event,
        occurrenceStart: target.occurrenceStart,
        occurrenceEnd: target.occurrenceEnd,
      });
      return false;
    }

    const confirmed = await set(requestConfirmAtom, {
      title: t('desktop.confirm.deleteTitle'),
      message: t('desktop.confirm.deleteMessage', event.title || t('desktop.calendar.noTitle')),
      destructive: true,
    });
    if (!confirmed) {
      return false;
    }

    const eventId = event.id;
    set(loadingAtom, true);
    try {
      await deleteAllRecords({
        app: getAppId()!,
        ids: [Number(eventId)],
        guestSpaceId: GUEST_SPACE_ID,
        debug: process.env.NODE_ENV === 'development',
      });
      set(calendarEventsAtom, (current) => current.filter(({ id }) => id !== eventId));
      enqueueSnackbar(t('desktop.toast.recordDeleted'), { variant: 'success' });
      return true;
    } catch (error) {
      console.error(error);
      enqueueSnackbar(t('desktop.error.recordDeleteFailed', extractErrorMessage(error)), {
        variant: 'error',
      });
      return false;
    } finally {
      set(loadingAtom, false);
    }
  }
);

/** 予定のカテゴリー(=予定の色)を変更して保存します */
export const changeEventCategoryAtom = atom(
  null,
  async (get, set, params: { eventId: string; category: string }) => {
    const event = findEvent(get(calendarEventsAtom), params.eventId);
    if (!event?.id || event.category === params.category) {
      return;
    }

    set(loadingAtom, true);
    try {
      const condition = get(pluginConditionAtom)!;
      const properties = await get(appPropertiesAtom);
      const updated: PluginCalendarEvent = {
        ...event,
        category: params.category,
        ...getEventColors({ value: params.category, condition, properties }),
      };
      await reschedule({ calendarEvent: updated, condition, properties });
      set(calendarEventsAtom, (current) =>
        produce(current, (draft) => {
          const index = draft.findIndex(({ id }) => id === updated.id);
          if (index !== -1) draft[index] = updated;
        })
      );
      await set(refreshComputedValuesAtom, event.id);
    } catch (error) {
      console.error(error);
      enqueueSnackbar(t('desktop.error.recordUpdateFailed', extractErrorMessage(error)), {
        variant: 'error',
      });
    } finally {
      set(loadingAtom, false);
    }
  }
);

/** 編集ダイアログで開いている予定を複製します */
export const copyDialogEventAtom = atom(null, async (get, set) => {
  const copied = await set(copyCalendarEventAtom, get(dialogPropsAtom).event);
  if (copied) {
    set(dialogShownAtom, false);
    set(dialogPropsAtom, { new: false, event: {} });
  }
});

/**
 * 編集ダイアログで開いている予定を削除します
 *
 * 繰り返し予定のマスターをダイアログで開いているのは「シリーズ全体を編集」のときだけのため、
 * 範囲の選択は求めず、確認のうえでシリーズ全体を削除する
 */
export const deleteDialogEventAtom = atom(null, async (get, set) => {
  const { event: editingEvent } = get(dialogPropsAtom);
  // 繰り返し設定はダイアログ上で未保存のまま変更されている可能性があるため、判定は保存済みの予定で行う
  const savedEvent = editingEvent.id
    ? findEvent(get(calendarEventsAtom), editingEvent.id)
    : undefined;
  if (!savedEvent?.id) {
    enqueueSnackbar(t('desktop.error.eventRecordNotFound'), { variant: 'error' });
    return;
  }
  const eventId = savedEvent.id;
  const closeDialog = () => {
    set(dialogShownAtom, false);
    set(dialogPropsAtom, { new: false, event: {} });
  };

  if (isRecurrenceMaster(savedEvent)) {
    const confirmed = await set(requestConfirmAtom, {
      title: t('desktop.confirm.deleteTitle'),
      message: t(
        'desktop.confirm.deleteSeriesMessage',
        savedEvent.title || t('desktop.calendar.noTitle')
      ),
      destructive: true,
    });
    if (!confirmed) {
      return;
    }
    set(occurrenceContextAtom, { master: savedEvent, occurrenceStart: '', occurrenceEnd: '' });
    await set(handleDeleteSeriesAtom);
    // 削除に失敗した場合は、編集中の内容が失われないようダイアログを開いたままにする
    if (!findEvent(get(calendarEventsAtom), eventId)) {
      closeDialog();
    }
    return;
  }

  const deleted = await set(deleteCalendarEventAtom, {
    eventId,
    occurrenceStart: '',
    occurrenceEnd: '',
  });
  if (deleted) {
    closeDialog();
  }
});

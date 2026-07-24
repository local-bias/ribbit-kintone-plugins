import { extractErrorMessage } from '@/lib/error';
import { t } from '@/lib/i18n-plugin';
import { produce } from 'immer';
import { atom } from 'jotai';
import { enqueueSnackbar } from 'notistack';
import { SetStateAction } from 'react';
import { addNewRecord, getEventColors, patchMasterException, reschedule } from '../actions';
import { calendarEventsAtom, PluginCalendarEvent } from './calendar';
import { appPropertiesAtom, loadingAtom, pluginConditionAtom } from './kintone';

export const dialogShownAtom = atom<boolean>(false);

export const dialogPropsAtom = atom<{ new: boolean; event: PluginCalendarEvent }>({
  new: false,
  event: {},
});

export const handleDialogCloseAtom = atom(null, async (get, set) => {
  const currentProps = await get(dialogPropsAtom);

  if (currentProps.new) {
    set(calendarEventsAtom, (current) => current.filter(({ id }) => id !== currentProps.event.id));
  }
  set(dialogShownAtom, false);
  set(dialogPropsAtom, { new: false, event: {} });
});

// export const dialogEventAtom = focusAtom(dialogPropsAtom, (o) => o.prop('event'));
export const dialogEventAtom = atom(
  (get) => get(dialogPropsAtom).event,
  (get, set, newValue: SetStateAction<PluginCalendarEvent>) => {
    set(dialogPropsAtom, (current) =>
      produce(current, (draft) => {
        draft.event = typeof newValue === 'function' ? newValue(draft.event) : newValue;
      })
    );
  }
);

// export const dialogEventTitleAtom = focusAtom(dialogEventAtom, (o) => o.prop('title'));
export const dialogEventTitleAtom = atom(
  (get) => get(dialogEventAtom).title,
  (get, set, newValue: SetStateAction<string | undefined>) => {
    set(dialogEventAtom, (current) =>
      produce(current, (draft) => {
        draft.title = typeof newValue === 'function' ? newValue(draft.title) : newValue;
      })
    );
  }
);

// export const dialogEventNoteAtom = focusAtom(dialogEventAtom, (o) => o.prop('note'));
export const dialogEventNoteAtom = atom(
  (get) => get(dialogEventAtom).note,
  (get, set, newValue: SetStateAction<string | undefined>) => {
    set(dialogEventAtom, (current) =>
      produce(current, (draft) => {
        draft.note = typeof newValue === 'function' ? newValue(draft.note) : newValue;
      })
    );
  }
);

export const dialogAllDayAtom = atom(
  (get) => get(dialogEventAtom).allDay,
  (get, set, newValue: SetStateAction<boolean>) => {
    set(dialogEventAtom, (current) =>
      produce(current, (draft) => {
        draft.allDay = typeof newValue === 'function' ? newValue(!!draft.allDay) : newValue;
      })
    );
  }
);

export const handleDialogSubmitAtom = atom(null, async (get, set) => {
  set(loadingAtom, true);
  try {
    const currentProps = await get(dialogPropsAtom);
    const condition = await get(pluginConditionAtom);
    const properties = await get(appPropertiesAtom);

    const calendarEvent = currentProps.event;

    if (currentProps.new) {
      const newEvent = await addNewRecord({
        calendarEvent,
        condition: condition!,
        properties,
      });
      set(dialogPropsAtom, (current) =>
        produce(current, (draft) => {
          draft.event = newEvent;
        })
      );
      set(calendarEventsAtom, (current) =>
        produce(current, (draft) => {
          const index = draft.findIndex((event) => event.id === currentProps.event.id);
          draft[index] = newEvent;
        })
      );

      // 「この回のみ編集」で分離したオカレンスの場合、マスター側の除外リストにも追記して
      // 元の(仮想の)オカレンスがこの新規レコードと重複表示されないようにする。
      if (newEvent.extendedProps?.recurrence?.kind === 'override') {
        const { masterId, originalStart } = newEvent.extendedProps.recurrence;
        const updatedMaster = await patchMasterException({
          calendarEvents: get(calendarEventsAtom),
          masterId,
          occurrenceStart: originalStart,
          condition: condition!,
          properties,
        });
        set(calendarEventsAtom, (current) =>
          produce(current, (draft) => {
            const index = draft.findIndex((event) => event.id === updatedMaster.id);
            if (index !== -1) draft[index] = updatedMaster;
          })
        );
      }
    } else {
      await reschedule({
        calendarEvent,
        condition: condition!,
        properties,
      });
      // getCalendarEventFromKintoneRecord(読み込み時の変換)でしか色は計算されないため、
      // ここで明示的に計算しないとカテゴリー変更が次のリロードまで書式に反映されない。
      const updatedEvent = {
        ...calendarEvent,
        ...getEventColors({ value: calendarEvent.category, condition: condition!, properties }),
      };
      set(calendarEventsAtom, (current) =>
        produce(current, (draft) => {
          const index = draft.findIndex((event) => event.id === currentProps.event.id);
          draft[index] = updatedEvent;
        })
      );
    }

    set(dialogShownAtom, false);
    set(dialogPropsAtom, { new: false, event: {} });
  } catch (error) {
    console.error(error);
    enqueueSnackbar(t('desktop.error.recordSaveFailed', extractErrorMessage(error)), {
      variant: 'error',
    });
  } finally {
    set(loadingAtom, false);
  }
});

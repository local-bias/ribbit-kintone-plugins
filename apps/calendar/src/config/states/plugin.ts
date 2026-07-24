import { restorePluginConfig } from '@/lib/plugin';
import { PluginCondition, PluginConfig } from '@/schema/plugin-config';
import { produce } from 'immer';
import { atom } from 'jotai';
import { atomWithDefault } from 'jotai/utils';
import { SetStateAction } from 'react';

export const pluginConfigAtom = atom<PluginConfig>(restorePluginConfig());

export const loadingCountAtom = atom<number>(0);

/**
 * 読み込み中かどうか
 *
 * この状態は読み取り専用です。読み込み状態を変更する場合は`loadingCountAtom`を使用してください。
 *
 * @see loadingCountAtom
 */
export const loadingAtom = atom<boolean>((get) => get(loadingCountAtom) > 0);

export const tabIndexAtom = atom<number>(0);

// export const conditionsAtom = focusAtom(pluginConfigAtom, (optic) => optic.prop('conditions'));
export const pluginConditionsAtom = atom(
  (get) => {
    const storage = get(pluginConfigAtom);
    return storage?.conditions ?? [];
  },
  (_, set, newValue: SetStateAction<PluginCondition[]>) => {
    set(pluginConfigAtom, (current) => ({
      ...current,
      conditions: typeof newValue === 'function' ? newValue(current.conditions) : newValue,
    }));
  }
);

export const selectedConditionIdAtom = atomWithDefault<string>((get) => {
  const config = get(pluginConfigAtom);
  return config.conditions[0].id;
});

export const selectedConditionAtom = atom(
  (get) => {
    const conditions = get(pluginConditionsAtom);
    const selectedConditionId = get(selectedConditionIdAtom);
    return conditions.find((condition) => condition.id === selectedConditionId) ?? conditions[0]!;
  },
  (get, set, newValue: SetStateAction<PluginCondition>) => {
    const selectedConditionId = get(selectedConditionIdAtom);
    const conditions = get(pluginConditionsAtom);
    const index = conditions.findIndex((condition) => condition.id === selectedConditionId);
    if (index === -1) {
      return;
    }
    set(pluginConfigAtom, (current) =>
      produce(current, (draft) => {
        draft.conditions[index] =
          typeof newValue === 'function' ? newValue(draft.conditions[index]) : newValue;
      })
    );
  }
);

export const getConditionPropertyAtom = <T extends keyof PluginCondition>(property: T) =>
  atom(
    (get) => {
      return get(selectedConditionAtom)[property];
    },
    (_, set, newValue: SetStateAction<PluginCondition[T]>) => {
      set(selectedConditionAtom, (condition) =>
        produce(condition, (draft) => {
          draft[property] = typeof newValue === 'function' ? newValue(draft[property]) : newValue;
        })
      );
    }
  );

export const getCalendarEventAtom = <T extends keyof PluginCondition['calendarEvent']>(
  property: T
) =>
  atom(
    (get) => {
      return get(selectedConditionAtom).calendarEvent[property];
    },
    (_, set, newValue: SetStateAction<PluginCondition['calendarEvent'][T]>) => {
      set(selectedConditionAtom, (condition) =>
        produce(condition, (draft) => {
          draft.calendarEvent[property] =
            typeof newValue === 'function' ? newValue(draft.calendarEvent[property]) : newValue;
        })
      );
    }
  );

export const viewIdState = getConditionPropertyAtom('viewId');
export const initialViewState = getConditionPropertyAtom('initialView');
export const enablesAllDayState = getConditionPropertyAtom('enablesAllDay');
export const alldayOptionState = getConditionPropertyAtom('allDayOption');
export const enablesNoteState = getConditionPropertyAtom('enablesNote');
export const slotMinTimeState = getConditionPropertyAtom('slotMinTime');
export const slotMaxTimeState = getConditionPropertyAtom('slotMaxTime');
export const colorsAtom = getConditionPropertyAtom('colors');
export const daysOfWeekAtom = getConditionPropertyAtom('daysOfWeek');
export const firstDayAtom = getConditionPropertyAtom('firstDay');
export const enablesRecurrenceState = getConditionPropertyAtom('enablesRecurrence');
export const editModeState = getConditionPropertyAtom('editMode');

export const calendarTitleState = getCalendarEventAtom('inputTitleField');
export const calendarStartState = getCalendarEventAtom('startField');
export const calendarEndState = getCalendarEventAtom('endField');
export const calendarAllDayState = getCalendarEventAtom('allDayField');
export const calendarNoteState = getCalendarEventAtom('noteField');
export const calendarCategoryState = getCalendarEventAtom('categoryField');
export const calendarRecurrenceState = getCalendarEventAtom('recurrenceField');

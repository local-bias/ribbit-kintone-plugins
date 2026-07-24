import { CalendarViewType } from '@/schema/calendar';
import { kintoneAPI } from '@konomi-app/kintone-utilities';
import { eagerAtom } from 'jotai-eager';
import { atomWithDefault } from 'jotai/utils';
import { endFieldPropertyAtom, pluginConditionAtom, startFieldPropertyAtom } from './kintone';

function isDateTimeField(
  field: kintoneAPI.FieldProperty | null
): field is kintoneAPI.property.DateTime {
  return field?.type === 'DATETIME';
}

/** 開始時刻に指定されたフィールドが日時フィールドであれば`true`を返します */
export const hasStartTimeAtom = eagerAtom((get) => isDateTimeField(get(startFieldPropertyAtom)));
/** 終了時刻に指定されたフィールドが日時フィールドであれば`true`を返します */
export const hasEndTimeAtom = eagerAtom((get) => isDateTimeField(get(endFieldPropertyAtom)));

export const isTimeSupportedAtom = eagerAtom((get) => get(hasStartTimeAtom) && get(hasEndTimeAtom));

export const calendarGridTypeAtom = atomWithDefault<CalendarViewType>((get) => {
  return get(pluginConditionAtom)?.initialView ?? 'timeGridWeek';
});

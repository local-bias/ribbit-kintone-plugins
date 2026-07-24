import { GUEST_SPACE_ID } from '@/lib/global';
import { PluginCondition } from '@/schema/plugin-config';
import { getAllRecordsWithId, getAppId, getQueryCondition } from '@konomi-app/kintone-utilities';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { getCalendarEventFromKintoneRecord } from '../actions';
import { calendarEventsAtom } from '../states/calendar';
import { appPropertiesAtom, loadingAtom, pluginConditionAtom } from '../states/kintone';

const handleRecordsInitializeAtom = atom(null, async (get, set, condition: PluginCondition) => {
  try {
    set(loadingAtom, true);
    const app = getAppId()!;
    const query = getQueryCondition() || '';
    const fields = [
      '$id',
      condition.calendarEvent.inputTitleField,
      condition.calendarEvent.startField,
      condition.calendarEvent.allDayField,
      condition.calendarEvent.noteField,
      condition.calendarEvent.endField,
      condition.calendarEvent.recurrenceField,
    ].filter((field) => field);

    if (condition.calendarEvent.categoryField) {
      fields.push(condition.calendarEvent.categoryField);
    }

    const properties = await get(appPropertiesAtom);

    const onStep: Parameters<typeof getAllRecordsWithId>[0]['onStep'] = async ({ records }) => {
      const calendarEvents = await Promise.all(
        records.map((record) =>
          getCalendarEventFromKintoneRecord({ condition, properties, record })
        )
      );
      set(calendarEventsAtom, calendarEvents);
    };

    await getAllRecordsWithId({
      app,
      condition: query,
      fields,
      onStep,
      guestSpaceId: GUEST_SPACE_ID,
      debug: process.env.NODE_ENV === 'development',
    });
  } catch (error) {
    console.error('レコードの取得に失敗しました', error);
  } finally {
    set(loadingAtom, false);
  }
});

export const useInitialize = () => {
  const condition = useAtomValue(pluginConditionAtom);
  const initialize = useSetAtom(handleRecordsInitializeAtom);

  useEffect(() => {
    if (condition) {
      initialize(condition);
    }
  }, [condition]);

  return null;
};

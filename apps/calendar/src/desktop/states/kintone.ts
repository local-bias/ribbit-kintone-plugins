import { GUEST_SPACE_ID } from '@/lib/global';
import { PREDEFINED_FIELDS } from '@/lib/kintone-rest-api';
import { getSortedOptions } from '@/lib/utils';
import { PluginCondition } from '@/schema/plugin-config';
import { getAppId, getFormFields, kintoneAPI } from '@konomi-app/kintone-utilities';
import { atom } from 'jotai';
import { eagerAtom } from 'jotai-eager';

export const pluginConditionAtom = atom<PluginCondition | null>(null);

export const loadingAtom = atom<boolean>(false);

export const kintoneRecordsAtom = atom<kintoneAPI.RecordData[]>([]);

export const memoFieldPropertyAtom = eagerAtom((get) => {
  const formFields = get(appPropertiesAtom);
  const pluginCondition = get(pluginConditionAtom);

  if (!pluginCondition?.calendarEvent.noteField) {
    return null;
  }
  return formFields[pluginCondition.calendarEvent.noteField];
});

export const richTextModeAtom = eagerAtom((get) => {
  const memoFieldProperty = get(memoFieldPropertyAtom);
  if (!memoFieldProperty) {
    return false;
  }
  return memoFieldProperty.type === 'RICH_TEXT';
});

export const appPropertiesAtom = atom<Promise<kintoneAPI.FieldProperties>>(async () => {
  const { properties } = await getFormFields({
    app: getAppId()!,
    guestSpaceId: GUEST_SPACE_ID,
    debug: process.env.NODE_ENV === 'development',
  });

  const filtered = Object.entries(properties).reduce<kintoneAPI.FieldProperties>(
    (acc, [key, property]) => {
      if (PREDEFINED_FIELDS.includes(property.type)) {
        return acc;
      }
      return { ...acc, [key]: property };
    },
    {}
  );
  return filtered;
});

export const startFieldPropertyAtom = eagerAtom((get) => {
  const formFields = get(appPropertiesAtom);
  const pluginCondition = get(pluginConditionAtom);

  if (!pluginCondition?.calendarEvent.startField) {
    return null;
  }
  return formFields[pluginCondition.calendarEvent.startField];
});

export const endFieldPropertyAtom = eagerAtom((get) => {
  const pluginCondition = get(pluginConditionAtom);
  if (!pluginCondition?.calendarEvent.endField) {
    return null;
  }
  const formFields = get(appPropertiesAtom);
  return formFields[pluginCondition.calendarEvent.endField] ?? null;
});

export const categoryFieldPropertyAtom = eagerAtom((get) => {
  const pluginCondition = get(pluginConditionAtom);
  if (!pluginCondition?.calendarEvent.categoryField) {
    return null;
  }
  const formFields = get(appPropertiesAtom);
  return formFields[pluginCondition.calendarEvent.categoryField] ?? null;
});

export const calendarEventCategoryAtom = eagerAtom((get) => {
  const categoryProperty = get(categoryFieldPropertyAtom);

  if (
    !categoryProperty ||
    (categoryProperty.type !== 'CHECK_BOX' &&
      categoryProperty.type !== 'RADIO_BUTTON' &&
      categoryProperty.type !== 'DROP_DOWN')
  ) {
    return null;
  }
  return getSortedOptions(categoryProperty.options ?? {}).map((option) => option.label);
});

export const loginUserAtom = atom<ReturnType<typeof kintone.getLoginUser>>(() => {
  return kintone.getLoginUser();
});

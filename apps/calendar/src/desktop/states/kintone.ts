import { GUEST_SPACE_ID } from '@/lib/global';
import { isBackgroundEventAvailable } from '@/desktop/event-field-values';
import { PREDEFINED_FIELDS } from '@/lib/kintone-rest-api';
import { getSortedOptions } from '@/lib/utils';
import type { PluginCondition } from '@/schema/plugin-config';
import { getAppId, getFormFields, type kintoneAPI } from '@konomi-app/kintone-utilities';
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

/** アプリのすべてのフィールド(作成者・更新者などkintoneが初期状態で持つフィールドを含む) */
const allAppPropertiesAtom = atom<Promise<kintoneAPI.FieldProperties>>(async () => {
  const { properties } = await getFormFields({
    app: getAppId()!,
    guestSpaceId: GUEST_SPACE_ID,
    debug: process.env.NODE_ENV === 'development',
  });
  return properties;
});

export const appPropertiesAtom = atom<Promise<kintoneAPI.FieldProperties>>(async (get) => {
  const properties = await get(allAppPropertiesAtom);

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

/** 背景イベントの設定が、現在のアプリのフィールド構成で使えるかどうか */
export const isBackgroundEventAvailableAtom = eagerAtom((get) => {
  const condition = get(pluginConditionAtom);
  if (!condition) {
    return false;
  }
  const properties = get(appPropertiesAtom);
  return isBackgroundEventAvailable({
    enablesBackgroundEvent: condition.enablesBackgroundEvent,
    backgroundEventOption: condition.backgroundEventOption,
    property: properties[condition.calendarEvent.backgroundEventField],
  });
});

/** 担当者として設定されたフィールド(作成者・更新者・作業者も指定できるため、すべてのフィールドから探す) */
export const assigneeFieldPropertyAtom = eagerAtom((get) => {
  const fieldCode = get(pluginConditionAtom)?.calendarEvent.assigneeField;
  if (!fieldCode) {
    return null;
  }
  return get(allAppPropertiesAtom)[fieldCode] ?? null;
});

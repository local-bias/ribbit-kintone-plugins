import { GUEST_SPACE_ID } from '@/lib/global';
import { t } from '@/lib/i18n-plugin';
import { getAppId, getFormFields, kintoneAPI } from '@konomi-app/kintone-utilities';
import { atom } from 'jotai';
import { eagerAtom } from 'jotai-eager';
import { calendarAllDayState, calendarBackgroundEventState } from './plugin';

const currentAppIdAtom = atom<number>(() => {
  const appId = getAppId();
  if (!appId) {
    throw new Error(t('config.error.appIdNotFound'));
  }
  return appId;
});

export const appFieldsAtom = atom<Promise<kintoneAPI.FieldProperty[]>>(async (get) => {
  const app = get(currentAppIdAtom);
  const { properties } = await getFormFields({
    app,
    preview: true,
    guestSpaceId: GUEST_SPACE_ID,
    debug: process.env.NODE_ENV === 'development',
  });

  const values = Object.values(properties);

  return values.sort((a, b) => a.label.localeCompare(b.label, 'ja'));
});

export const dateTimeFieldsAtom = eagerAtom((get) => {
  const fields = get(appFieldsAtom);
  const types: kintoneAPI.FieldPropertyType[] = ['DATETIME', 'DATE'];

  return fields.filter((field) => types.includes(field.type)) as (
    | kintoneAPI.property.DateTime
    | kintoneAPI.property.Date
  )[];
});

type TextFieldProperty =
  | kintoneAPI.property.SingleLineText
  | kintoneAPI.property.MultiLineText
  | kintoneAPI.property.RichText;

export const stringFieldsAtom = eagerAtom((get) => {
  const fields = get(appFieldsAtom);
  const types: kintoneAPI.FieldPropertyType[] = [
    'SINGLE_LINE_TEXT',
    'MULTI_LINE_TEXT',
    'RICH_TEXT',
  ];

  return fields.filter((field) => types.includes(field.type)) as TextFieldProperty[];
});

/**
 * 繰り返し予定の情報(JSON)を保存できるフィールド。
 * RICH_TEXTはHTMLエディタでJSON文字列が壊れる可能性があるため除外する。
 */
export const recurrenceFieldsAtom = eagerAtom((get) => {
  const fields = get(appFieldsAtom);
  const types: kintoneAPI.FieldPropertyType[] = ['SINGLE_LINE_TEXT', 'MULTI_LINE_TEXT'];

  return fields.filter((field) => types.includes(field.type)) as (
    | kintoneAPI.property.SingleLineText
    | kintoneAPI.property.MultiLineText
  )[];
});

/**
 * カレンダーに表示するタイトルとして使用できるフィールド
 *
 * 計算フィールドなど、カレンダーから入力はできないが表示に使いたいフィールドも含める
 */
export const displayTitleFieldsAtom = eagerAtom((get) => {
  const fields = get(appFieldsAtom);
  const types: kintoneAPI.FieldPropertyType[] = [
    'SINGLE_LINE_TEXT',
    'MULTI_LINE_TEXT',
    'RICH_TEXT',
    'CALC',
    'NUMBER',
    'DROP_DOWN',
    'RADIO_BUTTON',
    'LINK',
  ];
  return fields.filter((field) => types.includes(field.type));
});

/** 同じ時刻の予定の並び順を決めるフィールドとして使用できるフィールド */
export const sortableFieldsAtom = eagerAtom((get) => {
  const fields = get(appFieldsAtom);
  const types: kintoneAPI.FieldPropertyType[] = [
    'NUMBER',
    'CALC',
    'SINGLE_LINE_TEXT',
    'DROP_DOWN',
    'RADIO_BUTTON',
    'DATE',
    'DATETIME',
    'TIME',
  ];
  return fields.filter((field) => types.includes(field.type));
});

export const checkboxFieldsAtom = eagerAtom((get) => {
  const fields = get(appFieldsAtom);
  return fields.filter((field) => field.type === 'CHECK_BOX') as kintoneAPI.property.CheckBox[];
});

export const selectableFieldsAtom = eagerAtom((get) => {
  const fields = get(appFieldsAtom);
  const types: kintoneAPI.FieldPropertyType[] = ['CHECK_BOX', 'DROP_DOWN', 'RADIO_BUTTON'];

  return fields.filter((field) => types.includes(field.type)) as (
    | kintoneAPI.property.CheckBox
    | kintoneAPI.property.Dropdown
    | kintoneAPI.property.RadioButton
  )[];
});

export const allAppViewsAtom = atom<Record<string, kintoneAPI.view.Response>>({});

export const customViewsAtom = atom((get) => {
  const allViews = get(allAppViewsAtom);
  const filtered = Object.entries(allViews).filter(([, view]) => view.type === 'CUSTOM');
  return Object.fromEntries(filtered);
});

export const alldayOptionsAtom = eagerAtom((get) => {
  const allDayField = get(calendarAllDayState);
  const checkboxFields = get(checkboxFieldsAtom);

  if (!allDayField) {
    return [];
  }

  const field = checkboxFields.find((field) => field.code === allDayField);
  if (!field) {
    return [];
  }

  return Object.keys(field.options);
});

/** 背景イベント判定用のチェックボックスフィールドの選択肢 */
export const backgroundEventOptionsAtom = eagerAtom((get) => {
  const backgroundEventField = get(calendarBackgroundEventState);
  if (!backgroundEventField) {
    return [];
  }
  const field = get(checkboxFieldsAtom).find((field) => field.code === backgroundEventField);
  return field ? Object.keys(field.options) : [];
});

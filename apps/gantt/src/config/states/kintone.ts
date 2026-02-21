import { GUEST_SPACE_ID } from '@/lib/global';
import { getViews, kintoneAPI } from '@konomi-app/kintone-utilities';
import { appFormFieldsAtom, currentAppIdAtom } from '@repo/jotai';
import { Atom, atom } from 'jotai';

export const currentAppFieldsAtom: Atom<Promise<kintoneAPI.FieldProperty[]>> = atom((get) => {
  const app = get(currentAppIdAtom);
  return get(
    appFormFieldsAtom({
      app,
      guestSpaceId: GUEST_SPACE_ID,
      preview: true,
    })
  );
});

/** 全ビュー取得 */
export const allAppViewsAtom = atom(async (get) => {
  const app = get(currentAppIdAtom);
  const { views } = await getViews({ app, preview: true, guestSpaceId: GUEST_SPACE_ID });
  return views;
});

/** カスタムビュー一覧 */
export const customViewsAtom = atom(async (get) => {
  const allViews = await get(allAppViewsAtom);
  const filtered = Object.entries(allViews).filter(([, view]) => view.type === 'CUSTOM');
  return filtered.reduce<Record<string, kintoneAPI.view.Response>>(
    (acc, [name, view]) => ({ ...acc, [name]: view }),
    {}
  );
});

/** テキスト系フィールド（タスク名用） */
export const titleFieldsAtom: Atom<Promise<kintoneAPI.FieldProperty[]>> = atom(async (get) => {
  const fields = await get(currentAppFieldsAtom);
  return fields.filter(
    (field) => field.type === 'SINGLE_LINE_TEXT' || field.type === 'MULTI_LINE_TEXT'
  );
});

/** 日付系フィールド（開始日・終了日用） */
export const dateFieldsAtom: Atom<Promise<kintoneAPI.FieldProperty[]>> = atom(async (get) => {
  const fields = await get(currentAppFieldsAtom);
  return fields.filter((field) => field.type === 'DATE' || field.type === 'DATETIME');
});

/** ユーザー選択フィールド（担当者用） */
export const userFieldsAtom: Atom<Promise<kintoneAPI.FieldProperty[]>> = atom(async (get) => {
  const fields = await get(currentAppFieldsAtom);
  return fields.filter((field) => field.type === 'USER_SELECT');
});

/** カテゴリフィールド（ドロップダウン・ラジオ・テキスト） */
export const categoryFieldsAtom: Atom<Promise<kintoneAPI.FieldProperty[]>> = atom(async (get) => {
  const fields = await get(currentAppFieldsAtom);
  return fields.filter(
    (field) =>
      field.type === 'DROP_DOWN' ||
      field.type === 'RADIO_BUTTON' ||
      field.type === 'SINGLE_LINE_TEXT'
  );
});

/** 数値フィールド（進捗率用） */
export const numberFieldsAtom: Atom<Promise<kintoneAPI.FieldProperty[]>> = atom(async (get) => {
  const fields = await get(currentAppFieldsAtom);
  return fields.filter((field) => field.type === 'NUMBER');
});

/** 色分けフィールド（ドロップダウン・ラジオ） */
export const colorFieldsAtom: Atom<Promise<kintoneAPI.FieldProperty[]>> = atom(async (get) => {
  const fields = await get(currentAppFieldsAtom);
  return fields.filter((field) => field.type === 'DROP_DOWN' || field.type === 'RADIO_BUTTON');
});

/** カテゴリソート順フィールド（数値） */
export const categorySortFieldsAtom: Atom<Promise<kintoneAPI.FieldProperty[]>> = atom(
  async (get) => {
    const fields = await get(currentAppFieldsAtom);
    return fields.filter((field) => field.type === 'NUMBER');
  }
);

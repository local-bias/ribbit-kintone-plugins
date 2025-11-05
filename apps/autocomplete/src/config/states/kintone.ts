import { GUEST_SPACE_ID, isDev } from '@/lib/global';
import { getAllApps, getFormFields, kintoneAPI } from '@konomi-app/kintone-utilities';
import { currentAppIdAtom } from '@repo/jotai';
import { atom } from 'jotai';
import { eagerAtom } from 'jotai-eager';
import { atomFamily } from 'jotai/utils';
import { getConditionPropertyAtom } from './plugin';

/**
 * ユーザーがアクセス可能な全てのアプリの情報を取得するAtom
 */
export const kintoneAppsAtom = atom(() => {
  return getAllApps({ guestSpaceId: GUEST_SPACE_ID, debug: isDev });
});

/**
 * 指定されたアプリIDに対応するアプリ情報を取得するAtom
 *
 * @param appId アプリID
 * @returns アプリ情報
 */
export const kintoneAppAtom = atomFamily(
  (appId: string | number) =>
    eagerAtom((get) => {
      const apps = get(kintoneAppsAtom);
      return apps.find((app) => app.appId === appId);
    }),
  (a, b) => a == b
);

const TARGET_FIELD_TYPES: kintoneAPI.FieldPropertyType[] = [
  'SINGLE_LINE_TEXT',
  'MULTI_LINE_TEXT',
  'RICH_TEXT',
  'NUMBER',
  'LINK',
];

export const appFieldsAtom = atom<Promise<kintoneAPI.FieldProperty[]>>(async (get) => {
  const app = get(currentAppIdAtom);
  const { properties } = await getFormFields({
    app,
    preview: true,
    guestSpaceId: GUEST_SPACE_ID,
    debug: process.env.NODE_ENV === 'development',
  });

  const values = Object.values(properties);

  return values
    .filter((field) => TARGET_FIELD_TYPES.includes(field.type))
    .sort((a, b) => a.label.localeCompare(b.label, 'ja'));
});

export const srcAppFieldsState = atom<Promise<kintoneAPI.FieldProperty[]>>(async (get) => {
  const appId = get(getConditionPropertyAtom('srcAppId'));
  if (!appId) return [];

  const { properties } = await getFormFields({
    app: appId,
    preview: true,
    guestSpaceId: GUEST_SPACE_ID,
    debug: process.env.NODE_ENV === 'development',
  });

  const values = Object.values(properties);

  return values.sort((a, b) => a.label.localeCompare(b.label, 'ja'));
});

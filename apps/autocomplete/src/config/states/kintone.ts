import { getFormFields, kintoneAPI, getAppId, getAllApps } from '@konomi-app/kintone-utilities';
import { selector } from 'recoil';
import { GUEST_SPACE_ID } from '@/lib/global';
import { getConditionPropertyState } from './plugin';

const PREFIX = 'kintone';

export const allAppsState = selector<kintoneAPI.App[]>({
  key: `${PREFIX}allAppsState`,
  get: async () => {
    const apps = await getAllApps({
      guestSpaceId: GUEST_SPACE_ID,
      debug: process.env.NODE_ENV === 'development',
    });

    return apps;
  },
});

const TARGET_FIELD_TYPES: kintoneAPI.FieldPropertyType[] = [
  'SINGLE_LINE_TEXT',
  'MULTI_LINE_TEXT',
  'RICH_TEXT',
  'NUMBER',
  'LINK',
];

export const appFieldsState = selector<kintoneAPI.FieldProperty[]>({
  key: `${PREFIX}appFieldsState`,
  get: async () => {
    const app = getAppId()!;
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
  },
});

export const srcAppFieldsState = selector<kintoneAPI.FieldProperty[]>({
  key: `${PREFIX}srcAppFieldsState`,
  get: async ({ get }) => {
    const appId = get(getConditionPropertyState('srcAppId'));
    if (!appId) return [];

    const { properties } = await getFormFields({
      app: appId,
      preview: true,
      guestSpaceId: GUEST_SPACE_ID,
      debug: process.env.NODE_ENV === 'development',
    });

    const values = Object.values(properties);

    return values.sort((a, b) => a.label.localeCompare(b.label, 'ja'));
  },
});

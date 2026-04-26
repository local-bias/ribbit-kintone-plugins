import {
  filterFieldProperties,
  getAllApps,
  getAppId,
  getFormFields,
  getViews,
  type kintoneAPI,
  withSpaceIdFallback,
} from '@konomi-app/kintone-utilities';
import { atom } from 'jotai';
import { pickBy } from 'remeda';
import { GUEST_SPACE_ID, isDev } from '@/lib/global';
import { logAppIdAtom, logAppSpaceIdAtom, outputAppIdAtom, outputAppSpaceIdAtom } from './plugin';

export const currentAppIdAtom = atom(() => {
  const app = getAppId();
  if (!app) {
    throw new Error('App ID not found');
  }
  return app;
});

export const allKintoneAppsState = atom(async () => {
  const apps = await getAllApps({
    guestSpaceId: GUEST_SPACE_ID,
    debug: isDev,
  });
  return apps;
});

export const allAppViewsState = atom<Promise<Record<string, kintoneAPI.view.Response>>>(
  async (get) => {
    const app = get(currentAppIdAtom);

    const { views } = await getViews({
      app,
      preview: true,
      guestSpaceId: GUEST_SPACE_ID,
      debug: isDev,
    });
    return views;
  }
);

export const customViewsState = atom(async (get) => {
  const allViews = await get(allAppViewsState);
  return pickBy(allViews, (view) => view.type === 'CUSTOM');
});

export const outputAppPropertiesState = atom<Promise<kintoneAPI.FieldProperty[]>>(async (get) => {
  const appId = get(outputAppIdAtom);
  if (!appId) {
    return [];
  }
  const appSpaceId = get(outputAppSpaceIdAtom);

  try {
    const { properties } = await withSpaceIdFallback({
      spaceId: appSpaceId,
      func: getFormFields,
      funcParams: {
        app: appId,
        preview: true,
        debug: process.env.NODE_ENV === 'development',
      },
    });
    const filtered = filterFieldProperties(
      properties,
      (field) => !['GROUP', 'SUBTABLE'].includes(field.type)
    );

    return Object.values(filtered).sort((a, b) => a.label.localeCompare(b.label, 'ja'));
  } catch (_error) {
    return [];
  }
});

export const outputAppSingleLineTextPropertiesState = atom<Promise<kintoneAPI.FieldProperty[]>>(
  async (get) => {
    const allProperties = await get(outputAppPropertiesState);
    return allProperties
      .filter((field) => field.type === 'SINGLE_LINE_TEXT')
      .filter((singleLineField) => (singleLineField as kintoneAPI.property.SingleLineText).unique);
  }
);

export const outputAppTextPropertiesState = atom<Promise<kintoneAPI.FieldProperty[]>>(
  async (get) => {
    const allProperties = await get(outputAppPropertiesState);
    return allProperties.filter(
      (field) =>
        field.type === 'RICH_TEXT' ||
        field.type === 'MULTI_LINE_TEXT' ||
        field.type === 'SINGLE_LINE_TEXT'
    );
  }
);

export const outputAppFilePropertiesState = atom<Promise<kintoneAPI.FieldProperty[]>>(
  async (get) => {
    const allProperties = await get(outputAppPropertiesState);
    return allProperties.filter((field) => field.type === 'FILE');
  }
);

export const logAppPropertiesState = atom<Promise<kintoneAPI.FieldProperty[]>>(async (get) => {
  const appId = get(logAppIdAtom);
  if (!appId) {
    return [];
  }
  const appSpaceId = get(logAppSpaceIdAtom);

  try {
    const { properties } = await withSpaceIdFallback({
      spaceId: appSpaceId,
      func: getFormFields,
      funcParams: {
        app: appId,
        preview: true,
        debug: process.env.NODE_ENV === 'development',
      },
    });
    const filtered = filterFieldProperties(
      properties,
      (field) => !['GROUP', 'SUBTABLE'].includes(field.type)
    );

    return Object.values(filtered).sort((a, b) => a.label.localeCompare(b.label, 'ja'));
  } catch (_error) {
    return [];
  }
});

export const logAppTextPropertiesState = atom<Promise<kintoneAPI.FieldProperty[]>>(async (get) => {
  const allProperties = await get(logAppPropertiesState);
  return allProperties.filter(
    (field) =>
      field.type === 'RICH_TEXT' ||
      field.type === 'MULTI_LINE_TEXT' ||
      field.type === 'SINGLE_LINE_TEXT'
  );
});

export const logAppFilePropertiesState = atom<Promise<kintoneAPI.FieldProperty[]>>(async (get) => {
  const allProperties = await get(logAppPropertiesState);
  return allProperties.filter((field) => field.type === 'FILE');
});

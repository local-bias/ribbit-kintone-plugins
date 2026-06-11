import {
  getAllApps,
  getAppId,
  getAppStatus,
  getFormFields,
  getSpace,
  type kintoneAPI,
  withSpaceIdFallback,
} from '@konomi-app/kintone-utilities';
import { atom } from '@repo/jotai';
import { eagerAtom } from 'jotai-eager';
import { GUEST_SPACE_ID, isDev } from '@/lib/global';
import { dstAppIdAtom, dstSpaceIdAtom, isDstAppGuestSpaceAtom } from './plugin';

const DISALLOWED_FIELD_TYPES: kintoneAPI.FieldPropertyType[] = [
  'SUBTABLE',
  'GROUP',
  'CATEGORY',
  'REFERENCE_TABLE',
  'FILE',
];

export const kintoneAppsState = atom(async () => {
  const apps = await getAllApps({
    guestSpaceId: GUEST_SPACE_ID,
    debug: isDev,
  });
  return apps;
});

export const kintoneSpacesState = atom<Promise<kintoneAPI.rest.space.GetSpaceResponse[]>>(
  async (get) => {
    const apps = await get(kintoneAppsState);
    const spaceIds = [
      ...new Set(apps.filter((app) => app.spaceId).map<string>((app) => app.spaceId as string)),
    ];

    const spaces: kintoneAPI.rest.space.GetSpaceResponse[] = [];
    for (const id of spaceIds) {
      const space = await withSpaceIdFallback({
        spaceId: id,
        func: getSpace,
        funcParams: { id, debug: true },
      });
      spaces.push(space);
    }

    return spaces;
  }
);

export const currentAppFieldsAtom = atom<Promise<kintoneAPI.FieldProperty[]>>(async () => {
  const app = getAppId()!;
  const { properties } = await getFormFields({
    app,
    preview: true,
    guestSpaceId: GUEST_SPACE_ID,
    debug: isDev,
  });

  return Object.values(properties).sort((a, b) => a.label.localeCompare(b.label, 'ja'));
});

export const currentAppNumberFieldsAtom = eagerAtom((get) => {
  const fields = get(currentAppFieldsAtom);
  return fields.filter((field) => field.type === 'NUMBER' || field.type === 'CALC');
});

const DATE_FIELD_TYPES: kintoneAPI.FieldPropertyType[] = [
  'DATE',
  'DATETIME',
  'CREATED_TIME',
  'UPDATED_TIME',
];

/** 日付オフセットのソースとして使用できる日付関連フィールド */
export const currentAppDateFieldsAtom = eagerAtom((get) => {
  const fields = get(currentAppFieldsAtom);
  return fields.filter((field) => DATE_FIELD_TYPES.includes(field.type));
});

export const bindableAppFieldsAtom = eagerAtom((get) => {
  const appFields = get(currentAppFieldsAtom);
  return appFields.filter((field) => !DISALLOWED_FIELD_TYPES.includes(field.type));
});

export const dstAppFieldsState = atom<Promise<kintoneAPI.FieldProperty[]>>(async (get) => {
  const app = get(dstAppIdAtom);
  if (!app) {
    return [];
  }
  const spaceId = get(dstSpaceIdAtom);
  const isGuestSpace = get(isDstAppGuestSpaceAtom);

  const guestSpaceId = GUEST_SPACE_ID ?? (isGuestSpace ? (spaceId ?? undefined) : undefined);

  const { properties } = await getFormFields({
    app,
    preview: true,
    guestSpaceId,
    debug: isDev,
  });

  const values = Object.values(properties).filter(
    (field) => !DISALLOWED_FIELD_TYPES.includes(field.type)
  );

  return values.sort((a, b) => a.label.localeCompare(b.label, 'ja'));
});

export const flatFieldsState = atom<Promise<kintoneAPI.FieldProperty[]>>(async (get) => {
  const fields = await get(bindableAppFieldsAtom);
  return fields.flatMap((field) => {
    if (field.type === 'SUBTABLE') {
      return Object.values(field.fields);
    }
    return field;
  });
});

export const srcAppStatusState = atom(async () => {
  const app = getAppId()!;
  return getAppStatus({
    app,
    guestSpaceId: GUEST_SPACE_ID,
    debug: isDev,
  });
});

import { getFormFields, kintoneAPI, getAppId, getViews } from '@konomi-app/kintone-utilities';
import { atom } from 'jotai';
import { GUEST_SPACE_ID, LANGUAGE } from '@/lib/global';

export const appFieldsAtom = atom<Promise<kintoneAPI.FieldProperty[]>>(async () => {
  const app = getAppId()!;
  const { properties } = await getFormFields({
    app,
    preview: true,
    guestSpaceId: GUEST_SPACE_ID,
    debug: process.env.NODE_ENV === 'development',
  });

  const values = Object.values(properties);

  return values.sort((a, b) => a.label.localeCompare(b.label, 'ja'));
});

export const flatFieldsAtom = atom<Promise<kintoneAPI.FieldProperty[]>>(async (get) => {
  const fields = await get(appFieldsAtom);
  return fields.flatMap((field) => {
    if (field.type === 'SUBTABLE') {
      return Object.values(field.fields);
    }
    return field;
  });
});

export const textFieldsAtom = atom<Promise<kintoneAPI.FieldProperty[]>>(async (get) => {
  const allFields = await get(appFieldsAtom);

  return allFields.filter(
    (field) => field.type === 'SINGLE_LINE_TEXT' || field.type === 'MULTI_LINE_TEXT'
  );
});

export const allViewsAtom = atom<Promise<Record<string, kintoneAPI.view.Response>>>(async () => {
  const { views: allViews } = await getViews({
    app: getAppId()!,
    guestSpaceId: GUEST_SPACE_ID,
    preview: true,
    debug: process.env.NODE_ENV === 'development',
    lang: LANGUAGE as kintoneAPI.rest.Lang,
  });

  const all = {
    '(すべて)': {
      id: '20',
      type: 'LIST',
      name: '(すべて)',
    },
  } as any as Record<string, kintoneAPI.view.Response>;

  return { ...allViews, ...all };
});

export const customizeViewsAtom = atom<Promise<kintoneAPI.view.Response[]>>(async (get) => {
  const allViews = await get(allViewsAtom);

  return Object.values(allViews).filter((view) => view.type === 'CUSTOM');
});

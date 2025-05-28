import { getAppId, getFormFields, getFormLayout, kintoneAPI } from '@konomi-app/kintone-utilities';
import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';
import { isDeepEqual } from 'remeda';

export const currentAppIdAtom = atom(() => {
  const app = getAppId();
  if (!app) {
    throw new Error('App ID not found');
  }
  return app;
});

export const appFormFieldsAtom = atomFamily(
  (params: Parameters<typeof getFormFields>[0]) =>
    atom<Promise<kintoneAPI.FieldProperty[]>>(async () => {
      const { properties } = await getFormFields(params);
      const values = Object.values(properties);
      return values.sort((a, b) => a.label.localeCompare(b.label, 'ja'));
    }),
  (a, b) =>
    isDeepEqual(
      { ...a, preview: !!a.preview, debug: !!a.debug },
      { ...b, preview: !!b.preview, debug: !!b.debug }
    )
);

export const appFormLayoutState = atomFamily(
  (params: Parameters<typeof getFormLayout>[0]) =>
    atom<Promise<kintoneAPI.Layout>>(async () => {
      const { layout } = await getFormLayout(params);
      return layout;
    }),
  (a, b) =>
    isDeepEqual(
      { ...a, preview: !!a.preview, debug: !!a.debug },
      { ...b, preview: !!b.preview, debug: !!b.debug }
    )
);

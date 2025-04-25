import { getAppId, getFormFields, getFormLayout, kintoneAPI } from '@konomi-app/kintone-utilities';
import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';

export const currentAppIdAtom = atom(() => {
  const app = getAppId();
  if (!app) {
    throw new Error('App ID not found');
  }
  return app;
});

export const appFormFieldsAtom = atomFamily(
  (params: { appId: string | number; spaceId?: string | number; preview?: boolean }) =>
    atom<Promise<kintoneAPI.FieldProperty[]>>(async () => {
      const { properties } = await getFormFields({
        app: params.appId,
        preview: params.preview,
        guestSpaceId: params.spaceId,
      });

      const values = Object.values(properties);
      return values.sort((a, b) => a.label.localeCompare(b.label, 'ja'));
    }),
  (a, b) => a.appId == b.appId && a.spaceId == b.spaceId && !!a.preview === !!b.preview
);

export const appFormLayoutState = atomFamily(
  (params: { appId: string | number; spaceId?: string | number; preview: boolean }) =>
    atom<Promise<kintoneAPI.Layout>>(async () => {
      const { layout } = await getFormLayout({
        app: params.appId,
        preview: params.preview,
        guestSpaceId: params.spaceId,
      });
      return layout;
    }),
  (a, b) => a.appId == b.appId && a.preview == b.preview && a.spaceId == b.spaceId
);

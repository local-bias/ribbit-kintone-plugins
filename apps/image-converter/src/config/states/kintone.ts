import { getFormFields, kintoneAPI, getAppId } from '@konomi-app/kintone-utilities';
import { GUEST_SPACE_ID } from '@/lib/global';
import { atom } from 'jotai';

export const currentAppIdAtom = atom(() => {
  const app = getAppId();
  if (!app) {
    throw new Error('App ID not found');
  }
  return app;
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

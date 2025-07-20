import { GUEST_SPACE_ID } from '@/lib/global';
import { getAppId } from '@/lib/kintone';
import { getFormFields, kintoneAPI } from '@konomi-app/kintone-utilities';
import { atom } from 'jotai';

export const appFieldsAtom = atom<Promise<kintoneAPI.FieldProperty[]>>(async () => {
  const app = getAppId();
  if (!app) {
    throw new Error('アプリのフィールド情報が取得できませんでした');
  }

  const { properties } = await getFormFields({
    app,
    preview: true,
    guestSpaceId: GUEST_SPACE_ID,
  });

  const values = Object.values(properties);

  return values.sort((a, b) => a.label.localeCompare(b.label, 'ja'));
});

import { getFormFields, type kintoneAPI } from '@konomi-app/kintone-utilities';
import { atom } from '@repo/jotai';
import { GUEST_SPACE_ID } from '@/lib/global';
import { getAppId } from '@/lib/kintone';

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

  // サブテーブルはコンテナ自体ではなく、内包するフィールドを選択肢として展開する
  const values = Object.values(properties).flatMap((field) => {
    if (field.type === 'SUBTABLE') {
      return Object.values(field.fields);
    }
    return field;
  });

  return values.sort((a, b) => a.label.localeCompare(b.label, 'ja'));
});

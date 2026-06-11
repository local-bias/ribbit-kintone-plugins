import { appFormFieldsAtom, atom, currentAppIdAtom } from '@repo/jotai';
import { GUEST_SPACE_ID } from '@/lib/global';

export const currentAppFieldsAtom = atom((get) => {
  const app = get(currentAppIdAtom);
  return get(
    appFormFieldsAtom({
      app,
      guestSpaceId: GUEST_SPACE_ID,
      preview: true,
    })
  );
});

/** アプリ内のサブテーブル（テーブル）フィールド一覧 */
export const currentAppSubtableFieldsAtom = atom(async (get) => {
  const fields = await get(currentAppFieldsAtom);
  return fields.filter((field) => field.type === 'SUBTABLE');
});

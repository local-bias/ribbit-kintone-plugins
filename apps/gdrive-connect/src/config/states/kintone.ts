import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import { appFormFieldsAtom, appFormLayoutState, atom, currentAppIdAtom } from '@repo/jotai';
import { GUEST_SPACE_ID } from '@/lib/global';
import { flatLayout } from '@/lib/kintone';

const UNSELECTABLE_FIELD_TYPES = new Set<kintoneAPI.FieldPropertyType>([
  'GROUP',
  'REFERENCE_TABLE',
  'SUBTABLE',
]);

const isSelectableField = (field: kintoneAPI.FieldProperty) =>
  !UNSELECTABLE_FIELD_TYPES.has(field.type);

export const currentAppFormLayoutAtom = atom(async (get) => {
  const app = get(currentAppIdAtom);
  return await get(
    appFormLayoutState({
      app,
      guestSpaceId: GUEST_SPACE_ID,
      preview: true,
    })
  );
});

/** プラグインの表示先として選択可能な、アプリ上のスペースフィールド一覧 */
export const currentAppSpaceFieldsAtom = atom(async (get) => {
  const layout = await get(currentAppFormLayoutAtom);
  return flatLayout(layout).filter(
    (field): field is kintoneAPI.layout.Spacer => field.type === 'SPACER' && !!field.elementId
  );
});

/** フォルダ名の生成などに使用できる、アプリ上の全フィールド一覧(グループ・サブテーブル等を除く) */
export const currentAppFieldsAtom = atom(async (get) => {
  const app = get(currentAppIdAtom);
  const fields = await get(
    appFormFieldsAtom({
      app,
      guestSpaceId: GUEST_SPACE_ID,
      preview: true,
    })
  );
  return fields.filter(isSelectableField);
});

/** GoogleドライブのフォルダIDを保存できる、単一行テキストフィールドのみの一覧 */
export const currentAppTextFieldsAtom = atom(async (get) => {
  const fields = await get(currentAppFieldsAtom);
  return fields.filter((field) => field.type === 'SINGLE_LINE_TEXT');
});

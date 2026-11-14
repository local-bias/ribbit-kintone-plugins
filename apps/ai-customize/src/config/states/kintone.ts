import { getAllApps, type kintoneAPI } from '@konomi-app/kintone-utilities';
import { type Atom, appFormFieldsAtom, atom } from '@repo/jotai';
import {
  CHOICE_VALUE_MAPPINGS,
  FIELD_MAPPINGS,
  type FieldCodeKey,
  filterFieldsByTypes,
  getDefaultSelectedOptions,
  getFieldOptions,
} from '@/lib/field-mapping';
import { GUEST_SPACE_ID, isDev } from '@/lib/global';
import { commonPropertyAtoms } from './plugin';

/** 管理アプリとして選べるアプリ(このアプリと同じスペース種別の範囲) */
export const kintoneAppsAtom = atom(() =>
  getAllApps({ guestSpaceId: GUEST_SPACE_ID, debug: isDev })
);

/** 選択中のアセット管理アプリのフィールド(運用環境) */
export const assetAppFieldsAtom = atom<Promise<kintoneAPI.FieldProperty[]>>(async (get) => {
  const app = get(commonPropertyAtoms.assetAppId);
  if (!/^\d+$/.test(app)) {
    return [];
  }
  const guestSpaceId = get(commonPropertyAtoms.assetAppSpaceId) || undefined;
  return get(appFormFieldsAtom({ app, guestSpaceId, preview: false, debug: isDev }));
});

/** 対応付けの項目ごとに、型の合うフィールドだけを返すatom */
export const mappableFieldsAtoms = Object.fromEntries(
  FIELD_MAPPINGS.map((mapping) => [
    mapping.key,
    atom(async (get) => filterFieldsByTypes(await get(assetAppFieldsAtom), mapping.types)),
  ])
) as Record<FieldCodeKey, Atom<Promise<kintoneAPI.FieldProperty[]>>>;

const findMappedField = async (
  get: <V>(atom: Atom<V>) => V,
  key: FieldCodeKey
): Promise<kintoneAPI.FieldProperty | undefined> => {
  const code = get(commonPropertyAtoms[key]);
  return (await get(assetAppFieldsAtom)).find((field) => field.code === code);
};

/** 選択肢の値を選ぶための、対応付けたフィールドの選択肢 */
export const choiceOptionsAtoms = Object.fromEntries(
  [...new Set(CHOICE_VALUE_MAPPINGS.map((mapping) => mapping.fieldKey))].map((fieldKey) => [
    fieldKey,
    atom(async (get) => getFieldOptions(await findMappedField(get, fieldKey))),
  ])
) as Partial<Record<FieldCodeKey, Atom<Promise<string[]>>>>;

/** 「権限」フィールドの初期値で選択されている選択肢(全て未選択であるべき) */
export const permissionsDefaultSelectedAtom = atom(async (get) =>
  getDefaultSelectedOptions(await findMappedField(get, 'permissionsFieldCode'))
);

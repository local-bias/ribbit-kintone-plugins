import { GUEST_SPACE_ID, isDev } from '@/lib/global';
import { t } from '@/lib/i18n';
import { getFormLayout, getAppId, kintoneAPI } from '@konomi-app/kintone-utilities';
import { appFormFieldsAtom, currentAppIdAtom } from '@repo/jotai';
import { atom } from 'jotai';

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

/**
 * 添付ファイルフィールドのみを返すatom。
 * トップレベルのFILEフィールドとサブテーブル内のFILEフィールドの両方を含む。
 * サブテーブル内のフィールドは「サブテーブルコード.フィールドコード」形式のcodeに変換される。
 */
export const fileFieldPropertiesAtom = atom(async (get) => {
  const allFields = await get(currentAppFieldsAtom);

  const result: kintoneAPI.FieldProperty[] = [];

  for (const field of allFields) {
    if (field.type === 'FILE') {
      result.push(field);
    }
    if (field.type === 'SUBTABLE') {
      const subtableCode = field.code;
      const subtableFields = Object.values(field.fields);
      for (const subField of subtableFields) {
        if (subField.type === 'FILE') {
          result.push({
            ...subField,
            code: `${subtableCode}.${subField.code}`,
            label: `${field.label} > ${subField.label}`,
          });
        }
      }
    }
  }

  return result;
});

function flatLayout(layout: kintoneAPI.Layout): kintoneAPI.LayoutField[] {
  const results: kintoneAPI.LayoutField[] = [];

  for (const chunk of layout) {
    if (chunk.type === 'ROW') {
      results.push(...chunk.fields);
      continue;
    }
    if (chunk.type === 'GROUP') {
      results.push(...flatLayout(chunk.layout));
      continue;
    }
    if (chunk.type === 'SUBTABLE') {
      results.push(...chunk.fields);
    }
  }

  return results;
}

const appLayoutAtom = atom<Promise<kintoneAPI.Layout>>(async () => {
  const app = getAppId();
  if (!app) {
    throw new Error(t('error.layoutNotFound'));
  }

  const { layout } = await getFormLayout({
    app,
    preview: true,
    guestSpaceId: GUEST_SPACE_ID,
    debug: isDev,
  });

  return layout;
});

export const appSpacesAtom = atom<Promise<kintoneAPI.layout.Spacer[]>>(async (get) => {
  const layout = await get(appLayoutAtom);
  const fields = flatLayout(layout);
  const spaces = fields.filter((field) => field.type === 'SPACER') as kintoneAPI.layout.Spacer[];

  return spaces.filter((space) => space.elementId);
});

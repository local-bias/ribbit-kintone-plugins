import { getAllApps, getFormFields, type kintoneAPI } from '@konomi-app/kintone-utilities';
import { appFormFieldsAtom, appFormLayoutState, currentAppIdAtom } from '@repo/jotai';
import { atom } from 'jotai';
import {
  relatedAppIdAtom,
  relatedQueryConditionsAtom,
  relatedSubtableCodeAtom,
} from '@/config/states/plugin';
import { GUEST_SPACE_ID, isDev } from '@/lib/global';
import { flatLayout } from '@/lib/kintone';

const UNSELECTABLE_FIELD_TYPES = new Set<kintoneAPI.FieldPropertyType>([
  'GROUP',
  'REFERENCE_TABLE',
  'SUBTABLE',
]);

const DYNAMIC_QUERY_FIELD_TYPES = new Set<string>([
  'SINGLE_LINE_TEXT',
  'MULTI_LINE_TEXT',
  'RICH_TEXT',
  'LINK',
  'NUMBER',
  'CALC',
  'DATE',
  'DATETIME',
  'TIME',
  'RADIO_BUTTON',
  'DROP_DOWN',
  'CHECK_BOX',
  'MULTI_SELECT',
  'CREATOR',
  'MODIFIER',
  'STATUS_ASSIGNEE',
  'USER_SELECT',
  'GROUP_SELECT',
  'ORGANIZATION_SELECT',
  'STATUS',
  'RECORD_NUMBER',
  'CREATED_TIME',
  'UPDATED_TIME',
]);

export type RelatedAppQueryField = kintoneAPI.FieldProperty & {
  subtableCode?: string;
  subtableLabel?: string;
};

const sortFields = <T extends { label: string }>(fields: T[]) => {
  return fields.sort((a, b) => a.label.localeCompare(b.label, 'ja'));
};

const isSelectableField = (field: kintoneAPI.FieldProperty) => {
  return !UNSELECTABLE_FIELD_TYPES.has(field.type);
};

const isDynamicQueryField = (field: { type: string }) => DYNAMIC_QUERY_FIELD_TYPES.has(field.type);

export const kintoneAppsAtom = atom(() => {
  return getAllApps({ guestSpaceId: GUEST_SPACE_ID, debug: isDev });
});

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

export const currentAppDynamicQueryFieldsAtom = atom(async (get) => {
  const fields = await get(currentAppFieldsAtom);
  return fields.filter(isDynamicQueryField);
});

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

export const currentAppSpaceFieldsAtom = atom(async (get) => {
  const layout = await get(currentAppFormLayoutAtom);
  return flatLayout(layout).filter(
    (field): field is kintoneAPI.layout.Spacer => field.type === 'SPACER' && !!field.elementId
  );
});

export const relatedAppFieldsAtom = atom<Promise<kintoneAPI.FieldProperty[]>>(async (get) => {
  const relatedAppId = get(relatedAppIdAtom);
  if (!relatedAppId) {
    return [];
  }

  const { properties } = await getFormFields({
    app: relatedAppId,
    preview: true,
    guestSpaceId: GUEST_SPACE_ID,
    debug: isDev,
  });

  return sortFields(Object.values(properties));
});

export const relatedAppSelectableFieldsAtom = atom(async (get) => {
  const fields = await get(relatedAppFieldsAtom);
  return fields.filter(isSelectableField);
});

export const relatedAppDynamicQueryFieldsAtom = atom(async (get) => {
  const fields = await get(relatedAppFieldsAtom);
  const topLevelFields = fields.filter(
    (field): field is RelatedAppQueryField => isSelectableField(field) && isDynamicQueryField(field)
  );
  const subtableInnerFields = fields
    .filter((field): field is kintoneAPI.property.Subtable => field.type === 'SUBTABLE')
    .flatMap((subtable) =>
      (Object.values(subtable.fields) as kintoneAPI.property.InSubtable[])
        .filter(isDynamicQueryField)
        .map(
          (innerField): RelatedAppQueryField => ({
            ...innerField,
            label: `[${subtable.label}] ${innerField.label}`,
            subtableCode: subtable.code,
            subtableLabel: subtable.label,
          })
        )
    );
  return sortFields([...topLevelFields, ...subtableInnerFields]);
});

const recordIdField = {
  code: '$id',
  label: 'レコード番号',
  type: 'RECORD_NUMBER',
} as kintoneAPI.FieldProperty;

export const relatedAppSortableFieldsAtom = atom(async (get) => {
  const fields = await get(relatedAppSelectableFieldsAtom);
  return [recordIdField, ...fields];
});

export const relatedAppSubtableFieldsAtom = atom(async (get) => {
  const fields = await get(relatedAppFieldsAtom);
  return fields.filter((field): field is kintoneAPI.property.Subtable => field.type === 'SUBTABLE');
});

export const selectedSubtableFieldsAtom = atom(async (get) => {
  const relatedSubtableCode = get(relatedSubtableCodeAtom);
  const subtables = await get(relatedAppSubtableFieldsAtom);
  const subtable = subtables.find((field) => field.code === relatedSubtableCode);

  if (!subtable) {
    return [];
  }

  return sortFields(Object.values(subtable.fields) as kintoneAPI.FieldProperty[]);
});

/**
 * 関連先アプリの照合フィールドとして選択できるフィールド一覧。
 * トップレベルのフィールドに加え、全サブテーブルの内部フィールドも含む。
 * サブテーブル内のフィールドはラベルに "[サブテーブル名]" プレフィックスを付与して区別する。
 */
export const relatedAppAllSelectableFieldsAtom = atom(async (get) => {
  const fields = await get(relatedAppFieldsAtom);
  const topLevelFields = fields.filter(isSelectableField);
  const subtableInnerFields = fields
    .filter((field): field is kintoneAPI.property.Subtable => field.type === 'SUBTABLE')
    .flatMap((subtable) =>
      (Object.values(subtable.fields) as kintoneAPI.FieldProperty[]).map((innerField) => ({
        ...innerField,
        label: `[${subtable.label}] ${innerField.label}`,
      }))
    );
  return sortFields([...topLevelFields, ...subtableInnerFields]);
});

export const relatedAppMatchingSubtableAtom = atom(async (get) => {
  const relatedQueryConditions = get(relatedQueryConditionsAtom).filter(
    (condition) => !!condition.relatedAppFieldCode
  );
  if (!relatedQueryConditions.length) {
    return null;
  }

  const subtables = await get(relatedAppSubtableFieldsAtom);
  return (
    subtables.find((subtable) =>
      relatedQueryConditions.some((condition) => !!subtable.fields[condition.relatedAppFieldCode])
    ) ?? null
  );
});

export const isRelatedAppMatchingFieldInSubtableAtom = atom(async (get) => {
  return !!(await get(relatedAppMatchingSubtableAtom));
});

/**
 * 関連先アプリの絞り込み条件用フィールド一覧。
 * SUBTABLE は FieldConditionInput が内部的に展開するため含める。
 * GROUP / REFERENCE_TABLE / CATEGORY / RELATED_RECORDS は除外する。
 */
const UNSELECTABLE_FOR_FILTER_TYPES = new Set<kintoneAPI.FieldPropertyType>([
  'GROUP',
  'REFERENCE_TABLE',
  'CATEGORY',
]);
export const relatedAppFilterableFieldsAtom = atom(async (get) => {
  const fields = await get(relatedAppFieldsAtom);
  return fields.filter((field) => !UNSELECTABLE_FOR_FILTER_TYPES.has(field.type));
});

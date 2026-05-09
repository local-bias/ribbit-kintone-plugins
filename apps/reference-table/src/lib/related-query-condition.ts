import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import type { RelatedQueryConditionType } from '../schema/plugin-config';

type FieldLike =
  | Pick<kintoneAPI.FieldProperty, 'type'>
  | Pick<kintoneAPI.property.InSubtable, 'type'>;

const DATE_FIELD_TYPES = new Set<string>([
  'DATE',
  'DATETIME',
  'TIME',
  'CREATED_TIME',
  'UPDATED_TIME',
]);
const NUMBER_FIELD_TYPES = new Set<string>(['NUMBER', 'CALC', 'RECORD_NUMBER']);
const DEFAULT_CONDITION_TYPES: RelatedQueryConditionType[] = [
  'equal',
  'notEqual',
  'include',
  'exclude',
];
const DATE_CONDITION_TYPES: RelatedQueryConditionType[] = [
  'equal',
  'notEqual',
  'dateBefore',
  'dateBeforeOrEqual',
  'dateAfter',
  'dateAfterOrEqual',
];
const NUMBER_CONDITION_TYPES: RelatedQueryConditionType[] = [
  'equal',
  'notEqual',
  'greater',
  'greaterOrEqual',
  'less',
  'lessOrEqual',
];

export const RELATED_QUERY_CONDITION_LABELS: Record<RelatedQueryConditionType, string> = {
  equal: '等しい',
  notEqual: '等しくない',
  include: '含む',
  exclude: '含まない',
  dateAfter: 'より後',
  dateAfterOrEqual: '以降',
  dateBefore: 'より前',
  dateBeforeOrEqual: '以前',
  greater: 'より大きい',
  greaterOrEqual: '以上',
  less: 'より小さい',
  lessOrEqual: '以下',
};

export const isDateFieldType = (type: unknown) =>
  typeof type === 'string' && DATE_FIELD_TYPES.has(type);

export const isNumberFieldType = (type: unknown) =>
  typeof type === 'string' && NUMBER_FIELD_TYPES.has(type);

export const getRelatedQueryConditionTypesForField = (
  field?: FieldLike | null,
  options: { isInSubtable?: boolean } = {}
): RelatedQueryConditionType[] => {
  if (options.isInSubtable) {
    return ['equal', 'notEqual'];
  }
  if (isDateFieldType(field?.type)) {
    return DATE_CONDITION_TYPES;
  }
  if (isNumberFieldType(field?.type)) {
    return NUMBER_CONDITION_TYPES;
  }
  return DEFAULT_CONDITION_TYPES;
};

export const getFallbackRelatedQueryConditionType = (
  field?: FieldLike | null,
  options: { isInSubtable?: boolean } = {}
): RelatedQueryConditionType => getRelatedQueryConditionTypesForField(field, options)[0] ?? 'equal';

export const isRelatedQueryConditionTypeAllowedForField = (
  type: RelatedQueryConditionType,
  field?: FieldLike | null,
  options: { isInSubtable?: boolean } = {}
) => getRelatedQueryConditionTypesForField(field, options).includes(type);

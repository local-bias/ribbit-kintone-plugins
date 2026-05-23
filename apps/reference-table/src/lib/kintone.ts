import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import {
  type RelatedQueryConditionType,
  RelatedQueryConditionTypeSchema,
  type SortOrder,
} from '../schema/plugin-config';
import { extractComparableValues } from './field';
import { GUEST_SPACE_ID } from './global';
import { isRelatedQueryConditionTypeAllowedForField } from './related-query-condition';

export { extractComparableValues } from './field';

export const flatLayout = (layout: kintoneAPI.Layout): kintoneAPI.LayoutField[] => {
  return layout.flatMap((item: kintoneAPI.Layout[number]) => {
    switch (item.type) {
      case 'GROUP':
        return flatLayout(item.layout);
      case 'ROW':
      case 'SUBTABLE':
        return item.fields;
      default:
        return [];
    }
  });
};

const NUMERIC_FIELD_TYPES = new Set<kintoneAPI.FieldPropertyType>([
  'CALC',
  'NUMBER',
  'RECORD_NUMBER',
]);

const MULTI_VALUE_FIELD_TYPES = new Set<kintoneAPI.FieldPropertyType>([
  'CHECK_BOX',
  'GROUP_SELECT',
  'MULTI_SELECT',
  'ORGANIZATION_SELECT',
  'STATUS_ASSIGNEE',
  'USER_SELECT',
]);

const UNSAFE_FIELD_CODE_PATTERN = /[\p{C}\s"'`\\(),=<>!;]/u;

const escapeQueryText = (value: string) => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

export const quoteFieldCode = (fieldCode: string) => {
  const normalizedFieldCode = fieldCode.trim();
  if (!normalizedFieldCode || UNSAFE_FIELD_CODE_PATTERN.test(normalizedFieldCode)) {
    throw new Error(`Invalid field code: ${fieldCode}`);
  }
  return normalizedFieldCode;
};

const formatQueryValue = (value: string, fieldType: kintoneAPI.FieldPropertyType) => {
  if (NUMERIC_FIELD_TYPES.has(fieldType) && Number.isFinite(Number(value))) {
    return String(Number(value));
  }
  return `"${escapeQueryText(value)}"`;
};

const normalizeSortOrder = (sortOrder: SortOrder) => {
  if (sortOrder !== 'asc' && sortOrder !== 'desc') {
    throw new Error(`Invalid sort order: ${sortOrder}`);
  }
  return sortOrder;
};

const normalizeConditionType = (type: RelatedQueryConditionType) => {
  const parsed = RelatedQueryConditionTypeSchema.safeParse(type);
  if (!parsed.success) {
    throw new Error(`Invalid condition type: ${String(type)}`);
  }
  return parsed.data;
};

const createValueList = (values: string[], fieldType: kintoneAPI.FieldPropertyType) => {
  return values.map((value) => formatQueryValue(value, fieldType)).join(', ');
};

const createLikeCondition = (params: {
  fieldCode: string;
  values: string[];
  fieldType: kintoneAPI.FieldPropertyType;
  negated: boolean;
}) => {
  const operator = params.negated ? 'not like' : 'like';
  const joiner = params.negated ? ' and ' : ' or ';
  const conditions = params.values.map(
    (value) => `${params.fieldCode} ${operator} ${formatQueryValue(value, params.fieldType)}`
  );
  return conditions.length === 1 ? conditions[0] : `(${conditions.join(joiner)})`;
};

const createComparisonCondition = (params: {
  fieldCode: string;
  values: string[];
  fieldType: kintoneAPI.FieldPropertyType;
  operator: '>' | '>=' | '<' | '<=';
}) => {
  const [value] = params.values;
  if (value === undefined) {
    return null;
  }
  return `${params.fieldCode} ${params.operator} ${formatQueryValue(value, params.fieldType)}`;
};

const createRelatedRecordQueryCondition = (params: RelatedRecordsQueryConditionInput) => {
  const type = normalizeConditionType(params.type);
  if (
    !isRelatedQueryConditionTypeAllowedForField(
      type,
      { type: params.fieldType },
      { isInSubtable: params.forceInOperator }
    )
  ) {
    throw new Error(`Invalid condition type: ${type}`);
  }

  const values = extractComparableValues(params.value);
  if (!values.length) {
    return null;
  }

  const fieldCode = quoteFieldCode(params.fieldCode);
  const shouldUseSetOperator =
    params.forceInOperator || values.length > 1 || MULTI_VALUE_FIELD_TYPES.has(params.fieldType);

  switch (type) {
    case 'equal':
      return shouldUseSetOperator
        ? `${fieldCode} in (${createValueList(values, params.fieldType)})`
        : `${fieldCode} = ${formatQueryValue(values[0] ?? '', params.fieldType)}`;
    case 'notEqual':
      return shouldUseSetOperator
        ? `${fieldCode} not in (${createValueList(values, params.fieldType)})`
        : `${fieldCode} != ${formatQueryValue(values[0] ?? '', params.fieldType)}`;
    case 'include':
      return createLikeCondition({
        fieldCode,
        values,
        fieldType: params.fieldType,
        negated: false,
      });
    case 'exclude':
      return createLikeCondition({ fieldCode, values, fieldType: params.fieldType, negated: true });
    case 'greater':
    case 'dateAfter':
      return createComparisonCondition({
        fieldCode,
        values,
        fieldType: params.fieldType,
        operator: '>',
      });
    case 'greaterOrEqual':
    case 'dateAfterOrEqual':
      return createComparisonCondition({
        fieldCode,
        values,
        fieldType: params.fieldType,
        operator: '>=',
      });
    case 'less':
    case 'dateBefore':
      return createComparisonCondition({
        fieldCode,
        values,
        fieldType: params.fieldType,
        operator: '<',
      });
    case 'lessOrEqual':
    case 'dateBeforeOrEqual':
      return createComparisonCondition({
        fieldCode,
        values,
        fieldType: params.fieldType,
        operator: '<=',
      });
    default:
      throw new Error(`Invalid condition type: ${String(type)}`);
  }
};

export type RelatedRecordsQueryConditionInput = {
  fieldCode: string;
  fieldType: kintoneAPI.FieldPropertyType;
  value: unknown;
  type: RelatedQueryConditionType;
  forceInOperator?: boolean;
};

export const createRelatedRecordsQueryFromConditions = (params: {
  conditions: RelatedRecordsQueryConditionInput[];
  sortFieldCode: string;
  sortOrder: SortOrder;
  extraConditions?: string[];
}) => {
  const resolvedConditions = params.conditions
    .map(createRelatedRecordQueryCondition)
    .filter((condition): condition is string => !!condition);

  const allConditions = [...resolvedConditions, ...(params.extraConditions ?? [])];

  if (!allConditions.length) {
    return null;
  }

  return `${allConditions.join(' and ')} order by ${quoteFieldCode(params.sortFieldCode || '$id')} ${normalizeSortOrder(params.sortOrder)}`;
};

export const createRelatedRecordsQuery = (params: {
  fieldCode: string;
  fieldType: kintoneAPI.FieldPropertyType;
  value: unknown;
  sortFieldCode: string;
  sortOrder: SortOrder;
  forceInOperator?: boolean;
}) => {
  return createRelatedRecordsQueryFromConditions({
    conditions: [
      {
        fieldCode: params.fieldCode,
        fieldType: params.fieldType,
        value: params.value,
        type: 'equal',
        forceInOperator: params.forceInOperator,
      },
    ],
    sortFieldCode: params.sortFieldCode,
    sortOrder: params.sortOrder,
  });
};

export const createSortQuery = (params: { sortFieldCode: string; sortOrder: SortOrder }) => {
  return `order by ${quoteFieldCode(params.sortFieldCode || '$id')} ${normalizeSortOrder(params.sortOrder)}`;
};

export const getRecordUrl = (appId: string, recordId: string) => {
  const encodedAppId = encodeURIComponent(appId);
  const encodedRecordId = encodeURIComponent(recordId);
  const encodedGuestSpaceId = GUEST_SPACE_ID ? encodeURIComponent(String(GUEST_SPACE_ID)) : null;
  const path = GUEST_SPACE_ID
    ? `/k/guest/${encodedGuestSpaceId}/${encodedAppId}/show#record=${encodedRecordId}`
    : `/k/${encodedAppId}/show#record=${encodedRecordId}`;
  return `${location.origin}${path}`;
};

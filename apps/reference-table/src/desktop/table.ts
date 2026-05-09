import { getFieldValueAsString, type kintoneAPI } from '@konomi-app/kintone-utilities';
import { extractComparableValues } from '../lib/field';
import { isDateFieldType } from '../lib/related-query-condition';
import {
  type AggregationRoundingMode,
  DEFAULT_AGGREGATION_DECIMAL_DIGITS,
  DEFAULT_AGGREGATION_ROUNDING_MODE,
  MAX_AGGREGATION_DECIMAL_DIGITS,
  MIN_AGGREGATION_DECIMAL_DIGITS,
  type PluginCondition,
  type RelatedQueryConditionType,
} from '../schema/plugin-config';

export type RelatedRecord = kintoneAPI.RecordData & {
  $id?: kintoneAPI.field.ID;
};

export type RelatedSubtableRow = kintoneAPI.field.Subtable['value'][number];

export type SubtableRowFilter = (row: RelatedSubtableRow) => boolean;

export type SubtableRelatedQueryCondition = {
  fieldCode: string;
  fieldType: kintoneAPI.FieldPropertyType;
  type: RelatedQueryConditionType;
  matchingValues: string[];
};

export type FlatTableRow = {
  id: string;
  groupKey: string;
  record: RelatedRecord;
  recordIndex: number;
  subtableRow?: RelatedSubtableRow;
  subtableRowIndex: number;
  searchText: string;
};

export type FieldAggregationSource = 'record' | 'subtable';

export type FieldAggregationOperation = 'sum' | 'average' | 'max' | 'min';

export type TableColumnKey = `${FieldAggregationSource}:${string}`;

export type TableFieldColumn = {
  key: TableColumnKey;
  fieldCode: string;
  label: string;
  source: FieldAggregationSource;
};

export type ColumnFilterState = {
  keyword?: string;
  selectedValues?: string[];
};

export type ColumnFilterOption = {
  value: string;
  label: string;
  count: number;
};

export type FieldAggregation = {
  key: string;
  fieldCode: string;
  label: string;
  source: FieldAggregationSource;
  operation: FieldAggregationOperation;
  value: number;
  formattedValue: string;
  count: number;
};

type AggregatableField = Pick<kintoneAPI.FieldProperty, 'code' | 'label' | 'type'>;

const AGGREGATABLE_FIELD_TYPES = new Set<kintoneAPI.FieldPropertyType>(['CALC', 'NUMBER']);

export const FIELD_AGGREGATION_OPERATIONS: FieldAggregationOperation[] = [
  'sum',
  'average',
  'max',
  'min',
];

export const FIELD_AGGREGATION_OPERATION_LABELS: Record<FieldAggregationOperation, string> = {
  sum: '合計',
  average: '平均',
  max: '最大',
  min: '最小',
};

const EMPTY_FILTER_VALUE_LABEL = '（空白）';

export const formatTableField = (field: kintoneAPI.Field | undefined) => {
  if (!field) {
    return '';
  }
  return getFieldValueAsString(field, { separator: ', ' });
};

export const resolveRelatedRecordFields = (
  fields: kintoneAPI.FieldProperties,
  condition: PluginCondition
) => {
  return condition.relatedRecordFieldCodes
    .map((fieldCode) => fields[fieldCode])
    .filter((field): field is kintoneAPI.FieldProperty => !!field && field.type !== 'SUBTABLE');
};

export const resolveSubtableFields = (
  fields: kintoneAPI.FieldProperties,
  condition: PluginCondition
) => {
  const subtable = fields[condition.relatedSubtableCode];
  if (!subtable || subtable.type !== 'SUBTABLE') {
    return [];
  }
  return condition.subtableFieldCodes
    .map((fieldCode) => subtable.fields[fieldCode])
    .filter((field): field is kintoneAPI.property.InSubtable => !!field);
};

export const normalizeSearchText = (value: string) => {
  return value.normalize('NFKC').toLocaleLowerCase('ja').trim();
};

const createSearchText = (values: string[]) => {
  return normalizeSearchText(values.filter(Boolean).join('\n'));
};

const getSearchWords = (searchText: string) => {
  return normalizeSearchText(searchText).split(/\s+/g).filter(Boolean);
};

export const createTableColumnKey = (
  source: FieldAggregationSource,
  fieldCode: string
): TableColumnKey => {
  return `${source}:${fieldCode}`;
};

export const createTableFieldColumns = (params: {
  relatedRecordFields: kintoneAPI.FieldProperty[];
  subtableFields: kintoneAPI.property.InSubtable[];
}): TableFieldColumn[] => {
  const relatedRecordColumns = params.relatedRecordFields.map((field) => ({
    key: createTableColumnKey('record', field.code),
    fieldCode: field.code,
    label: field.label,
    source: 'record' as const,
  }));
  const subtableColumns = params.subtableFields.map((field) => ({
    key: createTableColumnKey('subtable', field.code),
    fieldCode: field.code,
    label: field.label,
    source: 'subtable' as const,
  }));

  return [...relatedRecordColumns, ...subtableColumns];
};

const parseTableColumnKey = (key: TableColumnKey) => {
  const separatorIndex = key.indexOf(':');
  const sourceText = key.slice(0, separatorIndex);
  const fieldCode = key.slice(separatorIndex + 1);

  if ((sourceText !== 'record' && sourceText !== 'subtable') || !fieldCode) {
    return null;
  }

  const source: FieldAggregationSource = sourceText;
  return { source, fieldCode };
};

export const getFlatTableRowField = (
  row: FlatTableRow,
  column: Pick<TableFieldColumn, 'source' | 'fieldCode'>
) => {
  return column.source === 'record'
    ? row.record[column.fieldCode]
    : row.subtableRow?.value[column.fieldCode];
};

export const getFlatTableRowDisplayValue = (
  row: FlatTableRow,
  column: Pick<TableFieldColumn, 'source' | 'fieldCode'>
) => {
  return formatTableField(getFlatTableRowField(row, column));
};

const getRecordGroupKey = (record: RelatedRecord, recordIndex: number) => {
  const recordId = record.$id?.value;
  return `record-${recordId || recordIndex}`;
};

const toFiniteNumber = (field: kintoneAPI.Field | undefined) => {
  const value = field?.value;
  if (
    value === null ||
    value === undefined ||
    value === '' ||
    Array.isArray(value) ||
    typeof value === 'object'
  ) {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const calculateAggregationValue = (values: number[], operation: FieldAggregationOperation) => {
  if (!values.length) {
    return 0;
  }

  switch (operation) {
    case 'average':
      return values.reduce((total, current) => total + current, 0) / values.length;
    case 'max':
      return Math.max(...values);
    case 'min':
      return Math.min(...values);
    case 'sum':
      return values.reduce((total, current) => total + current, 0);
    default:
      return 0;
  }
};

const normalizeAggregationDecimalDigits = (digits: number | undefined) => {
  if (typeof digits !== 'number' || !Number.isFinite(digits)) {
    return DEFAULT_AGGREGATION_DECIMAL_DIGITS;
  }
  return Math.min(
    MAX_AGGREGATION_DECIMAL_DIGITS,
    Math.max(MIN_AGGREGATION_DECIMAL_DIGITS, Math.trunc(digits))
  );
};

const roundAggregationValue = (params: {
  value: number;
  roundingMode: AggregationRoundingMode;
  decimalDigits: number;
}) => {
  const factor = 10 ** params.decimalDigits;
  const scaledValue = params.value * factor;

  switch (params.roundingMode) {
    case 'ceil':
      return Math.ceil(scaledValue) / factor;
    case 'floor':
      return Math.floor(scaledValue) / factor;
    case 'round':
      return Math.round(scaledValue) / factor;
    default:
      return params.value;
  }
};

const formatAggregationValue = (value: number, decimalDigits: number) => {
  return new Intl.NumberFormat('ja-JP', {
    maximumFractionDigits: decimalDigits,
  }).format(value);
};

const createFieldAggregation = (params: {
  field: AggregatableField;
  source: FieldAggregationSource;
  operation: FieldAggregationOperation;
  roundingMode: AggregationRoundingMode;
  decimalDigits: number;
  rows: FlatTableRow[];
  getField: (row: FlatTableRow) => kintoneAPI.Field | undefined;
}): FieldAggregation => {
  const values = params.rows
    .map((row) => toFiniteNumber(params.getField(row)))
    .filter((value): value is number => value !== null);
  const decimalDigits = normalizeAggregationDecimalDigits(params.decimalDigits);
  const value = roundAggregationValue({
    value: calculateAggregationValue(values, params.operation),
    roundingMode: params.roundingMode,
    decimalDigits,
  });

  return {
    key: `${params.source}:${params.field.code}`,
    fieldCode: params.field.code,
    label: params.field.label,
    source: params.source,
    operation: params.operation,
    value,
    formattedValue: formatAggregationValue(value, decimalDigits),
    count: values.length,
  };
};

export const shouldMergeRelatedRecordFields = (condition: PluginCondition) => {
  return condition.mergeRelatedRecordFields !== false;
};

export const isAggregatableField = (field: AggregatableField) => {
  return AGGREGATABLE_FIELD_TYPES.has(field.type);
};

export const calculateFieldAggregations = (params: {
  rows: FlatTableRow[];
  relatedRecordFields: kintoneAPI.FieldProperty[];
  subtableFields: kintoneAPI.property.InSubtable[];
  operation?: FieldAggregationOperation;
  roundingMode?: AggregationRoundingMode;
  decimalDigits?: number;
}): FieldAggregation[] => {
  const { rows, relatedRecordFields, subtableFields } = params;
  const operation = params.operation ?? 'sum';
  const roundingMode = params.roundingMode ?? DEFAULT_AGGREGATION_ROUNDING_MODE;
  const decimalDigits = normalizeAggregationDecimalDigits(params.decimalDigits);
  if (!rows.length) {
    return [];
  }

  const uniqueRecordRows = Array.from(
    rows.reduce((rowByGroup, row) => {
      if (rowByGroup.has(row.groupKey)) {
        return rowByGroup;
      }
      return new Map(rowByGroup).set(row.groupKey, row);
    }, new Map<string, FlatTableRow>())
  ).map(([, row]) => row);

  const relatedRecordAggregations = relatedRecordFields.filter(isAggregatableField).map((field) =>
    createFieldAggregation({
      field,
      source: 'record',
      operation,
      roundingMode,
      decimalDigits,
      rows: uniqueRecordRows,
      getField: (row) => row.record[field.code],
    })
  );
  const subtableAggregations = subtableFields.filter(isAggregatableField).map((field) =>
    createFieldAggregation({
      field,
      source: 'subtable',
      operation,
      roundingMode,
      decimalDigits,
      rows,
      getField: (row) => row.subtableRow?.value[field.code],
    })
  );

  return [...relatedRecordAggregations, ...subtableAggregations];
};

export const isColumnFilterActive = (filter: ColumnFilterState | undefined) => {
  if (!filter) {
    return false;
  }
  return !!normalizeSearchText(filter.keyword ?? '') || filter.selectedValues !== undefined;
};

const matchesColumnFilter = (row: FlatTableRow, key: TableColumnKey, filter: ColumnFilterState) => {
  const column = parseTableColumnKey(key);
  if (!column) {
    return true;
  }

  const displayValue = getFlatTableRowDisplayValue(row, column);
  const keywordWords = getSearchWords(filter.keyword ?? '');
  const matchesKeyword = keywordWords.every((word) =>
    normalizeSearchText(displayValue).includes(word)
  );
  const selectedValues = filter.selectedValues;
  const matchesSelectedValues =
    selectedValues === undefined || selectedValues.includes(displayValue);

  return matchesKeyword && matchesSelectedValues;
};

const matchesColumnFilters = (
  row: FlatTableRow,
  columnFilters: ReadonlyMap<TableColumnKey, ColumnFilterState>
) => {
  return Array.from(columnFilters.entries()).every(([key, filter]) => {
    if (!isColumnFilterActive(filter)) {
      return true;
    }
    return matchesColumnFilter(row, key, filter);
  });
};

export const createSubtableMatchingRowFilter = (params: {
  fieldCode: string;
  fieldType?: kintoneAPI.FieldPropertyType;
  matchingValues: string[];
}): SubtableRowFilter => {
  return createSubtableRelatedQueryConditionsRowFilter({
    conditions: [
      {
        fieldCode: params.fieldCode,
        fieldType: params.fieldType ?? 'SINGLE_LINE_TEXT',
        type: 'equal',
        matchingValues: params.matchingValues,
      },
    ],
  });
};

const toNumber = (value: string) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const toDateValue = (value: string, fieldType: kintoneAPI.FieldPropertyType) => {
  if (fieldType === 'TIME') {
    const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(value);
    if (!match) {
      return null;
    }
    const [, hours, minutes, seconds = '0'] = match;
    return Number(hours) * 60 * 60 + Number(minutes) * 60 + Number(seconds);
  }

  const time = Date.parse(value);
  return Number.isNaN(time) ? null : time;
};

const compareOrderedValues = (params: {
  rowValues: string[];
  matchingValues: string[];
  fieldType: kintoneAPI.FieldPropertyType;
  compare: (rowValue: number, matchingValue: number) => boolean;
}) => {
  const toComparableValue = isDateFieldType(params.fieldType)
    ? (value: string) => toDateValue(value, params.fieldType)
    : toNumber;

  return params.rowValues.some((rowValue) => {
    const comparableRowValue = toComparableValue(rowValue);
    if (comparableRowValue === null) {
      return false;
    }
    return params.matchingValues.some((matchingValue) => {
      const comparableMatchingValue = toComparableValue(matchingValue);
      return (
        comparableMatchingValue !== null &&
        params.compare(comparableRowValue, comparableMatchingValue)
      );
    });
  });
};

const matchesSubtableRelatedQueryCondition = (
  row: RelatedSubtableRow,
  condition: SubtableRelatedQueryCondition
) => {
  const matchingValues = condition.matchingValues.filter(Boolean);
  if (!matchingValues.length) {
    return true;
  }

  const rowValues = extractComparableValues(row.value[condition.fieldCode]?.value);
  const matchingValueSet = new Set(matchingValues);

  switch (condition.type) {
    case 'equal':
      return rowValues.some((value) => matchingValueSet.has(value));
    case 'notEqual':
      return rowValues.every((value) => !matchingValueSet.has(value));
    case 'include':
      return rowValues.some((value) =>
        matchingValues.some((matchingValue) => value.includes(matchingValue))
      );
    case 'exclude':
      return rowValues.every((value) =>
        matchingValues.every((matchingValue) => !value.includes(matchingValue))
      );
    case 'greater':
    case 'dateAfter':
      return compareOrderedValues({
        rowValues,
        matchingValues,
        fieldType: condition.fieldType,
        compare: (rowValue, matchingValue) => rowValue > matchingValue,
      });
    case 'greaterOrEqual':
    case 'dateAfterOrEqual':
      return compareOrderedValues({
        rowValues,
        matchingValues,
        fieldType: condition.fieldType,
        compare: (rowValue, matchingValue) => rowValue >= matchingValue,
      });
    case 'less':
    case 'dateBefore':
      return compareOrderedValues({
        rowValues,
        matchingValues,
        fieldType: condition.fieldType,
        compare: (rowValue, matchingValue) => rowValue < matchingValue,
      });
    case 'lessOrEqual':
    case 'dateBeforeOrEqual':
      return compareOrderedValues({
        rowValues,
        matchingValues,
        fieldType: condition.fieldType,
        compare: (rowValue, matchingValue) => rowValue <= matchingValue,
      });
    default:
      return true;
  }
};

export const createSubtableRelatedQueryConditionsRowFilter = (params: {
  conditions: SubtableRelatedQueryCondition[];
}): SubtableRowFilter => {
  const conditions = params.conditions.filter((condition) =>
    condition.matchingValues.some(Boolean)
  );
  return (row) => {
    if (!conditions.length) {
      return false;
    }
    return conditions.every((condition) => matchesSubtableRelatedQueryCondition(row, condition));
  };
};

export const buildFlatTableRows = (params: {
  records: RelatedRecord[];
  condition: PluginCondition;
  relatedRecordFields: kintoneAPI.FieldProperty[];
  subtableFields: kintoneAPI.property.InSubtable[];
  subtableRowFilter?: SubtableRowFilter;
  recordIndexOffset?: number;
}): FlatTableRow[] => {
  const {
    records,
    condition,
    relatedRecordFields,
    subtableFields,
    subtableRowFilter,
    recordIndexOffset = 0,
  } = params;

  return records.flatMap((record, recordIndex) => {
    const actualRecordIndex = recordIndexOffset + recordIndex;
    const groupKey = getRecordGroupKey(record, actualRecordIndex);
    const relatedRecordSearchValues = relatedRecordFields.map((field) =>
      formatTableField(record[field.code])
    );

    if (!condition.relatedSubtableCode || !subtableFields.length) {
      return {
        id: groupKey,
        groupKey,
        record,
        recordIndex: actualRecordIndex,
        subtableRowIndex: 0,
        searchText: createSearchText(relatedRecordSearchValues),
      };
    }

    const subtable = record[condition.relatedSubtableCode] as kintoneAPI.field.Subtable | undefined;
    const subtableRows = subtable?.value ?? [];

    return subtableRows
      .map((subtableRow, subtableRowIndex) => ({ subtableRow, subtableRowIndex }))
      .filter(({ subtableRow }) => subtableRowFilter?.(subtableRow) ?? true)
      .map(({ subtableRow, subtableRowIndex }) => {
        const subtableSearchValues = subtableFields.map((field) =>
          formatTableField(subtableRow.value[field.code])
        );

        return {
          id: `${groupKey}-${subtableRow.id || subtableRowIndex}`,
          groupKey,
          record,
          recordIndex: actualRecordIndex,
          subtableRow,
          subtableRowIndex,
          searchText: createSearchText([...relatedRecordSearchValues, ...subtableSearchValues]),
        };
      });
  });
};

export const filterFlatTableRows = (
  rows: FlatTableRow[],
  searchText: string,
  columnFilters: ReadonlyMap<TableColumnKey, ColumnFilterState> = new Map()
) => {
  const words = getSearchWords(searchText);
  if (!words.length && !Array.from(columnFilters.values()).some(isColumnFilterActive)) {
    return rows;
  }
  return rows.filter(
    (row) =>
      words.every((word) => row.searchText.includes(word)) &&
      matchesColumnFilters(row, columnFilters)
  );
};

export const extractColumnFilterOptions = (
  rows: FlatTableRow[],
  column: Pick<TableFieldColumn, 'source' | 'fieldCode' | 'key'>
): ColumnFilterOption[] => {
  const optionByValue = rows.reduce((currentOptions, row) => {
    const value = getFlatTableRowDisplayValue(row, column);
    const label = value || EMPTY_FILTER_VALUE_LABEL;
    const previousOption = currentOptions.get(value);
    return new Map(currentOptions).set(value, {
      value,
      label,
      count: (previousOption?.count ?? 0) + 1,
    });
  }, new Map<string, ColumnFilterOption>());

  return Array.from(optionByValue.values()).sort((left, right) =>
    left.label.localeCompare(right.label, 'ja', { numeric: true })
  );
};

export const getRowSpanByGroup = (rows: FlatTableRow[]) => {
  return rows.reduce((rowSpanByGroup, row) => {
    const next = new Map(rowSpanByGroup);
    next.set(row.groupKey, (rowSpanByGroup.get(row.groupKey) ?? 0) + 1);
    return next;
  }, new Map<string, number>());
};

const getOrderedGroupKeys = (rows: FlatTableRow[]) => {
  return Array.from(
    rows
      .reduce((groupKeys, row) => {
        if (groupKeys.has(row.groupKey)) {
          return groupKeys;
        }
        return new Map(groupKeys).set(row.groupKey, true);
      }, new Map<string, true>())
      .keys()
  );
};

export const getFlatTableRowGroupCount = (rows: FlatTableRow[]) => {
  return getOrderedGroupKeys(rows).length;
};

export const paginateFlatTableRowsByRecord = (params: {
  rows: FlatTableRow[];
  page: number;
  recordsPerPage: number;
}) => {
  const recordsPerPage = Math.max(1, Math.trunc(params.recordsPerPage));
  const page = Math.max(1, Math.trunc(params.page));
  const startIndex = (page - 1) * recordsPerPage;
  const pageGroupKeys = new Set(
    getOrderedGroupKeys(params.rows).slice(startIndex, startIndex + recordsPerPage)
  );
  return params.rows.filter((row) => pageGroupKeys.has(row.groupKey));
};

export const isFirstVisibleRowInGroup = (rows: FlatTableRow[], index: number) => {
  return rows[index - 1]?.groupKey !== rows[index]?.groupKey;
};

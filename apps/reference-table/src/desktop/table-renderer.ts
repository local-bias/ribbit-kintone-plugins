import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import { getRecordUrl } from '@/lib/kintone';
import { createDocumentIconElement, createFilterIconElement } from './icons';
import {
  createTableColumnKey,
  createTableFieldColumns,
  FIELD_AGGREGATION_OPERATION_LABELS,
  FIELD_AGGREGATION_OPERATIONS,
  type FieldAggregation,
  type FieldAggregationOperation,
  type FlatTableRow,
  formatTableField,
  getRowSpanByGroup,
  isAggregatableField,
  isFirstVisibleRowInGroup,
  type TableColumnKey,
  type TableFieldColumn,
} from './table';

const ROOT_CLASS = 'ribbit-related-subtable';

export const DETAIL_COLUMN_LENGTH = 1;

const createElement = <K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  options: {
    className?: string;
    text?: string;
  } = {}
) => {
  const element = document.createElement(tagName);
  if (options.className) {
    element.className = options.className;
  }
  if (options.text) {
    element.textContent = options.text;
  }
  return element;
};

const createFilterButton = (params: {
  column: TableFieldColumn;
  isActive: boolean;
  onClick: (column: TableFieldColumn, anchor: HTMLButtonElement) => void;
}) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `${ROOT_CLASS}__filter-button`;
  button.dataset.active = params.isActive ? 'true' : 'false';
  button.title = `${params.column.label}を絞り込み`;
  button.setAttribute('aria-label', `${params.column.label}を絞り込み`);
  button.append(createFilterIconElement());
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    params.onClick(params.column, button);
  });
  return button;
};

const createTableDataCell = (params: {
  field: kintoneAPI.FieldProperty | kintoneAPI.property.InSubtable;
  className?: string;
  text: string;
}) => {
  const classNames = [
    params.className,
    isAggregatableField(params.field) ? `${ROOT_CLASS}__numeric-cell` : undefined,
  ].filter(Boolean);
  return createElement('td', {
    className: classNames.join(' ') || undefined,
    text: params.text,
  });
};

export const renderTableHead = (params: {
  thead: HTMLTableSectionElement;
  relatedRecordFields: kintoneAPI.FieldProperty[];
  subtableFields: kintoneAPI.property.InSubtable[];
  isColumnFilterActive: (columnKey: TableColumnKey) => boolean;
  onFilterClick: (column: TableFieldColumn, anchor: HTMLButtonElement) => void;
}) => {
  const { thead, relatedRecordFields, subtableFields } = params;
  const columns = createTableFieldColumns({ relatedRecordFields, subtableFields });
  const headerRow = document.createElement('tr');

  const detailHeading = createElement('th', { className: `${ROOT_CLASS}__detail-heading` });
  detailHeading.append(
    createElement('span', { className: `${ROOT_CLASS}__visually-hidden`, text: 'レコード詳細' })
  );
  headerRow.append(detailHeading);

  for (const column of columns) {
    const heading = createElement('th', {
      className: column.source === 'record' ? `${ROOT_CLASS}__record-heading` : undefined,
    });
    const content = createElement('div', { className: `${ROOT_CLASS}__heading-cell` });
    const label = createElement('span', {
      className: `${ROOT_CLASS}__heading-label`,
      text: column.label,
    });
    content.append(
      label,
      createFilterButton({
        column,
        isActive: params.isColumnFilterActive(column.key),
        onClick: params.onFilterClick,
      })
    );
    heading.append(content);
    headerRow.append(heading);
  }

  thead.replaceChildren(headerRow);
};

export const createEmptyTableRow = (columnLength: number, message: string) => {
  const row = document.createElement('tr');
  const cell = createElement('td', { className: `${ROOT_CLASS}__table-empty`, text: message });
  cell.colSpan = Math.max(columnLength, 1);
  row.append(cell);
  return row;
};

const createRecordLinkCell = (params: {
  row: FlatTableRow;
  relatedAppId: string;
  rowSpan?: number;
}) => {
  const cell = createElement('td', { className: `${ROOT_CLASS}__detail-cell` });
  if (params.rowSpan) {
    cell.rowSpan = params.rowSpan;
  }

  const recordId = params.row.record.$id?.value;
  if (!recordId) {
    cell.textContent = '-';
    return cell;
  }

  const link = document.createElement('a');
  link.className = `${ROOT_CLASS}__record-link`;
  link.href = getRecordUrl(params.relatedAppId, recordId);
  link.title = 'レコード詳細';
  link.setAttribute('aria-label', `レコード詳細を開く（レコードID: ${recordId}）`);
  link.append(createDocumentIconElement());
  cell.append(link);

  return cell;
};

const createAggregationTableRow = (params: {
  relatedRecordFields: kintoneAPI.FieldProperty[];
  subtableFields: kintoneAPI.property.InSubtable[];
  aggregations: FieldAggregation[];
  operation: FieldAggregationOperation;
  onOperationChange: (operation: FieldAggregationOperation) => void;
}) => {
  if (!params.aggregations.length) {
    return null;
  }

  const row = document.createElement('tr');
  row.className = `${ROOT_CLASS}__aggregation-row`;
  const aggregationByKey = new Map(
    params.aggregations.map((aggregation) => [aggregation.key, aggregation])
  );
  const controlCell = createElement('td', { className: `${ROOT_CLASS}__aggregation-control-cell` });
  const select = document.createElement('select');
  select.className = `${ROOT_CLASS}__aggregation-select`;
  select.setAttribute('aria-label', '集計方法');
  for (const operation of FIELD_AGGREGATION_OPERATIONS) {
    const option = document.createElement('option');
    option.value = operation;
    option.textContent = FIELD_AGGREGATION_OPERATION_LABELS[operation];
    select.append(option);
  }
  select.value = params.operation;
  select.addEventListener('change', () => {
    params.onOperationChange(select.value as FieldAggregationOperation);
  });
  controlCell.append(select);
  row.append(controlCell);

  const appendAggregationCell = (
    source: 'record' | 'subtable',
    field: kintoneAPI.FieldProperty | kintoneAPI.property.InSubtable
  ) => {
    const aggregation = aggregationByKey.get(createTableColumnKey(source, field.code));
    const cell = createElement('td', {
      className: `${ROOT_CLASS}__aggregation-cell${source === 'record' ? ` ${ROOT_CLASS}__record-cell` : ''}`,
      text: aggregation?.formattedValue || '-',
    });
    cell.dataset.empty = aggregation ? 'false' : 'true';
    row.append(cell);
  };

  for (const field of params.relatedRecordFields) {
    appendAggregationCell('record', field);
  }
  for (const field of params.subtableFields) {
    appendAggregationCell('subtable', field);
  }

  return row;
};

export const renderTableBody = (params: {
  tbody: HTMLTableSectionElement;
  rows: FlatTableRow[];
  relatedAppId: string;
  relatedRecordFields: kintoneAPI.FieldProperty[];
  subtableFields: kintoneAPI.property.InSubtable[];
  mergeRelatedRecordFields: boolean;
  aggregations: FieldAggregation[];
  aggregationOperation: FieldAggregationOperation;
  onAggregationOperationChange: (operation: FieldAggregationOperation) => void;
}) => {
  const {
    tbody,
    rows,
    relatedAppId,
    relatedRecordFields,
    subtableFields,
    mergeRelatedRecordFields,
    aggregations,
    aggregationOperation,
    onAggregationOperationChange,
  } = params;
  const columnLength = DETAIL_COLUMN_LENGTH + relatedRecordFields.length + subtableFields.length;

  if (!rows.length) {
    tbody.replaceChildren(createEmptyTableRow(columnLength, '検索条件に一致する行はありません。'));
    return;
  }

  const rowSpanByGroup = mergeRelatedRecordFields
    ? getRowSpanByGroup(rows)
    : new Map<string, number>();
  const tableRows = rows.map((row, index) => {
    const tableRow = document.createElement('tr');
    const isFirstRowInGroup = !mergeRelatedRecordFields || isFirstVisibleRowInGroup(rows, index);

    if (isFirstRowInGroup) {
      tableRow.append(
        createRecordLinkCell({
          row,
          relatedAppId,
          rowSpan: mergeRelatedRecordFields ? (rowSpanByGroup.get(row.groupKey) ?? 1) : undefined,
        })
      );
    }

    if (relatedRecordFields.length && isFirstRowInGroup) {
      for (const field of relatedRecordFields) {
        const cell = createTableDataCell({
          field,
          className: `${ROOT_CLASS}__record-cell`,
          text: formatTableField(row.record[field.code]) || '-',
        });
        if (mergeRelatedRecordFields) {
          cell.rowSpan = rowSpanByGroup.get(row.groupKey) ?? 1;
        }
        tableRow.append(cell);
      }
    }

    for (const field of subtableFields) {
      tableRow.append(
        createTableDataCell({
          field,
          text: formatTableField(row.subtableRow?.value[field.code]) || '-',
        })
      );
    }

    return tableRow;
  });

  const aggregationRow = createAggregationTableRow({
    relatedRecordFields,
    subtableFields,
    aggregations,
    operation: aggregationOperation,
    onOperationChange: onAggregationOperationChange,
  });

  tbody.replaceChildren(...(aggregationRow ? [aggregationRow] : []), ...tableRows);
};

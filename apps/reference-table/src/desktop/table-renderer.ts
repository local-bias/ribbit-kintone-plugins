import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import { getRecordUrl } from '@/lib/kintone';
import type { FileLoadRequest } from './file-loader';
import {
  createDocumentIconElement,
  createDownloadIconElement,
  createFilterIconElement,
  createSortAscIconElement,
  createSortDescIconElement,
  createSortNoneIconElement,
} from './icons';
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
  type SortDirection,
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

const createSortButton = (params: {
  column: TableFieldColumn;
  sortDirection: SortDirection | null;
  onClick: (column: TableFieldColumn) => void;
}) => {
  const { column, sortDirection } = params;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `${ROOT_CLASS}__sort-button`;
  button.dataset.active = sortDirection ? 'true' : 'false';
  button.dataset.direction = sortDirection ?? '';

  const label =
    sortDirection === 'asc'
      ? `${column.label}を降順でソート`
      : sortDirection === 'desc'
        ? `${column.label}のソートを解除`
        : `${column.label}を昇順でソート`;
  button.title = label;
  button.setAttribute('aria-label', label);

  if (sortDirection === 'asc') {
    button.append(createSortAscIconElement());
  } else if (sortDirection === 'desc') {
    button.append(createSortDescIconElement());
  } else {
    button.append(createSortNoneIconElement());
  }

  button.addEventListener('click', (event) => {
    event.stopPropagation();
    params.onClick(column);
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

  const cell = document.createElement('td');
  const joinedClass = classNames.join(' ');
  if (joinedClass) {
    cell.className = joinedClass;
  }

  if (params.field.type === 'RICH_TEXT') {
    const wrapper = document.createElement('div');
    wrapper.className = `${ROOT_CLASS}__rich-text`;
    wrapper.innerHTML = params.text;
    cell.append(wrapper);
  } else {
    cell.textContent = params.text;
  }

  return cell;
};

export const renderTableHead = (params: {
  thead: HTMLTableSectionElement;
  relatedRecordFields: kintoneAPI.FieldProperty[];
  subtableFields: kintoneAPI.property.InSubtable[];
  isColumnFilterActive: (columnKey: TableColumnKey) => boolean;
  onFilterClick: (column: TableFieldColumn, anchor: HTMLButtonElement) => void;
  getColumnSortDirection: (columnKey: TableColumnKey) => SortDirection | null;
  onSortClick: (column: TableFieldColumn) => void;
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
      createSortButton({
        column,
        sortDirection: params.getColumnSortDirection(column.key),
        onClick: params.onSortClick,
      }),
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
  relatedAppGuestSpaceId?: string;
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
  link.href = getRecordUrl(params.relatedAppId, recordId, params.relatedAppGuestSpaceId);
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

type KintoneFileItem = { fileKey: string; name: string; contentType: string };

const getFileItems = (fieldValue: kintoneAPI.Field | undefined): KintoneFileItem[] => {
  if (!fieldValue || fieldValue.type !== 'FILE') return [];
  const value = (fieldValue as { type: 'FILE'; value: KintoneFileItem[] }).value;
  return Array.isArray(value) ? value : [];
};

const createFileCell = (params: {
  files: KintoneFileItem[];
  className?: string;
  onFileLoad?: (request: FileLoadRequest) => void;
}) => {
  const { files, className, onFileLoad } = params;
  const cell = document.createElement('td');
  if (className) cell.className = className;

  if (!files.length) {
    cell.textContent = '-';
    return cell;
  }

  const list = document.createElement('ul');
  list.className = `${ROOT_CLASS}__file-list`;

  for (const file of files) {
    const item = document.createElement('li');
    item.className = `${ROOT_CLASS}__file-item`;

    const isImage = /^image\//i.test(file.contentType);

    // ダウンロードリンク（blob URL が確定してから href を設定する）
    const downloadLink = document.createElement('a');
    downloadLink.className = `${ROOT_CLASS}__file-download-link`;
    downloadLink.setAttribute('aria-label', `${file.name}をダウンロード`);
    downloadLink.append(createDownloadIconElement());
    const nameSpan = document.createElement('span');
    nameSpan.className = `${ROOT_CLASS}__file-name`;
    nameSpan.textContent = file.name;
    downloadLink.append(nameSpan);

    if (isImage && onFileLoad) {
      const previewLink = document.createElement('a');
      previewLink.className = `${ROOT_CLASS}__file-preview-link`;
      previewLink.setAttribute('aria-label', `${file.name}をダウンロード`);

      const img = document.createElement('img');
      img.className = `${ROOT_CLASS}__file-preview-img`;
      img.alt = file.name;
      img.hidden = true;

      onFileLoad({
        fileKey: file.fileKey,
        onLoad: (blobUrl) => {
          img.src = blobUrl;
          img.hidden = false;
          previewLink.href = blobUrl;
          previewLink.download = file.name;
          downloadLink.href = blobUrl;
          downloadLink.download = file.name;
        },
      });

      previewLink.append(img);
      item.append(previewLink);
    } else if (onFileLoad) {
      onFileLoad({
        fileKey: file.fileKey,
        onLoad: (blobUrl) => {
          downloadLink.href = blobUrl;
          downloadLink.download = file.name;
        },
      });
    }

    item.append(downloadLink);
    list.append(item);
  }

  cell.append(list);
  return cell;
};

export const renderTableBody = (params: {
  tbody: HTMLTableSectionElement;
  rows: FlatTableRow[];
  relatedAppId: string;
  relatedAppGuestSpaceId?: string;
  relatedRecordFields: kintoneAPI.FieldProperty[];
  subtableFields: kintoneAPI.property.InSubtable[];
  mergeRelatedRecordFields: boolean;
  aggregations: FieldAggregation[];
  aggregationOperation: FieldAggregationOperation;
  onAggregationOperationChange: (operation: FieldAggregationOperation) => void;
  onFileLoad?: (request: FileLoadRequest) => void;
}) => {
  const {
    tbody,
    rows,
    relatedAppId,
    relatedAppGuestSpaceId,
    relatedRecordFields,
    subtableFields,
    mergeRelatedRecordFields,
    aggregations,
    aggregationOperation,
    onAggregationOperationChange,
    onFileLoad,
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
          relatedAppGuestSpaceId,
          rowSpan: mergeRelatedRecordFields ? (rowSpanByGroup.get(row.groupKey) ?? 1) : undefined,
        })
      );
    }

    if (relatedRecordFields.length && isFirstRowInGroup) {
      for (const field of relatedRecordFields) {
        let cell: HTMLTableCellElement;
        if (field.type === 'FILE') {
          cell = createFileCell({
            files: getFileItems(row.record[field.code]),
            className: `${ROOT_CLASS}__record-cell`,
            onFileLoad,
          });
        } else {
          cell = createTableDataCell({
            field,
            className: `${ROOT_CLASS}__record-cell`,
            text: formatTableField(row.record[field.code]) || '-',
          });
        }
        if (mergeRelatedRecordFields) {
          cell.rowSpan = rowSpanByGroup.get(row.groupKey) ?? 1;
        }
        tableRow.append(cell);
      }
    }

    for (const field of subtableFields) {
      if (field.type === 'FILE') {
        tableRow.append(
          createFileCell({
            files: getFileItems(row.subtableRow?.value[field.code]),
            onFileLoad,
          })
        );
      } else {
        tableRow.append(
          createTableDataCell({
            field,
            text: formatTableField(row.subtableRow?.value[field.code]) || '-',
          })
        );
      }
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

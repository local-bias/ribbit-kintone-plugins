import {
  getAllApps,
  getAllRecords,
  getApp,
  getFormFields,
  getSpaceElement,
  isGuestSpace,
  type kintoneAPI,
} from '@konomi-app/kintone-utilities';
import { buildConditionQuery } from '@konomi-app/kintone-utilities-react';
import { store } from '@repo/jotai';
import { manager } from '@/lib/event-manager';
import { isDev } from '@/lib/global';
import { createRelatedRecordsQueryFromConditions, extractComparableValues } from '@/lib/kintone';
import {
  getFallbackRelatedQueryConditionType,
  isRelatedQueryConditionTypeAllowedForField,
} from '@/lib/related-query-condition';
import {
  DEFAULT_RECORDS_PER_PAGE,
  MAX_RECORDS_PER_PAGE,
  MIN_RECORDS_PER_PAGE,
  type PluginCondition,
} from '@/schema/plugin-config';
import { exportFlatTableRowsAsCsv } from './csv-export';
import { type FileLoadRequest, loadFilesBatch } from './file-loader';
import {
  createColumnFilterPopover,
  positionFilterPopover,
  trapFocusWithin,
} from './filter-popover';
import { createDownloadIconElement, createRefreshIconElement } from './icons';
import { validPluginConditionsAtom } from './public-state';
import {
  clearCachedRecords,
  createRecordCacheKey,
  getCachedRecords,
  setCachedRecords,
} from './record-cache';
import {
  buildFlatTableRows,
  type ColumnFilterState,
  type ColumnSortState,
  calculateFieldAggregations,
  createSubtableRelatedQueryConditionsRowFilter,
  createTableFieldColumns,
  type FieldAggregationOperation,
  type FlatTableRow,
  filterFlatTableRows,
  getFlatTableRowGroupCount,
  isColumnFilterActive,
  paginateFlatTableRowsByRecord,
  type RelatedRecord,
  resolveRelatedRecordFields,
  resolveSubtableFields,
  type SortDirection,
  type SubtableRowFilter,
  shouldMergeRelatedRecordFields,
  sortFlatTableRows,
  type TableColumnKey,
  type TableFieldColumn,
} from './table';
import {
  createEmptyTableRow,
  DETAIL_COLUMN_LENGTH,
  renderTableBody,
  renderTableHead,
} from './table-renderer';

const ROOT_CLASS = 'ribbit-related-subtable';

const requestIdByConditionId = new Map<string, number>();
const disposeConditionUiById = new Map<string, () => void>();

const disposeConditionUi = (conditionId: string) => {
  disposeConditionUiById.get(conditionId)?.();
  disposeConditionUiById.delete(conditionId);
};

const createConditionRequestScope = (conditionId: string) => {
  const requestId = (requestIdByConditionId.get(conditionId) ?? 0) + 1;
  requestIdByConditionId.set(conditionId, requestId);

  return {
    isCurrent: () => requestIdByConditionId.get(conditionId) === requestId,
  };
};

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

const renderMessage = (root: HTMLElement, message: string, tone: 'info' | 'error' = 'info') => {
  const element = createElement('div', {
    className: `${ROOT_CLASS}__message ${ROOT_CLASS}__message--${tone}`,
    text: message,
  });
  root.replaceChildren(element);
};

const logClientError = (label: string, error: unknown) => {
  if (isDev) {
    console.error(label, error);
    return;
  }
  console.error(label, error instanceof Error ? error.message : 'Unknown error');
};

const updateCount = (params: {
  count: HTMLElement;
  recordsLength: number;
  totalRowsLength: number;
  visibleRecordsLength: number;
  visibleRowsLength: number;
  searchText: string;
  hasActiveColumnFilters: boolean;
  hasSubtableColumns: boolean;
  isComplete?: boolean;
}) => {
  const {
    count,
    recordsLength,
    totalRowsLength,
    visibleRecordsLength,
    visibleRowsLength,
    searchText,
    hasActiveColumnFilters,
    hasSubtableColumns,
    isComplete = true,
  } = params;
  const loadingSuffix = isComplete ? '' : '（読み込み中）';
  const visibleUnit = hasSubtableColumns ? '行' : '件';
  const base = hasSubtableColumns
    ? `関連レコード ${recordsLength} 件 / サブテーブル行 ${totalRowsLength} 行${loadingSuffix}`
    : `関連レコード ${recordsLength} 件${loadingSuffix}`;
  const activeFilterLabels = [
    ...(searchText.trim() ? ['検索'] : []),
    ...(hasActiveColumnFilters ? ['列フィルタ'] : []),
  ];
  count.textContent = activeFilterLabels.length
    ? `${base} / 表示 ${visibleRecordsLength} 件${hasSubtableColumns ? ` / ${visibleRowsLength} ${visibleUnit}` : ''}（${activeFilterLabels.join('・')}）`
    : base;
};

const createSearchInput = (onInput: (searchText: string) => void) => {
  const wrapper = createElement('label', { className: `${ROOT_CLASS}__search` });
  const label = createElement('span', { className: `${ROOT_CLASS}__search-label`, text: '検索' });
  const input = document.createElement('input');
  input.type = 'search';
  input.autocomplete = 'off';
  input.className = `${ROOT_CLASS}__search-input`;
  input.placeholder = 'テーブル内を検索';
  input.addEventListener('input', () => onInput(input.value));
  wrapper.append(label, input);
  return wrapper;
};

const createRefreshButton = (onClick: () => void) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `${ROOT_CLASS}__refresh-button`;
  button.dataset.busy = 'false';
  button.title = '再取得';
  button.setAttribute('aria-label', '関連レコードを再取得');
  button.append(createRefreshIconElement());
  button.addEventListener('click', () => onClick());
  return button;
};

const createCsvExportButton = (onClick: () => void) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `${ROOT_CLASS}__csv-export-button`;
  button.title = 'CSVをダウンロード';
  button.setAttribute('aria-label', '表示中のテーブルをCSVでダウンロード');
  button.append(createDownloadIconElement());
  button.addEventListener('click', () => onClick());
  return button;
};

const formatCacheClockTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatCacheFullTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('ja-JP', {
    hour12: false,
  });
};

const isSubtableProperty = (
  field: kintoneAPI.FieldProperty
): field is kintoneAPI.property.Subtable => {
  return field.type === 'SUBTABLE' && 'fields' in field;
};

type ResolvedRelatedQueryCondition = {
  type: PluginCondition['relatedQueryConditions'][number]['type'];
  currentAppFieldCode: string;
  relatedAppFieldCode: string;
  currentField: kintoneAPI.Field | undefined;
  relatedField: kintoneAPI.FieldProperty | kintoneAPI.property.InSubtable;
  matchingSubtableCode?: string;
};

const resolveRelatedField = (
  relatedFields: kintoneAPI.FieldProperties,
  fieldCode: string
): {
  field: kintoneAPI.FieldProperty | kintoneAPI.property.InSubtable;
  matchingSubtableCode?: string;
} | null => {
  const topLevelField = relatedFields[fieldCode];
  if (topLevelField) {
    return { field: topLevelField };
  }

  for (const [subtableCode, field] of Object.entries(relatedFields)) {
    if (!isSubtableProperty(field)) {
      continue;
    }
    const innerField = field.fields[fieldCode];
    if (innerField) {
      return { field: innerField, matchingSubtableCode: subtableCode };
    }
  }

  return null;
};

const getActiveRelatedQueryConditions = (condition: PluginCondition) => {
  return condition.relatedQueryConditions.filter(
    (queryCondition) => !!queryCondition.currentAppFieldCode && !!queryCondition.relatedAppFieldCode
  );
};

const resolveRelatedQueryConditions = (params: {
  condition: PluginCondition;
  record: kintoneAPI.RecordData;
  relatedFields: kintoneAPI.FieldProperties;
}) => {
  const activeConditions = getActiveRelatedQueryConditions(params.condition);
  if (!activeConditions.length) {
    return { conditions: [], missingFieldCode: null };
  }

  const conditions: ResolvedRelatedQueryCondition[] = [];
  for (const queryCondition of activeConditions) {
    const resolved = resolveRelatedField(params.relatedFields, queryCondition.relatedAppFieldCode);
    if (!resolved) {
      return { conditions: [], missingFieldCode: queryCondition.relatedAppFieldCode };
    }
    const isInSubtable = !!resolved.matchingSubtableCode;
    const conditionType = isRelatedQueryConditionTypeAllowedForField(
      queryCondition.type,
      resolved.field,
      { isInSubtable }
    )
      ? queryCondition.type
      : getFallbackRelatedQueryConditionType(resolved.field, { isInSubtable });
    conditions.push({
      type: conditionType,
      currentAppFieldCode: queryCondition.currentAppFieldCode,
      relatedAppFieldCode: queryCondition.relatedAppFieldCode,
      currentField: params.record[queryCondition.currentAppFieldCode],
      relatedField: resolved.field,
      matchingSubtableCode: resolved.matchingSubtableCode,
    });
  }

  return { conditions, missingFieldCode: null };
};

const createSubtableRowFilter = (params: {
  condition: PluginCondition;
  resolvedConditions: ResolvedRelatedQueryCondition[];
}): SubtableRowFilter | undefined => {
  if (
    !params.condition.filterSubtableRowsByMatchingField ||
    !params.condition.relatedSubtableCode
  ) {
    return undefined;
  }

  const conditions = params.resolvedConditions
    .filter((condition) => condition.matchingSubtableCode === params.condition.relatedSubtableCode)
    .map((condition) => ({
      fieldCode: condition.relatedAppFieldCode,
      fieldType: condition.relatedField.type as kintoneAPI.FieldPropertyType,
      type: condition.type,
      matchingValues: extractComparableValues(condition.currentField?.value),
    }))
    .filter((condition) => condition.matchingValues.some(Boolean));

  if (!conditions.length) {
    return undefined;
  }

  return createSubtableRelatedQueryConditionsRowFilter({ conditions });
};

const createPagination = (onPageChange: (newPage: number) => void) => {
  let _page = 1;
  let _totalPages = 1;

  const wrapper = createElement('div', { className: `${ROOT_CLASS}__footer` });

  const prevBtn = document.createElement('button');
  prevBtn.className = `${ROOT_CLASS}__pagination-btn`;
  prevBtn.type = 'button';
  prevBtn.textContent = '← 前へ';

  const pageInfo = createElement('span', { className: `${ROOT_CLASS}__pagination-info` });

  const nextBtn = document.createElement('button');
  nextBtn.className = `${ROOT_CLASS}__pagination-btn`;
  nextBtn.type = 'button';
  nextBtn.textContent = '次へ →';

  prevBtn.addEventListener('click', () => {
    if (_page > 1) onPageChange(_page - 1);
  });
  nextBtn.addEventListener('click', () => {
    if (_page < _totalPages) onPageChange(_page + 1);
  });

  wrapper.append(prevBtn, pageInfo, nextBtn);

  const update = (page: number, totalPages: number) => {
    _page = page;
    _totalPages = totalPages;
    pageInfo.textContent = `${page} / ${totalPages} ページ`;
    prevBtn.disabled = page <= 1;
    nextBtn.disabled = page >= totalPages;
    // display の切り替えではなく visibility を使い、フッターの高さ自体は常に確保する。
    // これにより1ページ⇄複数ページの切り替わり時に前へ・次へボタンの位置がずれない。
    wrapper.dataset.visible = totalPages <= 1 ? 'false' : 'true';
  };

  return { element: wrapper, update };
};

const getRecordsPerPage = (condition: PluginCondition) => {
  const recordsPerPage = Number.isFinite(condition.recordsPerPage)
    ? Math.trunc(condition.recordsPerPage)
    : DEFAULT_RECORDS_PER_PAGE;
  return Math.min(MAX_RECORDS_PER_PAGE, Math.max(MIN_RECORDS_PER_PAGE, recordsPerPage));
};

/** thead/tbody の1行あたりの実測に近いおおよその高さ（px）。CSSの padding/font-size と対応させる。 */
const TABLE_ROW_HEIGHT_PX = 32;
const TABLE_HEADER_HEIGHT_PX = 32;
/** 表示行数が少ない設定でも、読み込み中・空メッセージが窮屈に見えない最小の表示領域。 */
const TABLE_MIN_HEIGHT_PX = 160;
/** 大きい recordsPerPage でも際限なく伸びないための上限（既存の見た目の上限を踏襲）。 */
const TABLE_MAX_HEIGHT_CSS = '600px, 64vh';

/**
 * 1ページあたりの表示行数から、テーブル表示領域の高さを固定的に算出する。
 * 初回の逐次読み込み・検索による絞り込み・ページ末尾の端数行など、実際の行数が
 * 変動する場面でも表示領域の高さを一定に保ち、検索欄やページ送りボタンの位置が
 * ずれないようにするために使う。
 */
const getReservedTableHeightCss = (recordsPerPage: number) => {
  const contentHeight = TABLE_HEADER_HEIGHT_PX + TABLE_ROW_HEIGHT_PX * recordsPerPage;
  const preferredHeight = Math.max(TABLE_MIN_HEIGHT_PX, contentHeight);
  return `min(${preferredHeight}px, ${TABLE_MAX_HEIGHT_CSS})`;
};

const renderRecords = (params: {
  root: HTMLElement;
  condition: PluginCondition;
  relatedFields: kintoneAPI.FieldProperties;
  appName: string;
  relatedAppGuestSpaceId?: string;
  subtableRowFilter?: SubtableRowFilter;
  onRefresh: () => void;
}) => {
  const {
    root,
    condition,
    relatedFields,
    appName,
    relatedAppGuestSpaceId,
    subtableRowFilter,
    onRefresh,
  } = params;
  const relatedRecordFields = resolveRelatedRecordFields(relatedFields, condition);
  const subtableFields = resolveSubtableFields(relatedFields, condition);

  if (!relatedRecordFields.length && !subtableFields.length) {
    renderMessage(
      root,
      '表示する関連レコードフィールドまたはサブテーブル列が見つかりません。設定を確認してください。',
      'error'
    );
    return;
  }

  const container = createElement('div', { className: `${ROOT_CLASS}__inner` });
  const header = createElement('div', { className: `${ROOT_CLASS}__header` });
  const heading = createElement('div', { className: `${ROOT_CLASS}__heading` });
  const count = createElement('div', { className: `${ROOT_CLASS}__count` });
  heading.append(
    createElement('h3', {
      className: `${ROOT_CLASS}__title`,
      text: condition.memo || appName || '関連レコード',
    }),
    count
  );
  header.append(heading);

  const controls = createElement('div', { className: `${ROOT_CLASS}__controls` });
  // visibility で表示/非表示を切り替え、幅を常に確保しておく（hidden属性で
  // レイアウトから除外すると、更新ボタンや検索欄が横方向にずれてしまうため）。
  const cacheStatus = createElement('span', { className: `${ROOT_CLASS}__cache-status` });
  cacheStatus.dataset.visible = 'false';
  const csvExportButton = condition.enableCsvExport
    ? createCsvExportButton(() =>
        exportFlatTableRowsAsCsv({
          columns: createTableFieldColumns({ relatedRecordFields, subtableFields }),
          rows: currentFilteredRows,
          baseName: condition.memo || appName || '関連レコード',
        })
      )
    : null;
  // データが揃うまでは無効化しておく（render() 実行後に isComplete/行数に応じて更新される）
  if (csvExportButton) {
    csvExportButton.disabled = true;
  }
  const refreshButton = createRefreshButton(() => onRefresh());
  controls.append(cacheStatus, ...(csvExportButton ? [csvExportButton] : []), refreshButton);
  header.append(controls);
  container.append(header);
  const mergeRelatedRecordFields = shouldMergeRelatedRecordFields(condition);
  const recordsPerPage = getRecordsPerPage(condition);

  let records: RelatedRecord[] = [];
  let rows: FlatTableRow[] = [];
  let currentPage = 1;
  let currentFilteredRows = rows;
  let currentSearchText = '';
  let currentColumnFilters = new Map<TableColumnKey, ColumnFilterState>();
  let currentSort: ColumnSortState | null = null;
  let aggregationOperation: FieldAggregationOperation = 'sum';
  let filterPopover: HTMLElement | null = null;
  let filterFocusReturnTarget: HTMLElement | null = null;
  let disposeFilterPopoverListeners: (() => void) | undefined;
  let fileLoadVersion = 0;
  let isComplete = false;

  const hasActiveColumnFilters = () =>
    Array.from(currentColumnFilters.values()).some(isColumnFilterActive);

  const applyCurrentFilters = () => {
    const filtered = filterFlatTableRows(rows, currentSearchText, currentColumnFilters);
    currentFilteredRows = sortFlatTableRows(filtered, currentSort);
  };

  const setRefreshing = (busy: boolean) => {
    refreshButton.disabled = busy;
    refreshButton.dataset.busy = busy ? 'true' : 'false';
    refreshButton.setAttribute('aria-busy', busy ? 'true' : 'false');
    // 取得中の不完全な行を書き出さないよう、再取得中はエクスポートも止める
    if (csvExportButton) {
      csvExportButton.disabled = busy || !isComplete || !currentFilteredRows.length;
    }
  };

  const updateCsvExportButtonState = () => {
    if (!csvExportButton) {
      return;
    }
    csvExportButton.disabled = !isComplete || !currentFilteredRows.length;
  };

  const updateCacheStatus = (info?: { fromCache?: boolean; cachedAt?: number }) => {
    if (!info || typeof info.cachedAt !== 'number') {
      cacheStatus.dataset.visible = 'false';
      return;
    }
    const clockTime = formatCacheClockTime(info.cachedAt);
    const fullTime = formatCacheFullTime(info.cachedAt);
    cacheStatus.textContent = info.fromCache ? `キャッシュ ${clockTime}` : `取得 ${clockTime}`;
    cacheStatus.title = info.fromCache
      ? `キャッシュから表示しています（取得日時: ${fullTime}）。再取得するには更新ボタンを押してください。`
      : `サーバーから取得しました（${fullTime}）。`;
    cacheStatus.dataset.cache = info.fromCache ? 'true' : 'false';
    cacheStatus.dataset.visible = 'true';
  };

  const setColumnSort = (key: TableColumnKey, direction: SortDirection | null) => {
    currentSort = direction ? { key, direction } : null;
    currentPage = 1;
    applyCurrentFilters();
    render();
  };

  const handleSortClick = (column: TableFieldColumn) => {
    if (currentSort?.key !== column.key) {
      setColumnSort(column.key, 'asc');
    } else if (currentSort.direction === 'asc') {
      setColumnSort(column.key, 'desc');
    } else {
      setColumnSort(column.key, null);
    }
  };

  const closeFilterPopover = (restoreFocus = true) => {
    const returnTarget = filterFocusReturnTarget;
    filterPopover?.remove();
    filterPopover = null;
    filterFocusReturnTarget = null;
    disposeFilterPopoverListeners?.();
    disposeFilterPopoverListeners = undefined;

    if (restoreFocus && returnTarget?.isConnected) {
      returnTarget.focus();
    }
  };

  disposeConditionUiById.set(condition.id, () => {
    closeFilterPopover(false);
    fileLoadVersion++;
  });

  const setColumnFilter = (columnKey: TableColumnKey, filter: ColumnFilterState | undefined) => {
    const nextFilters =
      filter && isColumnFilterActive(filter)
        ? new Map([...currentColumnFilters.entries(), [columnKey, filter]])
        : new Map(Array.from(currentColumnFilters.entries()).filter(([key]) => key !== columnKey));
    currentColumnFilters = nextFilters;
    currentPage = 1;
    applyCurrentFilters();
    render();
  };

  const openColumnFilterPopover = (column: TableFieldColumn, anchor: HTMLButtonElement) => {
    closeFilterPopover(false);
    filterFocusReturnTarget = anchor;

    const filtersWithoutCurrentColumn = new Map(
      Array.from(currentColumnFilters.entries()).filter(([key]) => key !== column.key)
    );
    const rowsForOptions = filterFlatTableRows(
      rows,
      currentSearchText,
      filtersWithoutCurrentColumn
    );
    const popover = createColumnFilterPopover({
      column,
      rows: rowsForOptions,
      currentFilter: currentColumnFilters.get(column.key),
      onApply: (filter) => {
        closeFilterPopover(false);
        setColumnFilter(column.key, filter);
      },
      onClose: closeFilterPopover,
    });

    const handleOutsideClick = (event: MouseEvent) => {
      if (!(event.target instanceof Node)) {
        return;
      }
      if (popover.contains(event.target) || anchor.contains(event.target)) {
        return;
      }
      closeFilterPopover();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeFilterPopover();
        return;
      }
      trapFocusWithin(event, popover);
    };
    const handleResize = () => positionFilterPopover(popover, anchor);

    document.body.append(popover);
    positionFilterPopover(popover, anchor);
    filterPopover = popover;
    document.addEventListener('click', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    disposeFilterPopoverListeners = () => {
      document.removeEventListener('click', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
    const initialFocus = popover.querySelector<HTMLInputElement>(`.${ROOT_CLASS}__filter-search`);
    if (initialFocus) {
      initialFocus.focus();
    } else {
      popover.focus();
    }
  };

  const getTotalPages = () =>
    Math.max(1, Math.ceil(getFlatTableRowGroupCount(currentFilteredRows) / recordsPerPage));

  const tableWrapper = createElement('div', { className: `${ROOT_CLASS}__table-wrapper` });
  // recordsPerPage は表示中に変わらない静的な値なので、一度だけ高さを確保すれば
  // 以降の読み込み・検索・ページ移動で表示領域が伸び縮みすることはない。
  tableWrapper.style.setProperty('--rrt-table-height', getReservedTableHeightCss(recordsPerPage));
  const table = createElement('table', { className: `${ROOT_CLASS}__table` });
  const caption = createElement('caption', {
    className: `${ROOT_CLASS}__visually-hidden`,
    text: condition.memo || appName || '関連レコード',
  });
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  table.append(caption, thead, tbody);
  tableWrapper.append(table);

  let render = () => {};
  const pagination = createPagination((newPage) => {
    currentPage = newPage;
    render();
  });

  container.append(tableWrapper, pagination.element);

  render = () => {
    const totalPages = getTotalPages();
    currentPage = Math.min(Math.max(1, currentPage), totalPages);

    // ページ変更や再レンダリング時に進行中のファイル取得をキャンセルする
    fileLoadVersion++;
    updateCsvExportButtonState();

    renderTableHead({
      thead,
      relatedRecordFields,
      subtableFields,
      isColumnFilterActive: (columnKey) =>
        isColumnFilterActive(currentColumnFilters.get(columnKey)),
      onFilterClick: openColumnFilterPopover,
      getColumnSortDirection: (columnKey) =>
        currentSort?.key === columnKey ? currentSort.direction : null,
      onSortClick: handleSortClick,
    });
    // 集計行をヘッダーの直下に固定表示するため、実際のヘッダー行の高さを計測して
    // 反映する（フォントサイズや折り返し等でヘッダー高さが変わってもずれない）。
    // 初回のみ container が document に未接続で 0 になるが、その時点では行が
    // 空でこの後 return するため実害はない。
    table.style.setProperty('--rrt-header-height', `${thead.offsetHeight}px`);
    updateCount({
      count,
      recordsLength: records.length,
      totalRowsLength: rows.length,
      visibleRecordsLength: getFlatTableRowGroupCount(currentFilteredRows),
      visibleRowsLength: currentFilteredRows.length,
      searchText: currentSearchText,
      hasActiveColumnFilters: hasActiveColumnFilters(),
      hasSubtableColumns: !!subtableFields.length,
      isComplete,
    });

    if (!rows.length) {
      const message = isComplete
        ? records.length
          ? subtableFields.length
            ? '表示できるサブテーブル行はありません。'
            : '表示できる関連レコードはありません。'
          : '関連するレコードはありません。'
        : '関連レコードを読み込んでいます。';
      pagination.update(1, 1);
      // 予約した固定高さの中で空・読み込み中メッセージが浮かないよう縦中央に配置する
      table.dataset.empty = 'true';
      tbody.replaceChildren(
        createEmptyTableRow(
          DETAIL_COLUMN_LENGTH + relatedRecordFields.length + subtableFields.length,
          message
        )
      );
      return;
    }

    table.dataset.empty = 'false';
    const pageRows = paginateFlatTableRowsByRecord({
      rows: currentFilteredRows,
      page: currentPage,
      recordsPerPage,
    });
    const aggregations = condition.showFieldAggregations
      ? calculateFieldAggregations({
          rows: currentFilteredRows,
          relatedRecordFields,
          subtableFields,
          operation: aggregationOperation,
          roundingMode: condition.aggregationRoundingMode,
          decimalDigits: condition.aggregationDecimalDigits,
        })
      : [];

    pagination.update(currentPage, totalPages);
    const fileLoadRequests: FileLoadRequest[] = [];
    renderTableBody({
      tbody,
      rows: pageRows,
      relatedAppId: condition.relatedAppId,
      relatedAppGuestSpaceId,
      relatedRecordFields,
      subtableFields,
      mergeRelatedRecordFields,
      aggregations,
      aggregationOperation,
      onAggregationOperationChange: (operation) => {
        aggregationOperation = operation;
        render();
      },
      onFileLoad: (request) => fileLoadRequests.push(request),
    });

    // レコード取得よりも優先度を下げ、現在のページのファイルのみ非同期で取得する
    if (fileLoadRequests.length) {
      const versionAtStart = fileLoadVersion;
      setTimeout(() => {
        loadFilesBatch(
          fileLoadRequests,
          relatedAppGuestSpaceId,
          () => fileLoadVersion !== versionAtStart
        );
      }, 0);
    }
  };

  const applySearch = (searchText: string) => {
    closeFilterPopover();
    currentSearchText = searchText;
    applyCurrentFilters();
    currentPage = 1;
    render();
  };

  controls.append(createSearchInput(applySearch));
  applySearch('');
  root.replaceChildren(container);

  return {
    /** 再取得・キャッシュ再読み込み時に表示データを初期化し、読み込み中状態へ戻す。 */
    reset: () => {
      records = [];
      rows = [];
      currentPage = 1;
      isComplete = false;
      updateCacheStatus(undefined);
      applyCurrentFilters();
      render();
    },
    setRefreshing,
    appendRecords: (nextRecords: RelatedRecord[]) => {
      if (!nextRecords.length) {
        return;
      }

      const recordIndexOffset = records.length;
      const nextRows = buildFlatTableRows({
        records: nextRecords,
        condition,
        relatedRecordFields,
        subtableFields,
        subtableRowFilter,
        recordIndexOffset,
      });

      records = [...records, ...nextRecords];
      rows = [...rows, ...nextRows];
      applyCurrentFilters();
      render();
    },
    finish: (info?: { fromCache?: boolean; cachedAt?: number }) => {
      isComplete = true;
      updateCacheStatus(info);
      render();
    },
  };
};

const getFetchFields = (condition: PluginCondition) => {
  return Array.from(
    new Set(
      [
        '$id',
        condition.relatedSubtableCode && condition.subtableFieldCodes.some(Boolean)
          ? condition.relatedSubtableCode
          : '',
        ...condition.relatedRecordFieldCodes,
      ].filter(Boolean)
    )
  );
};

const getRelatedAppGuestSpaceId = (condition: PluginCondition) => {
  return condition.relatedAppGuestSpaceId || undefined;
};

const resolveRelatedApp = async (condition: PluginCondition) => {
  const fallbackGuestSpaceId = getRelatedAppGuestSpaceId(condition);
  let app: kintoneAPI.App;

  try {
    app = await getApp({ id: condition.relatedAppId, debug: isDev });
  } catch (error) {
    const apps = await getAllApps({ debug: isDev }).catch(() => []);
    const foundApp = apps.find((candidate) => candidate.appId === condition.relatedAppId);
    if (foundApp) {
      app = foundApp;
    } else if (fallbackGuestSpaceId) {
      app = await getApp({
        id: condition.relatedAppId,
        guestSpaceId: fallbackGuestSpaceId,
        debug: isDev,
      });
    } else {
      throw new Error(`Related app not found: ${condition.relatedAppId}`, { cause: error });
    }
  }

  let isGuestSpaceApp = false;
  try {
    isGuestSpaceApp = app.spaceId ? await isGuestSpace(condition.relatedAppId) : false;
  } catch (error) {
    if (isDev) {
      console.warn('Failed to detect related app guest space:', error);
    }
    isGuestSpaceApp = false;
  }

  return {
    app,
    guestSpaceId: isGuestSpaceApp ? (app.spaceId ?? undefined) : undefined,
  };
};

/**
 * アプリ解決・フィールド取得が完了する前の初期表示。
 * ヘッダー(タイトル・検索欄・更新ボタン)とテーブル表示領域の高さを、
 * 後続で `renderRecords` が組み立てる本体と同じ見た目で先に確保しておく。
 * こうすることで、読み込み完了時に検索欄やページ送りボタンが
 * 新たに出現して位置がずれる、という初回読み込み時のジャンプを防ぐ。
 */
const renderLoadingShell = (root: HTMLElement, condition: PluginCondition) => {
  const container = createElement('div', { className: `${ROOT_CLASS}__inner` });
  const header = createElement('div', { className: `${ROOT_CLASS}__header` });
  const heading = createElement('div', { className: `${ROOT_CLASS}__heading` });
  heading.append(
    createElement('h3', {
      className: `${ROOT_CLASS}__title`,
      text: condition.memo || '関連レコード',
    }),
    createElement('div', {
      className: `${ROOT_CLASS}__count`,
      text: '関連レコードを読み込んでいます。',
    })
  );
  header.append(heading);

  const controls = createElement('div', { className: `${ROOT_CLASS}__controls` });
  const cacheStatus = createElement('span', { className: `${ROOT_CLASS}__cache-status` });
  cacheStatus.dataset.visible = 'false';
  // enableCsvExport は静的な設定値なので、本体側と同じ条件でここでも先にボタンを
  // 確保しておく。読み込み完了時に出現してコントロール列の幅がずれるのを防ぐ。
  const csvExportButton = condition.enableCsvExport ? createCsvExportButton(() => {}) : null;
  if (csvExportButton) {
    csvExportButton.disabled = true;
  }
  const refreshButton = createRefreshButton(() => {});
  refreshButton.disabled = true;
  const searchWrapper = createSearchInput(() => {});
  searchWrapper.querySelector('input')?.setAttribute('disabled', 'true');
  controls.append(
    cacheStatus,
    ...(csvExportButton ? [csvExportButton] : []),
    refreshButton,
    searchWrapper
  );
  header.append(controls);
  container.append(header);

  const tableWrapper = createElement('div', { className: `${ROOT_CLASS}__table-wrapper` });
  tableWrapper.style.setProperty(
    '--rrt-table-height',
    getReservedTableHeightCss(getRecordsPerPage(condition))
  );
  tableWrapper.dataset.loading = 'true';
  tableWrapper.append(
    createElement('div', {
      className: `${ROOT_CLASS}__empty`,
      text: '関連レコードを読み込んでいます。',
    })
  );
  container.append(tableWrapper);

  const footer = createElement('div', { className: `${ROOT_CLASS}__footer` });
  footer.dataset.visible = 'false';
  container.append(footer);

  root.replaceChildren(container);
};

const renderCondition = async (condition: PluginCondition, record: kintoneAPI.RecordData) => {
  const spaceElement = getSpaceElement(condition.targetSpaceId);
  if (!spaceElement) {
    return;
  }

  const root = createElement('section', { className: `🐸 ${ROOT_CLASS}` });
  root.dataset.conditionId = condition.id;
  disposeConditionUi(condition.id);
  spaceElement.querySelector(`[data-condition-id="${condition.id}"]`)?.remove();
  spaceElement.append(root);
  renderLoadingShell(root, condition);
  const requestScope = createConditionRequestScope(condition.id);

  try {
    const { app, guestSpaceId: relatedAppGuestSpaceId } = await resolveRelatedApp(condition);
    const { properties: relatedFields } = await getFormFields({
      app: condition.relatedAppId,
      guestSpaceId: relatedAppGuestSpaceId,
      debug: isDev,
    });

    const { conditions: resolvedConditions, missingFieldCode } = resolveRelatedQueryConditions({
      condition,
      record,
      relatedFields,
    });

    if (missingFieldCode) {
      if (isDev) {
        console.warn('Missing related query field:', missingFieldCode);
      }
      renderMessage(
        root,
        '関連先アプリの検索フィールドが見つかりません。設定を確認してください。',
        'error'
      );
      return;
    }

    if (!resolvedConditions.length) {
      renderMessage(
        root,
        '関連レコードの取得条件が設定されていません。設定を確認してください。',
        'error'
      );
      return;
    }

    const query = createRelatedRecordsQueryFromConditions({
      conditions: resolvedConditions.map((queryCondition) => ({
        fieldCode: queryCondition.relatedAppFieldCode,
        fieldType: queryCondition.relatedField.type as kintoneAPI.FieldPropertyType,
        value: queryCondition.currentField?.value,
        type: queryCondition.type,
        forceInOperator: !!queryCondition.matchingSubtableCode,
      })),
      sortFieldCode: condition.sortFieldCode,
      sortOrder: condition.sortOrder,
      extraConditions: condition.relatedFilterConditions.map(buildConditionQuery).filter(Boolean),
    });
    if (!query) {
      renderMessage(
        root,
        '取得条件に使用するフィールドに値がないため、関連レコードを取得できません。'
      );
      return;
    }

    const subtableRowFilter = createSubtableRowFilter({ condition, resolvedConditions });
    const fetchFields = getFetchFields(condition);
    const cacheKey = createRecordCacheKey({
      conditionId: condition.id,
      relatedAppId: condition.relatedAppId,
      query,
      fields: fetchFields,
    });

    let triggerRefresh = () => {};
    const renderer = renderRecords({
      root,
      condition,
      relatedFields,
      appName: app.name,
      relatedAppGuestSpaceId,
      subtableRowFilter,
      onRefresh: () => triggerRefresh(),
    });
    if (!renderer) {
      return;
    }

    // 再取得ごとに採番し、同一表示内で進行中の前回取得を無効化するためのトークン
    let activeLoadId = 0;
    const loadRecords = async ({ forceRefresh }: { forceRefresh: boolean }) => {
      const loadId = ++activeLoadId;
      // ナビゲーション（新しい renderCondition）と、同一表示内での再取得の双方を検知する
      const isCurrentLoad = () => requestScope.isCurrent() && activeLoadId === loadId;
      renderer.setRefreshing(true);

      try {
        if (forceRefresh) {
          clearCachedRecords(cacheKey);
        } else {
          const cached = getCachedRecords(cacheKey);
          if (cached) {
            renderer.reset();
            renderer.appendRecords(cached.records);
            renderer.finish({ fromCache: true, cachedAt: cached.cachedAt });
            return;
          }
        }

        renderer.reset();

        const collectedRecords: RelatedRecord[] = [];
        let incrementalRenderError: unknown;
        const handleIncrementalRenderError = (error: unknown) => {
          if (incrementalRenderError) {
            return;
          }
          incrementalRenderError = error;
          logClientError('Reference table incremental render error:', error);
          renderMessage(root, '関連レコードの表示中にエラーが発生しました。', 'error');
        };

        await getAllRecords<RelatedRecord>({
          app: condition.relatedAppId,
          fields: fetchFields,
          query,
          guestSpaceId: relatedAppGuestSpaceId,
          debug: isDev,
          onStep: ({ incremental }) => {
            if (!isCurrentLoad() || incrementalRenderError) {
              return;
            }

            try {
              collectedRecords.push(...incremental);
              renderer.appendRecords(incremental);
            } catch (error) {
              handleIncrementalRenderError(error);
            }
          },
        });
        if (!isCurrentLoad() || incrementalRenderError) {
          return;
        }

        const entry = setCachedRecords(cacheKey, collectedRecords);
        renderer.finish({ fromCache: false, cachedAt: entry.cachedAt });
      } catch (error) {
        if (!isCurrentLoad()) {
          return;
        }
        logClientError('Reference table fetch error:', error);
        renderMessage(root, '関連レコードの取得中にエラーが発生しました。', 'error');
      } finally {
        if (isCurrentLoad()) {
          renderer.setRefreshing(false);
        }
      }
    };

    triggerRefresh = () => {
      void loadRecords({ forceRefresh: true });
    };

    await loadRecords({ forceRefresh: false });
  } catch (error) {
    if (!requestScope.isCurrent()) {
      return;
    }
    logClientError('Reference table fetch error:', error);
    renderMessage(root, '関連レコードの取得中にエラーが発生しました。', 'error');
  }
};

manager.add(['app.record.detail.show', 'app.record.edit.show'], async (event) => {
  const conditions = store.get(validPluginConditionsAtom);

  await Promise.all(conditions.map((condition) => renderCondition(condition, event.record)));

  return event;
});

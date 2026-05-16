import {
  getAllRecords,
  getApp,
  getFormFields,
  getSpaceElement,
  type kintoneAPI,
} from '@konomi-app/kintone-utilities';
import { manager } from '@/lib/event-manager';
import { GUEST_SPACE_ID, isDev } from '@/lib/global';
import { store } from '@/lib/jotai';
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
import { type FileLoadRequest, loadFilesBatch } from './file-loader';
import {
  createColumnFilterPopover,
  positionFilterPopover,
  trapFocusWithin,
} from './filter-popover';
import { validPluginConditionsAtom } from './public-state';
import {
  buildFlatTableRows,
  type ColumnFilterState,
  type ColumnSortState,
  calculateFieldAggregations,
  createSubtableRelatedQueryConditionsRowFilter,
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
    wrapper.style.display = totalPages <= 1 ? 'none' : 'flex';
  };

  return { element: wrapper, update };
};

const getRecordsPerPage = (condition: PluginCondition) => {
  const recordsPerPage = Number.isFinite(condition.recordsPerPage)
    ? Math.trunc(condition.recordsPerPage)
    : DEFAULT_RECORDS_PER_PAGE;
  return Math.min(MAX_RECORDS_PER_PAGE, Math.max(MIN_RECORDS_PER_PAGE, recordsPerPage));
};

const renderRecords = (params: {
  root: HTMLElement;
  condition: PluginCondition;
  relatedFields: kintoneAPI.FieldProperties;
  appName: string;
  subtableRowFilter?: SubtableRowFilter;
}) => {
  const { root, condition, relatedFields, appName, subtableRowFilter } = params;
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
      tbody.replaceChildren(
        createEmptyTableRow(
          DETAIL_COLUMN_LENGTH + relatedRecordFields.length + subtableFields.length,
          message
        )
      );
      return;
    }

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
        loadFilesBatch(fileLoadRequests, GUEST_SPACE_ID, () => fileLoadVersion !== versionAtStart);
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

  header.append(createSearchInput(applySearch));
  applySearch('');
  root.replaceChildren(container);

  return {
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
    finish: () => {
      isComplete = true;
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
  renderMessage(root, '関連レコードを読み込んでいます。');
  const requestScope = createConditionRequestScope(condition.id);

  try {
    const [{ properties: relatedFields }, { name: appName }] = await Promise.all([
      getFormFields({
        app: condition.relatedAppId,
        guestSpaceId: GUEST_SPACE_ID,
        debug: isDev,
      }),
      getApp({
        id: condition.relatedAppId,
        guestSpaceId: GUEST_SPACE_ID,
        debug: isDev,
      }),
    ]);

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
    });
    if (!query) {
      renderMessage(
        root,
        '取得条件に使用するフィールドに値がないため、関連レコードを取得できません。'
      );
      return;
    }

    const subtableRowFilter = createSubtableRowFilter({ condition, resolvedConditions });
    let incrementalRenderError: unknown;
    const handleIncrementalRenderError = (error: unknown) => {
      if (incrementalRenderError) {
        return;
      }
      incrementalRenderError = error;
      logClientError('Reference table incremental render error:', error);
      renderMessage(root, '関連レコードの表示中にエラーが発生しました。', 'error');
    };

    const fetchFields = getFetchFields(condition);
    const renderer = renderRecords({
      root,
      condition,
      relatedFields,
      appName,
      subtableRowFilter,
    });
    if (!renderer) {
      return;
    }

    await getAllRecords<RelatedRecord>({
      app: condition.relatedAppId,
      fields: fetchFields,
      query,
      guestSpaceId: GUEST_SPACE_ID,
      debug: isDev,
      onStep: ({ incremental }) => {
        if (!requestScope.isCurrent()) {
          return;
        }
        if (incrementalRenderError) {
          return;
        }

        try {
          renderer.appendRecords(incremental);
        } catch (error) {
          handleIncrementalRenderError(error);
        }
      },
    });
    if (!requestScope.isCurrent() || incrementalRenderError) {
      return;
    }
    renderer.finish();
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

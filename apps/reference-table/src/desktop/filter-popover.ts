import {
  type ColumnFilterState,
  extractColumnFilterOptions,
  type FlatTableRow,
  isColumnFilterActive,
  normalizeSearchText,
  type TableFieldColumn,
} from './table';

const ROOT_CLASS = 'ribbit-related-subtable';
const FILTER_POPOVER_WIDTH = 320;
const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

let nextPopoverId = 0;

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

export const positionFilterPopover = (popover: HTMLElement, anchor: HTMLElement) => {
  const rect = anchor.getBoundingClientRect();
  const left = Math.max(8, Math.min(rect.left, window.innerWidth - FILTER_POPOVER_WIDTH - 8));
  const top = Math.min(rect.bottom + 6, window.innerHeight - 80);
  popover.style.left = `${left}px`;
  popover.style.top = `${Math.max(8, top)}px`;
};

const getFocusableElements = (container: HTMLElement) => {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => !element.hidden && element.offsetParent !== null
  );
};

export const trapFocusWithin = (event: KeyboardEvent, container: HTMLElement) => {
  if (event.key !== 'Tab') {
    return;
  }

  const focusableElements = getFocusableElements(container);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  if (!firstElement || !lastElement) {
    event.preventDefault();
    container.focus();
    return;
  }

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
    return;
  }

  if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
};

const getSelectedValues = (optionList: HTMLElement) => {
  return Array.from(optionList.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'))
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => checkbox.dataset.value ?? '');
};

const setAllOptionsChecked = (optionList: HTMLElement, checked: boolean) => {
  for (const checkbox of optionList.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')) {
    checkbox.checked = checked;
  }
};

const updateOptionVisibility = (params: {
  optionList: HTMLElement;
  emptyMessage: HTMLElement;
  keyword: string;
}) => {
  const words = normalizeSearchText(params.keyword).split(/\s+/g).filter(Boolean);
  let hasVisibleOption = false;

  for (const option of params.optionList.querySelectorAll<HTMLElement>(
    `.${ROOT_CLASS}__filter-option`
  )) {
    const label = option.dataset.label ?? '';
    const isVisible = words.every((word) => label.includes(word));
    option.hidden = !isVisible;
    hasVisibleOption ||= isVisible;
  }

  params.emptyMessage.hidden = hasVisibleOption;
};

export const createColumnFilterPopover = (params: {
  column: TableFieldColumn;
  rows: FlatTableRow[];
  currentFilter?: ColumnFilterState;
  onApply: (filter: ColumnFilterState | undefined) => void;
  onClose: () => void;
}): HTMLElement => {
  const options = extractColumnFilterOptions(params.rows, params.column);
  const selectedValues = new Set(
    params.currentFilter?.selectedValues ?? options.map((option) => option.value)
  );
  const titleId = `${ROOT_CLASS}__filter-title-${nextPopoverId++}`;
  const popover = createElement('div', { className: `${ROOT_CLASS}__filter-popover` });
  popover.tabIndex = -1;
  popover.setAttribute('role', 'dialog');
  popover.setAttribute('aria-modal', 'true');
  popover.setAttribute('aria-labelledby', titleId);

  const content = createElement('div', { className: `${ROOT_CLASS}__filter-popover-content` });

  const title = createElement('div', {
    className: `${ROOT_CLASS}__filter-title`,
    text: `${params.column.label}を絞り込み`,
  });
  title.id = titleId;

  const keywordInput = document.createElement('input');
  keywordInput.type = 'search';
  keywordInput.autocomplete = 'off';
  keywordInput.className = `${ROOT_CLASS}__filter-search`;
  keywordInput.placeholder = 'この列を検索';
  keywordInput.value = params.currentFilter?.keyword ?? '';

  const optionList = createElement('div', { className: `${ROOT_CLASS}__filter-options` });
  const emptyMessage = createElement('div', {
    className: `${ROOT_CLASS}__filter-empty`,
    text: '候補がありません',
  });

  for (const option of options) {
    const label = createElement('label', { className: `${ROOT_CLASS}__filter-option` });
    label.dataset.label = normalizeSearchText(option.label);
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = selectedValues.has(option.value);
    checkbox.dataset.value = option.value;
    label.append(
      checkbox,
      createElement('span', {
        className: `${ROOT_CLASS}__filter-option-label`,
        text: option.label,
      }),
      createElement('span', {
        className: `${ROOT_CLASS}__filter-option-count`,
        text: String(option.count),
      })
    );
    optionList.append(label);
  }
  optionList.append(emptyMessage);

  keywordInput.addEventListener('input', () =>
    updateOptionVisibility({ optionList, emptyMessage, keyword: keywordInput.value })
  );

  const selectAllButton = document.createElement('button');
  selectAllButton.type = 'button';
  selectAllButton.className = `${ROOT_CLASS}__filter-text-button`;
  selectAllButton.textContent = 'すべて選択';
  selectAllButton.addEventListener('click', () => setAllOptionsChecked(optionList, true));

  const clearChecksButton = document.createElement('button');
  clearChecksButton.type = 'button';
  clearChecksButton.className = `${ROOT_CLASS}__filter-text-button`;
  clearChecksButton.textContent = 'チェックを外す';
  clearChecksButton.addEventListener('click', () => setAllOptionsChecked(optionList, false));

  const quickActions = createElement('div', { className: `${ROOT_CLASS}__filter-quick-actions` });
  quickActions.append(selectAllButton, clearChecksButton);

  const clearFilterButton = document.createElement('button');
  clearFilterButton.type = 'button';
  clearFilterButton.className = `${ROOT_CLASS}__filter-clear-button`;
  clearFilterButton.textContent = '絞り込みをクリア';
  clearFilterButton.addEventListener('click', () => params.onApply(undefined));

  const cancelButton = document.createElement('button');
  cancelButton.type = 'button';
  cancelButton.className = `${ROOT_CLASS}__filter-secondary-button`;
  cancelButton.textContent = '閉じる';
  cancelButton.addEventListener('click', params.onClose);

  const applyButton = document.createElement('button');
  applyButton.type = 'button';
  applyButton.className = `${ROOT_CLASS}__filter-apply-button`;
  applyButton.textContent = '適用';
  applyButton.addEventListener('click', () => {
    const keyword = keywordInput.value.trim();
    const selectedValueList = getSelectedValues(optionList);
    const selectedValuesFilter =
      selectedValueList.length === options.length ? undefined : selectedValueList;
    const nextFilter: ColumnFilterState = {
      ...(keyword ? { keyword } : {}),
      ...(selectedValuesFilter === undefined ? {} : { selectedValues: selectedValuesFilter }),
    };
    params.onApply(isColumnFilterActive(nextFilter) ? nextFilter : undefined);
  });

  const footer = createElement('div', { className: `${ROOT_CLASS}__filter-actions` });
  footer.append(clearFilterButton, cancelButton, applyButton);
  content.append(title, keywordInput, quickActions, optionList, footer);
  popover.append(content);
  updateOptionVisibility({ optionList, emptyMessage, keyword: keywordInput.value });

  return popover;
};

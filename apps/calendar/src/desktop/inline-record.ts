import { parseRecurrenceMeta } from '@/desktop/recurrence';
import { restorePluginConfig } from '@/lib/plugin';
import type { PluginCondition } from '@/schema/plugin-config';

/**
 * URL/postMessageベースでkintone標準のレコード追加・編集画面をiframeに埋め込むための共通基盤。
 *
 * このモジュールは親ウィンドウ側(detailed-dialogのURL組み立て)と、iframe内で動作する
 * レコード追加・編集画面側(record-page.ts)の両方からimportされるため、Reactに依存しない。
 */

export const CALENDAR_INLINE_EDIT_PARAM = 'calendar_inline_edit';
export const CALENDAR_INLINE_CREATE_PARAM = 'calendar_inline_create';
const CONDITION_ID_PARAM = 'calendar_inline_create_condition';
const INITIAL_VALUES_PARAM = 'calendar_inline_create_values';
const HISTORY_STATE_KEY = 'calendarInlineCreateCancelGuard';

const MAX_INITIAL_VALUES_PARAM_LENGTH = 8192;
const MAX_FIELD_CODE_LENGTH = 128;
const MAX_TEXT_VALUE_LENGTH = 4096;
const MAX_ALLDAY_OPTION_LENGTH = 256;
/** DATEフィールド(`yyyy-MM-dd`)、DATETIMEフィールド(ISO 8601)の両方を許容する */
const DATE_OR_DATETIME_PATTERN = /^\d{4}-\d{2}-\d{2}(T[\d:.+-]{5,25}Z?)?$/;

export const INLINE_MESSAGE = {
  editSubmitSuccess: 'ribbit-calendar-edit-submit-success',
  editCancelled: 'ribbit-calendar-edit-cancelled',
  createSubmitSuccess: 'ribbit-calendar-create-submit-success',
  createCancelled: 'ribbit-calendar-create-cancelled',
} as const;

export interface InlineInitialValue {
  fieldCode: string;
  value: unknown;
}

interface CreateShowEvent {
  record: Record<string, { value: unknown }>;
}

let isCancelGuardInstalled = false;

const isInlineInitialValue = (value: unknown): value is InlineInitialValue => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const entry = value as { fieldCode?: unknown };
  return (
    typeof entry.fieldCode === 'string' &&
    entry.fieldCode.length > 0 &&
    entry.fieldCode.length <= MAX_FIELD_CODE_LENGTH &&
    'value' in value
  );
};

const parseInitialValues = (): InlineInitialValue[] => {
  const raw = new URLSearchParams(location.search).get(INITIAL_VALUES_PARAM);
  if (!raw || raw.length > MAX_INITIAL_VALUES_PARAM_LENGTH) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isInlineInitialValue) : [];
  } catch {
    return [];
  }
};

const getInlineCreateCondition = (): PluginCondition | null => {
  const conditionId = new URLSearchParams(location.search).get(CONDITION_ID_PARAM);
  if (!conditionId) {
    return null;
  }
  const config = restorePluginConfig();
  return config.conditions.find((condition) => condition.id === conditionId) ?? null;
};

const getAllowedInitialValueFieldCodes = (condition: PluginCondition): Set<string> =>
  new Set(
    [
      condition.calendarEvent.inputTitleField,
      condition.calendarEvent.startField,
      condition.calendarEvent.endField,
      condition.calendarEvent.allDayField,
      condition.calendarEvent.noteField,
      condition.calendarEvent.categoryField,
      condition.calendarEvent.recurrenceField,
    ].filter(Boolean)
  );

const isDateOrDateTimeValue = (value: unknown): value is string =>
  typeof value === 'string' && DATE_OR_DATETIME_PATTERN.test(value);

const isAllDayValue = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  value.length <= 10 &&
  value.every((entry) => typeof entry === 'string' && entry.length <= MAX_ALLDAY_OPTION_LENGTH);

const isTextValue = (value: unknown): value is string =>
  typeof value === 'string' && value.length <= MAX_TEXT_VALUE_LENGTH;

/** 空文字列(繰り返しなし)、または`parseRecurrenceMeta`でround-tripできる値のみ許可する */
const isRecurrenceValue = (value: unknown): value is string =>
  typeof value === 'string' && (value === '' || parseRecurrenceMeta(value) !== null);

const canApplyInitialValue = (
  condition: PluginCondition,
  fieldCode: string,
  value: unknown
): boolean => {
  const { calendarEvent } = condition;
  if (fieldCode === calendarEvent.startField || fieldCode === calendarEvent.endField) {
    return isDateOrDateTimeValue(value);
  }
  if (fieldCode === calendarEvent.allDayField) {
    return isAllDayValue(value);
  }
  if (fieldCode === calendarEvent.recurrenceField) {
    return isRecurrenceValue(value);
  }
  return isTextValue(value);
};

const pushCancelGuardState = (): void => {
  try {
    const currentState =
      typeof history.state === 'object' && history.state !== null && !Array.isArray(history.state)
        ? history.state
        : {};
    history.pushState({ ...currentState, [HISTORY_STATE_KEY]: true }, '', location.href);
  } catch (error) {
    console.warn('[calendar] 詳細編集のキャンセル検知用履歴の設定に失敗しました', error);
  }
};

const postParentMessage = (type: string, recordId?: string): void => {
  if (window.parent === window) {
    return;
  }
  window.parent.postMessage({ type, recordId }, location.origin);
};

export const isInlineEditPage = (): boolean =>
  new URLSearchParams(location.search).has(CALENDAR_INLINE_EDIT_PARAM);

export const isInlineCreatePage = (): boolean =>
  new URLSearchParams(location.search).has(CALENDAR_INLINE_CREATE_PARAM);

export const buildInlineEditUrl = (recordId: string): string =>
  `${location.pathname}show?${CALENDAR_INLINE_EDIT_PARAM}=1#record=${recordId}&mode=edit`;

export const buildInlineCreateUrl = (params: {
  condition: PluginCondition;
  initialValues: InlineInitialValue[];
}): string => {
  const { condition, initialValues } = params;

  const searchParams = new URLSearchParams({
    [CALENDAR_INLINE_CREATE_PARAM]: '1',
    [CONDITION_ID_PARAM]: condition.id,
  });

  let values = initialValues;
  let serialized = JSON.stringify(values);
  if (serialized.length > MAX_INITIAL_VALUES_PARAM_LENGTH) {
    // URL長の上限を超える場合は、長くなりがちな備考フィールドから優先的に落とす
    values = values.filter(({ fieldCode }) => fieldCode !== condition.calendarEvent.noteField);
    serialized = JSON.stringify(values);
  }
  if (values.length > 0 && serialized.length <= MAX_INITIAL_VALUES_PARAM_LENGTH) {
    searchParams.set(INITIAL_VALUES_PARAM, serialized);
  }

  return `${location.pathname}edit?${searchParams.toString()}`;
};

export const installInlineCreateCancelGuard = (): void => {
  if (isCancelGuardInstalled || window.parent === window) {
    return;
  }
  isCancelGuardInstalled = true;
  pushCancelGuardState();

  window.addEventListener('popstate', () => {
    postParentMessage(INLINE_MESSAGE.createCancelled);
    pushCancelGuardState();
  });
};

export const applyInlineCreateInitialValues = <TEvent extends CreateShowEvent>(
  event: TEvent
): TEvent => {
  if (!isInlineCreatePage()) {
    return event;
  }

  const condition = getInlineCreateCondition();
  const allowedFieldCodes = condition
    ? getAllowedInitialValueFieldCodes(condition)
    : new Set<string>();

  for (const { fieldCode, value } of parseInitialValues()) {
    if (!condition || !allowedFieldCodes.has(fieldCode)) {
      continue;
    }
    if (!canApplyInitialValue(condition, fieldCode, value)) {
      continue;
    }
    const field = event.record[fieldCode];
    if (field) {
      field.value = value;
    }
  }

  installInlineCreateCancelGuard();
  return event;
};

export const postInlineEditSubmitSuccess = (recordId: string): void =>
  postParentMessage(INLINE_MESSAGE.editSubmitSuccess, recordId);

export const postInlineEditCancelled = (): void => postParentMessage(INLINE_MESSAGE.editCancelled);

export const postInlineCreateSubmitSuccess = (recordId: string): void =>
  postParentMessage(INLINE_MESSAGE.createSubmitSuccess, recordId);

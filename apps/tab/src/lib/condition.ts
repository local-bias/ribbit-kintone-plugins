import { getFieldValueAsString, type kintoneAPI } from '@konomi-app/kintone-utilities';
import type {
  DateConditionType,
  DatePreset,
  DateValueCondition,
  FieldConditionValue,
  GeneralValueCondition,
  SelectValueCondition,
} from '@konomi-app/kintone-utilities-react';
import {
  addDays,
  addMonths,
  addYears,
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns';

/**
 * レコードの値による表示条件を評価します
 *
 * `@konomi-app/kintone-utilities-react`の`evaluateCondition`と同じ判定を行う実装です。
 * 同パッケージは1つのモジュールへ全てのUI部品(MUI・Radix・Tiptapなど)を同梱しており、
 * 1つでもimportすると操作画面のバンドルへ全て取り込まれてしまうため
 * (実測で約760KB増加)、判定のロジックだけをここに持っています。
 * 条件の型定義は同パッケージのものを型としてのみ参照します(ビルド時に消えます)。
 *
 * 設定画面の入力UI(`FieldConditionInput`)を変更した場合は、
 * この判定も追随しているか`condition.test.ts`で確認してください。
 */

/** kintoneの一覧・絞り込みと揃えて、週は月曜始まりとして扱います */
const MONDAY_START_WEEK_OPTIONS = { weekStartsOn: 1 } as const;

const GENERAL_VALUE_CONDITION_TYPES = new Set<string>([
  'equal',
  'notEqual',
  'greaterOrEqual',
  'greater',
  'lessOrEqual',
  'less',
  'includes',
  'notIncludes',
]);

const DATE_CONDITION_TYPES = new Set<string>([
  'dateEqual',
  'dateNotEqual',
  'dateBefore',
  'dateBeforeOrEqual',
  'dateAfter',
  'dateAfterOrEqual',
]);

const SELECT_CONDITION_TYPES = new Set<string>(['selectIncludes', 'selectNotIncludes']);

const isGeneralValueCondition = (
  condition: FieldConditionValue
): condition is FieldConditionValue & GeneralValueCondition =>
  GENERAL_VALUE_CONDITION_TYPES.has(condition.conditionType);

const isDateValueCondition = (
  condition: FieldConditionValue
): condition is FieldConditionValue & DateValueCondition =>
  DATE_CONDITION_TYPES.has(condition.conditionType);

const isSelectValueCondition = (
  condition: FieldConditionValue
): condition is FieldConditionValue & SelectValueCondition =>
  SELECT_CONDITION_TYPES.has(condition.conditionType);

/** 比較対象となる日付の範囲(`yyyy-MM-dd`の文字列で保持します) */
type DateRange = { start: string; end: string };

/**
 * ローカル時刻の日付を`yyyy-MM-dd`へ整形します
 *
 * `date-fns`の`format`は書式文字列を解釈するためにロケール定義を丸ごと必要とし、
 * 操作画面のバンドルが大きくなるため、固定の書式は自前で組み立てます。
 */
const toDateString = (date: Date): string =>
  [
    String(date.getFullYear()).padStart(4, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');

const createDateRange = (start: Date, end: Date): DateRange => ({
  start: toDateString(start),
  end: toDateString(end),
});

const createSingleDateRange = (date: Date): DateRange => createDateRange(date, date);

const createWeekRange = (date: Date): DateRange =>
  createDateRange(
    startOfWeek(date, MONDAY_START_WEEK_OPTIONS),
    endOfWeek(date, MONDAY_START_WEEK_OPTIONS)
  );

const createMonthRange = (date: Date, offset: number): DateRange => {
  const target = addMonths(date, offset);
  return createDateRange(startOfMonth(target), endOfMonth(target));
};

const createYearRange = (date: Date, offset: number): DateRange => {
  const target = addYears(date, offset);
  return createDateRange(startOfYear(target), endOfYear(target));
};

const resolveDatePresetRange = (preset: DatePreset): DateRange | null => {
  const today = startOfDay(new Date());
  switch (preset) {
    case 'today':
      return createSingleDateRange(today);
    case 'yesterday':
      return createSingleDateRange(addDays(today, -1));
    case 'tomorrow':
      return createSingleDateRange(addDays(today, 1));
    case 'lastWeek':
      return createWeekRange(addDays(today, -7));
    case 'thisWeek':
      return createWeekRange(today);
    case 'nextWeek':
      return createWeekRange(addDays(today, 7));
    case 'lastMonth':
      return createMonthRange(today, -1);
    case 'thisMonth':
      return createMonthRange(today, 0);
    case 'nextMonth':
      return createMonthRange(today, 1);
    case 'lastYear':
      return createYearRange(today, -1);
    case 'thisYear':
      return createYearRange(today, 0);
    case 'nextYear':
      return createYearRange(today, 1);
    default:
      return null;
  }
};

/**
 * 条件に指定された日付を、比較用の範囲へ変換します
 *
 * 保存済みの設定情報はスキーマ検証を通していないため、
 * 想定外の値では範囲を決められません。その場合は`null`を返し、
 * 判定側で「条件を満たさない」として扱います。
 */
const resolveComparisonDateRange = (condition: DateValueCondition): DateRange | null => {
  switch (condition.dateValueType) {
    case 'fixed':
      return { start: condition.dateValue, end: condition.dateValue };
    case 'relative': {
      const today = startOfDay(new Date());
      const offset = Number(condition.dateRelativeValue) || 0;
      switch (condition.dateRelativeUnit) {
        case 'day':
          return createSingleDateRange(addDays(today, offset));
        case 'month':
          return createSingleDateRange(addMonths(today, offset));
        case 'year':
          return createSingleDateRange(addYears(today, offset));
        default:
          return null;
      }
    }
    case 'preset':
      return resolveDatePresetRange(condition.datePreset);
    default:
      return null;
  }
};

const evaluateDateCondition = (
  datePart: string,
  conditionType: DateConditionType,
  range: DateRange
): boolean => {
  switch (conditionType) {
    case 'dateEqual':
      return range.start <= datePart && datePart <= range.end;
    case 'dateNotEqual':
      return datePart < range.start || range.end < datePart;
    case 'dateBefore':
      return datePart < range.start;
    case 'dateBeforeOrEqual':
      return datePart <= range.end;
    case 'dateAfter':
      return range.end < datePart;
    case 'dateAfterOrEqual':
      return range.start <= datePart;
    default:
      return false;
  }
};

/** 日時を含む値からも日付の部分だけを取り出します */
const extractDatePart = (fieldValue: string): string => fieldValue.slice(0, 10);

/**
 * フィールドの値を、比較用の文字列として取り出します
 *
 * kintoneの型定義では値が必ず存在する前提ですが、レコード追加画面の作成者・更新者のように
 * 実際には`null`が入るフィールドがあり、そのままでは例外になります。
 * 表示条件の評価が原因でレコード画面が壊れないよう、取り出せない値は空文字として扱います。
 */
const toComparableValue = (field: kintoneAPI.RecordData[string] | undefined): string => {
  if (!field) {
    return '';
  }
  try {
    return getFieldValueAsString(field);
  } catch {
    return '';
  }
};

/**
 * kintoneレコードに対して表示条件を評価し、条件を満たすかどうかを返します
 *
 * @param condition 評価する条件
 * @param record 判定対象のレコード
 * @returns 条件を満たす場合は`true`
 */
export const evaluateCondition = (
  condition: FieldConditionValue,
  record: kintoneAPI.RecordData
): boolean => {
  const { fieldCode, conditionType } = condition;

  if (conditionType === 'always') {
    return true;
  }
  if (condition.subtableCode) {
    return evaluateSubtableCondition(condition, record);
  }

  const field = record[fieldCode];
  const fieldValue = toComparableValue(field);

  if (conditionType === 'empty') {
    return fieldValue === '';
  }
  if (conditionType === 'full') {
    return fieldValue !== '';
  }

  if (isGeneralValueCondition(condition)) {
    const { conditionValue } = condition;
    switch (conditionType) {
      case 'equal':
        return fieldValue === conditionValue;
      case 'notEqual':
        return fieldValue !== conditionValue;
      case 'greaterOrEqual':
        return Number(fieldValue) >= Number(conditionValue);
      case 'greater':
        return Number(fieldValue) > Number(conditionValue);
      case 'lessOrEqual':
        return Number(fieldValue) <= Number(conditionValue);
      case 'less':
        return Number(fieldValue) < Number(conditionValue);
      case 'includes':
        return fieldValue.includes(conditionValue);
      case 'notIncludes':
        return !fieldValue.includes(conditionValue);
      default:
        return false;
    }
  }

  if (isDateValueCondition(condition)) {
    const datePart = extractDatePart(fieldValue);
    if (!datePart) {
      return false;
    }
    const range = resolveComparisonDateRange(condition);
    if (!range?.start || !range.end) {
      return false;
    }
    return evaluateDateCondition(datePart, condition.conditionType, range);
  }

  if (isSelectValueCondition(condition)) {
    if (!field) {
      return conditionType === 'selectNotIncludes';
    }
    const conditionValues = condition.conditionValue
      .split('\n')
      .map((value) => value.trim())
      .filter(Boolean);
    if (conditionValues.length === 0) {
      return false;
    }
    const fieldValues = Array.isArray(field.value)
      ? (field.value as unknown[])
      : field.value
        ? [field.value as unknown]
        : [];
    if (conditionType === 'selectIncludes') {
      return conditionValues.some((value) => fieldValues.includes(value));
    }
    return conditionValues.every((value) => !fieldValues.includes(value));
  }

  return false;
};

/**
 * サブテーブル内のフィールドに対する条件を、行ごとに評価します
 *
 * 1行でも条件を満たせば、そのテーブルは条件を満たすものとして扱います
 */
const evaluateSubtableCondition = (
  condition: FieldConditionValue,
  record: kintoneAPI.RecordData
): boolean => {
  const { subtableCode, conditionType } = condition;
  const subtableField = subtableCode ? record[subtableCode] : undefined;

  if (subtableField?.type !== 'SUBTABLE') {
    return conditionType === 'empty';
  }
  const rows = subtableField.value;
  if (rows.length === 0) {
    return conditionType === 'empty';
  }

  const flatCondition = { ...condition, subtableCode: undefined };
  return rows.some((row) => evaluateCondition(flatCondition, row.value));
};

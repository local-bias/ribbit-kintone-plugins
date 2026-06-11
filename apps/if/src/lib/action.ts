import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import { evaluateCondition } from '@konomi-app/kintone-utilities-react';
import type { FieldConditionValue, PluginCondition, RowAction } from '@/schema/plugin-config';

type RecordData = kintoneAPI.RecordData;
type FieldValue = RecordData[string];
type SubtableRow = { id?: string | null; value: RecordData };

/** 値の解決時に必要なログインユーザー情報 */
export type LoginUser = { code: string; name: string };

const pad2 = (value: number): string => value.toString().padStart(2, '0');

/** ローカルタイムゾーンでの本日の日付（YYYY-MM-DD） */
export const formatToday = (date: Date = new Date()): string =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

/** 現在時刻（HH:mm） */
export const formatNowTime = (date: Date = new Date()): string =>
  `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;

/** 現在日時（UTC ISO 8601、秒は 00） */
export const formatNowDateTime = (date: Date = new Date()): string =>
  `${date.toISOString().slice(0, 16)}:00Z`;

/**
 * フィールドタイプに応じた空の初期値を返します
 */
const getEmptyValueForType = (type: kintoneAPI.FieldPropertyType): unknown => {
  switch (type) {
    case 'CHECK_BOX':
    case 'MULTI_SELECT':
    case 'CATEGORY':
    case 'USER_SELECT':
    case 'ORGANIZATION_SELECT':
    case 'GROUP_SELECT':
    case 'FILE':
      return [];
    default:
      return '';
  }
};

/**
 * 設定された生の値を、フィールドタイプに応じたkintoneのフィールド値へ変換します
 *
 * @param field - 対象フィールド（type を参照します）
 * @param rawValue - 設定された生の値
 * @param loginUser - ログインユーザー情報
 */
export const resolveFieldValue = (
  field: FieldValue,
  rawValue: string,
  loginUser: LoginUser
): unknown => {
  const type = field.type as kintoneAPI.FieldPropertyType;
  switch (type) {
    case 'CHECK_BOX':
    case 'MULTI_SELECT':
    case 'CATEGORY':
      return rawValue
        ? rawValue
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
        : [];
    case 'USER_SELECT':
    case 'ORGANIZATION_SELECT':
    case 'GROUP_SELECT':
      if (!rawValue) {
        return [];
      }
      return rawValue
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((code) =>
          code === 'LOGINUSER' && type === 'USER_SELECT'
            ? { code: loginUser.code, name: loginUser.name }
            : { code, name: code }
        );
    case 'DATE':
      return rawValue === 'TODAY' ? formatToday() : rawValue;
    case 'DATETIME':
      return rawValue === 'NOW' || rawValue === 'TODAY' ? formatNowDateTime() : rawValue;
    case 'TIME':
      return rawValue === 'NOW' ? formatNowTime() : rawValue;
    default:
      return rawValue;
  }
};

/**
 * レコードの指定フィールドへ値をセットします（レコードを破壊的に変更します）
 */
const setFieldValue = (
  record: RecordData,
  fieldCode: string,
  rawValue: string,
  loginUser: LoginUser
): void => {
  const field = record[fieldCode];
  if (!field) {
    return;
  }
  // kintoneのフィールド値はタイプによって型が異なるため、解決後の値を代入する
  (field as { value: unknown }).value = resolveFieldValue(field, rawValue, loginUser);
};

/**
 * テンプレート行を基に、空の新規行を生成しセル値を適用します
 */
const buildNewRow = (
  template: SubtableRow,
  cellValues: RowAction['cellValues'],
  loginUser: LoginUser
): SubtableRow => {
  const value: RecordData = {};
  for (const [code, cell] of Object.entries(template.value)) {
    value[code] = {
      ...cell,
      value: getEmptyValueForType(cell.type as kintoneAPI.FieldPropertyType),
    } as FieldValue;
  }
  const newRow: SubtableRow = { id: null, value };
  for (const cellValue of cellValues) {
    if (!cellValue.fieldCode) {
      continue;
    }
    const cell = newRow.value[cellValue.fieldCode];
    if (cell) {
      (cell as { value: unknown }).value = resolveFieldValue(cell, cellValue.value, loginUser);
    }
  }
  return newRow;
};

/**
 * テーブル行アクション（追加・削除）をレコードへ適用します
 */
const applyRowAction = (record: RecordData, action: RowAction, loginUser: LoginUser): void => {
  const subtable = record[action.subtableCode];
  if (!subtable || subtable.type !== 'SUBTABLE') {
    return;
  }
  const rows = (subtable.value as unknown as SubtableRow[]) ?? [];

  if (action.type === 'exclude') {
    // 行内条件に一致する行を削除する
    const kept = rows.filter(
      (row) => !evaluateCondition(action.rowCondition, row.value as RecordData)
    );
    (subtable as { value: unknown }).value = kept;
    return;
  }

  // type === 'add'
  const template = rows[0];
  if (!template) {
    // 既存行が無く行構造を特定できない場合は追加できないためスキップする
    return;
  }
  const newRow = buildNewRow(template, action.cellValues, loginUser);
  (subtable as { value: unknown }).value = action.overwrite ? [newRow] : [...rows, newRow];
};

/**
 * 発火条件を評価し、設定の条件結合方法に従って成立しているか判定します
 */
export const isConditionMet = (condition: PluginCondition, record: RecordData): boolean => {
  const conditions = condition.conditions.filter(
    (c: FieldConditionValue) => c.conditionType === 'always' || !!c.fieldCode
  );
  if (conditions.length === 0) {
    return true;
  }
  if (condition.conditionLogic === 'or') {
    return conditions.some((c) => evaluateCondition(c, record));
  }
  return conditions.every((c) => evaluateCondition(c, record));
};

/**
 * 設定のアクション（フィールド自動入力・テーブル行操作）をレコードへ適用します
 */
export const applyActions = (
  condition: PluginCondition,
  record: RecordData,
  loginUser: LoginUser
): void => {
  for (const action of condition.fieldActions) {
    if (!action.fieldCode) {
      continue;
    }
    setFieldValue(record, action.fieldCode, action.value, loginUser);
  }
  for (const action of condition.rowActions) {
    if (!action.subtableCode) {
      continue;
    }
    applyRowAction(record, action, loginUser);
  }
};

/**
 * 条件を評価し、成立していればアクションを適用します
 *
 * @returns アクションを適用した場合は `true`
 */
export const runCondition = (
  condition: PluginCondition,
  record: RecordData,
  loginUser: LoginUser
): boolean => {
  if (!isConditionMet(condition, record)) {
    return false;
  }
  applyActions(condition, record, loginUser);
  return true;
};

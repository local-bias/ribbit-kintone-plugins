import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import { describe, expect, test } from 'vitest';
import type { PluginCondition, ValidationRule, ValidationType } from '@/schema/plugin-config';
import { validateRecords } from './build-records';

const buildRule = (type: ValidationType, value = '', errorMessage = 'NG'): ValidationRule => ({
  id: `r-${type}-${value}`,
  type,
  value,
  errorMessage,
});

const buildCondition = (overrides: Partial<PluginCondition> = {}): PluginCondition => ({
  id: 'c1',
  fieldCode: 'name',
  targetEvents: ['create', 'edit'],
  showErrorOnChange: false,
  rules: [],
  applyConditions: [],
  ...overrides,
});

const buildRecord = (values: Record<string, string>): kintoneAPI.RecordData =>
  Object.fromEntries(
    Object.entries(values).map(([code, value]) => [code, { type: 'SINGLE_LINE_TEXT', value }])
  ) as unknown as kintoneAPI.RecordData;

describe('validateRecords - CSVインポート時の入力チェック', () => {
  test('エラーがなければ空配列を返す', () => {
    const records = [buildRecord({ name: 'hello' })];
    const conditions = [buildCondition({ rules: [buildRule('maxLength', '10', '長すぎ')] })];
    expect(validateRecords(records, conditions)).toEqual([]);
  });

  test('1つの条件で複数のルールに違反した場合、すべて列挙する', () => {
    const records = [buildRecord({ name: 'hello' })];
    const conditions = [
      buildCondition({
        rules: [buildRule('numeric', '', '数字のみ'), buildRule('minLength', '10', '短すぎ')],
      }),
    ];
    expect(validateRecords(records, conditions)).toEqual([
      { rowNumber: 1, fieldCode: 'name', errorMessage: '数字のみ' },
      { rowNumber: 1, fieldCode: 'name', errorMessage: '短すぎ' },
    ]);
  });

  test('同じフィールドに対する複数の条件のエラーもすべて列挙する', () => {
    const records = [buildRecord({ name: 'hello' })];
    const conditions = [
      buildCondition({ id: 'c1', rules: [buildRule('numeric', '', '数字のみ')] }),
      buildCondition({ id: 'c2', rules: [buildRule('minLength', '10', '短すぎ')] }),
    ];
    expect(validateRecords(records, conditions)).toEqual([
      { rowNumber: 1, fieldCode: 'name', errorMessage: '数字のみ' },
      { rowNumber: 1, fieldCode: 'name', errorMessage: '短すぎ' },
    ]);
  });

  test('同じフィールドで重複するエラーメッセージは1件にまとめる', () => {
    const records = [buildRecord({ name: 'hello' })];
    const conditions = [
      buildCondition({ id: 'c1', rules: [buildRule('numeric', '', 'NG')] }),
      buildCondition({ id: 'c2', rules: [buildRule('minLength', '10', 'NG')] }),
    ];
    expect(validateRecords(records, conditions)).toEqual([
      { rowNumber: 1, fieldCode: 'name', errorMessage: 'NG' },
    ]);
  });

  test('行番号は1始まりで、行ごとにエラーを収集する', () => {
    const records = [buildRecord({ name: 'hello' }), buildRecord({ name: '' })];
    const conditions = [buildCondition({ rules: [buildRule('required', '', '必須')] })];
    expect(validateRecords(records, conditions)).toEqual([
      { rowNumber: 2, fieldCode: 'name', errorMessage: '必須' },
    ]);
  });

  test('適用条件を満たさない行はチェックしない', () => {
    const records = [buildRecord({ name: '', status: 'open' })];
    const conditions = [
      buildCondition({
        rules: [buildRule('required', '', '必須')],
        applyConditions: [{ fieldCode: 'status', conditionType: 'equal', conditionValue: 'done' }],
      }),
    ];
    expect(validateRecords(records, conditions)).toEqual([]);
  });
});

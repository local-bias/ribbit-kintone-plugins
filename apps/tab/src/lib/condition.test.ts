import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import { evaluateCondition as upstreamEvaluateCondition } from '@konomi-app/kintone-utilities-react';
import { describe, expect, test } from 'vitest';
import type { FieldConditionValue } from '@/schema/plugin-config';
import { evaluateCondition } from './condition';

/**
 * `condition.ts`は`@konomi-app/kintone-utilities-react`の`evaluateCondition`の移植です
 * (操作画面のバンドルへUIライブラリを取り込まないための措置)。
 *
 * 判定結果が本家と食い違わないことを、同じ入力を両方へ与えて確認します。
 * テストではバンドルサイズを気にする必要がないため、本家をそのまま読み込めます。
 */

const record = {
  文字列: { type: 'SINGLE_LINE_TEXT', value: 'かきくけこ' },
  空文字: { type: 'SINGLE_LINE_TEXT', value: '' },
  数値: { type: 'NUMBER', value: '100' },
  日付: { type: 'DATE', value: '2026-09-07' },
  日時: { type: 'DATETIME', value: '2026-09-07T01:23:00Z' },
  チェックボックス: { type: 'CHECK_BOX', value: ['A', 'B'] },
  ドロップダウン: { type: 'DROP_DOWN', value: 'A' },
  テーブル: {
    type: 'SUBTABLE',
    value: [
      { id: '1', value: { 明細名: { type: 'SINGLE_LINE_TEXT', value: 'りんご' } } },
      { id: '2', value: { 明細名: { type: 'SINGLE_LINE_TEXT', value: 'みかん' } } },
    ],
  },
  空のテーブル: { type: 'SUBTABLE', value: [] },
} as unknown as kintoneAPI.RecordData;

const conditions: FieldConditionValue[] = [
  { fieldCode: '文字列', conditionType: 'always' },
  { fieldCode: '文字列', conditionType: 'empty' },
  { fieldCode: '文字列', conditionType: 'full' },
  { fieldCode: '空文字', conditionType: 'empty' },
  { fieldCode: '空文字', conditionType: 'full' },
  { fieldCode: '存在しない', conditionType: 'empty' },
  { fieldCode: '存在しない', conditionType: 'full' },
  { fieldCode: '文字列', conditionType: 'equal', conditionValue: 'かきくけこ' },
  { fieldCode: '文字列', conditionType: 'equal', conditionValue: 'あいうえお' },
  { fieldCode: '文字列', conditionType: 'notEqual', conditionValue: 'かきくけこ' },
  { fieldCode: '文字列', conditionType: 'includes', conditionValue: 'くけ' },
  { fieldCode: '文字列', conditionType: 'notIncludes', conditionValue: 'くけ' },
  { fieldCode: '数値', conditionType: 'greaterOrEqual', conditionValue: '100' },
  { fieldCode: '数値', conditionType: 'greater', conditionValue: '100' },
  { fieldCode: '数値', conditionType: 'lessOrEqual', conditionValue: '100' },
  { fieldCode: '数値', conditionType: 'less', conditionValue: '100' },
  {
    fieldCode: '日付',
    conditionType: 'dateEqual',
    dateValueType: 'fixed',
    dateValue: '2026-09-07',
    dateRelativeValue: '',
    dateRelativeUnit: 'day',
    datePreset: 'today',
  },
  {
    fieldCode: '日付',
    conditionType: 'dateBefore',
    dateValueType: 'fixed',
    dateValue: '2026-09-07',
    dateRelativeValue: '',
    dateRelativeUnit: 'day',
    datePreset: 'today',
  },
  {
    fieldCode: '日付',
    conditionType: 'dateAfterOrEqual',
    dateValueType: 'fixed',
    dateValue: '2026-09-07',
    dateRelativeValue: '',
    dateRelativeUnit: 'day',
    datePreset: 'today',
  },
  {
    fieldCode: '日時',
    conditionType: 'dateNotEqual',
    dateValueType: 'fixed',
    dateValue: '2026-09-07',
    dateRelativeValue: '',
    dateRelativeUnit: 'day',
    datePreset: 'today',
  },
  {
    fieldCode: '空文字',
    conditionType: 'dateEqual',
    dateValueType: 'fixed',
    dateValue: '2026-09-07',
    dateRelativeValue: '',
    dateRelativeUnit: 'day',
    datePreset: 'today',
  },
  {
    fieldCode: 'チェックボックス',
    conditionType: 'selectIncludes',
    conditionValue: 'A\nZ',
  },
  {
    fieldCode: 'チェックボックス',
    conditionType: 'selectNotIncludes',
    conditionValue: 'A\nZ',
  },
  {
    fieldCode: 'ドロップダウン',
    conditionType: 'selectIncludes',
    conditionValue: 'A',
  },
  {
    fieldCode: '存在しない',
    conditionType: 'selectIncludes',
    conditionValue: 'A',
  },
  {
    fieldCode: '存在しない',
    conditionType: 'selectNotIncludes',
    conditionValue: 'A',
  },
  {
    fieldCode: '明細名',
    subtableCode: 'テーブル',
    conditionType: 'equal',
    conditionValue: 'みかん',
  },
  {
    fieldCode: '明細名',
    subtableCode: 'テーブル',
    conditionType: 'equal',
    conditionValue: 'ぶどう',
  },
  { fieldCode: '明細名', subtableCode: '空のテーブル', conditionType: 'empty' },
  { fieldCode: '明細名', subtableCode: '存在しない', conditionType: 'empty' },
  { fieldCode: '明細名', subtableCode: '存在しない', conditionType: 'full' },
];

/** 「今日」を基準にした相対指定・プリセット指定 */
const relativeConditions: FieldConditionValue[] = (
  [
    ['relative', 'day', '0'],
    ['relative', 'day', '-1'],
    ['relative', 'month', '1'],
    ['relative', 'year', '-1'],
  ] as const
).map(([dateValueType, dateRelativeUnit, dateRelativeValue]) => ({
  fieldCode: '日付',
  conditionType: 'dateEqual',
  dateValueType,
  dateValue: '',
  dateRelativeValue,
  dateRelativeUnit,
  datePreset: 'today',
}));

const presetConditions: FieldConditionValue[] = (
  [
    'today',
    'yesterday',
    'tomorrow',
    'lastWeek',
    'thisWeek',
    'nextWeek',
    'lastMonth',
    'thisMonth',
    'nextMonth',
    'lastYear',
    'thisYear',
    'nextYear',
  ] as const
).map((datePreset) => ({
  fieldCode: '日付',
  conditionType: 'dateAfterOrEqual',
  dateValueType: 'preset',
  dateValue: '',
  dateRelativeValue: '',
  dateRelativeUnit: 'day',
  datePreset,
}));

describe('evaluateCondition', () => {
  test.for([...conditions, ...relativeConditions, ...presetConditions])(
    '本家と同じ判定結果を返す: %o',
    (condition) => {
      expect(evaluateCondition(condition, record)).toBe(
        upstreamEvaluateCondition(condition, record)
      );
    }
  );

  test('値が取り出せないフィールドでも例外にならず、未入力として扱う', () => {
    // レコード追加画面の作成者・更新者は、型定義に反して値が`null`になる
    const brokenRecord = {
      作成者: { type: 'CREATOR', value: null },
    } as unknown as kintoneAPI.RecordData;

    expect(evaluateCondition({ fieldCode: '作成者', conditionType: 'empty' }, brokenRecord)).toBe(
      true
    );
    expect(evaluateCondition({ fieldCode: '作成者', conditionType: 'full' }, brokenRecord)).toBe(
      false
    );
  });

  test('日付の指定が壊れている場合は、条件を満たさないものとして扱う', () => {
    const broken = {
      fieldCode: '日付',
      conditionType: 'dateEqual',
    } as unknown as FieldConditionValue;

    expect(evaluateCondition(broken, record)).toBe(false);
  });
});

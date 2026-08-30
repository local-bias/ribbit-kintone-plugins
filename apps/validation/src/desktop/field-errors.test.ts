import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import { describe, expect, test } from 'vitest';
import type { PluginCondition, ValidationRule, ValidationType } from '@/schema/plugin-config';
import {
  applyFieldErrors,
  buildRecordErrorMessage,
  buildWatchedFieldMap,
  getWatchedFieldCodes,
} from './field-errors';

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

/** kintoneのレコードを模したオブジェクトを生成する */
const buildRecord = (values: Record<string, string>): kintoneAPI.RecordData =>
  Object.fromEntries(
    Object.entries(values).map(([code, value]) => [code, { type: 'SINGLE_LINE_TEXT', value }])
  ) as unknown as kintoneAPI.RecordData;

/** フィールドに設定されたエラーメッセージを取得する */
const getFieldError = (record: kintoneAPI.RecordData, fieldCode: string): unknown =>
  (record[fieldCode] as unknown as { error?: unknown } | undefined)?.error;

describe('getWatchedFieldCodes - 監視対象フィールド', () => {
  test('適用条件がない場合は対象フィールドのみ', () => {
    expect(getWatchedFieldCodes(buildCondition())).toEqual(['name']);
  });

  test('適用条件で参照しているフィールドも監視する', () => {
    const condition = buildCondition({
      applyConditions: [{ fieldCode: 'status', conditionType: 'equal', conditionValue: 'done' }],
    });
    expect(getWatchedFieldCodes(condition)).toEqual(['name', 'status']);
  });

  test('対象フィールドと適用条件のフィールドが同じ場合は重複しない', () => {
    const condition = buildCondition({
      applyConditions: [{ fieldCode: 'name', conditionType: 'equal', conditionValue: 'x' }],
    });
    expect(getWatchedFieldCodes(condition)).toEqual(['name']);
  });
});

describe('buildWatchedFieldMap - 監視フィールドと対象フィールドの対応', () => {
  test('同じフィールドを監視する複数の条件をまとめる', () => {
    const map = buildWatchedFieldMap([
      buildCondition({ id: 'c1', fieldCode: 'name' }),
      buildCondition({ id: 'c2', fieldCode: 'name' }),
      buildCondition({
        id: 'c3',
        fieldCode: 'email',
        applyConditions: [{ fieldCode: 'name', conditionType: 'equal', conditionValue: 'x' }],
      }),
    ]);
    expect(map.get('name')).toEqual(new Set(['name', 'email']));
    expect(map.get('email')).toEqual(new Set(['email']));
  });

  test('条件がない場合は空', () => {
    expect(buildWatchedFieldMap([]).size).toBe(0);
  });
});

describe('applyFieldErrors - フィールドごとのエラー設定', () => {
  test('同じフィールドの複数条件のエラーをまとめて設定する', () => {
    const record = buildRecord({ name: 'hello' });
    const conditions = [
      buildCondition({ id: 'c1', rules: [buildRule('numeric', '', '数字のみ')] }),
      buildCondition({ id: 'c2', rules: [buildRule('minLength', '10', '短すぎ')] }),
    ];

    expect(applyFieldErrors(record, ['name'], conditions)).toEqual(['name']);
    expect(getFieldError(record, 'name')).toBe('・数字のみ\n・短すぎ');
  });

  test('1件のみ違反した場合は記号を付けずに設定する', () => {
    const record = buildRecord({ name: 'hello' });
    const conditions = [
      buildCondition({ id: 'c1', rules: [buildRule('numeric', '', '数字のみ')] }),
      buildCondition({ id: 'c2', rules: [buildRule('maxLength', '10', '長すぎ')] }),
    ];

    expect(applyFieldErrors(record, ['name'], conditions)).toEqual(['name']);
    expect(getFieldError(record, 'name')).toBe('数字のみ');
  });

  test('すべて満たしている場合はエラーを解除する', () => {
    const record = buildRecord({ name: 'hello' });
    const conditions = [buildCondition({ rules: [buildRule('maxLength', '10', '長すぎ')] })];

    expect(applyFieldErrors(record, ['name'], conditions)).toEqual([]);
    expect(getFieldError(record, 'name')).toBeNull();
  });

  test('他のフィールドを対象とする条件はエラー設定に影響しない', () => {
    const record = buildRecord({ name: 'hello', email: 'invalid' });
    const conditions = [
      buildCondition({ id: 'c1', fieldCode: 'name', rules: [buildRule('alpha', '', '英字のみ')] }),
      buildCondition({
        id: 'c2',
        fieldCode: 'email',
        rules: [buildRule('email', '', 'メール形式')],
      }),
    ];

    expect(applyFieldErrors(record, ['name'], conditions)).toEqual([]);
    expect(getFieldError(record, 'name')).toBeNull();
    expect(getFieldError(record, 'email')).toBeUndefined();
  });

  test('複数の対象フィールドをまとめて検証する', () => {
    const record = buildRecord({ name: 'hello', email: 'invalid' });
    const conditions = [
      buildCondition({
        id: 'c1',
        fieldCode: 'name',
        rules: [buildRule('numeric', '', '数字のみ')],
      }),
      buildCondition({
        id: 'c2',
        fieldCode: 'email',
        rules: [buildRule('email', '', 'メール形式')],
      }),
    ];

    expect(applyFieldErrors(record, ['name', 'email'], conditions)).toEqual(['name', 'email']);
    expect(getFieldError(record, 'name')).toBe('数字のみ');
    expect(getFieldError(record, 'email')).toBe('メール形式');
  });

  test('レコードに存在しないフィールドは検証せず、エラーにもしない', () => {
    // フィールドの削除やアクセス権により、設定対象のフィールドがレコードに含まれない場合。
    // エラーにすると、利用者が修正できないまま保存できなくなってしまう。
    const record = buildRecord({ name: 'hello' });
    const conditions = [
      buildCondition({ fieldCode: 'missing', rules: [buildRule('required', '', '必須')] }),
    ];

    expect(applyFieldErrors(record, ['missing'], conditions)).toEqual([]);
    expect(getFieldError(record, 'missing')).toBeUndefined();
  });
});

describe('buildRecordErrorMessage - 画面上部のエラーメッセージ', () => {
  const heading = '以下の入力内容にエラーがあるため保存できません。';

  test('kintone標準に倣い、見出しの下にフィールド名を箇条書きで並べる', () => {
    expect(buildRecordErrorMessage(['氏名', 'メールアドレス'], heading)).toBe(
      `${heading}\n\n・氏名\n・メールアドレス`
    );
  });

  test('1件の場合も同じ形式で表示する', () => {
    expect(buildRecordErrorMessage(['氏名'], heading)).toBe(`${heading}\n\n・氏名`);
  });

  test('共通設定で指定された見出しを使用する', () => {
    // 見出しはプラグインの共通設定から変更できる
    expect(buildRecordErrorMessage(['氏名'], 'カスタム見出し')).toBe('カスタム見出し\n\n・氏名');
  });

  test('エラーが1件もない場合は、見出しも含めて空文字列', () => {
    expect(buildRecordErrorMessage([], heading)).toBe('');
  });
});

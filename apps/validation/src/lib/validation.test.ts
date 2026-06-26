import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import { describe, expect, test } from 'vitest';
import type { PluginCondition, ValidationRule, ValidationType } from '@/schema/plugin-config';
import { shouldApplyValidation, validateCondition, validateRule } from './validation';

/**
 * テスト用の `ValidationRule` を生成するヘルパー。
 */
const buildRule = (type: ValidationType, value = '', errorMessage = 'NG'): ValidationRule => ({
  id: 'r1',
  type,
  value,
  errorMessage,
});

/**
 * テスト用の単一行テキストフィールドを生成するヘルパー。
 */
const textField = (value: string): kintoneAPI.Field =>
  ({ type: 'SINGLE_LINE_TEXT', value }) as unknown as kintoneAPI.Field;

describe('validateRule - required（必須入力）', () => {
  test('値が空の場合は無効になりエラーメッセージを返す', () => {
    const result = validateRule(buildRule('required', '', '必須です'), textField(''));
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toBe('必須です');
  });

  test('値が存在する場合は有効になる', () => {
    expect(validateRule(buildRule('required'), textField('hello')).isValid).toBe(true);
  });

  test('フィールド自体が undefined の場合は無効になる', () => {
    expect(validateRule(buildRule('required'), undefined).isValid).toBe(false);
  });

  test('空配列（複数選択など）は未入力として扱う', () => {
    const field = { type: 'CHECK_BOX', value: [] } as unknown as kintoneAPI.Field;
    expect(validateRule(buildRule('required'), field).isValid).toBe(false);
  });
});

describe('validateRule - 文字数チェック', () => {
  test('minLength: 文字数が下回ると無効', () => {
    expect(validateRule(buildRule('minLength', '3'), textField('ab')).isValid).toBe(false);
  });

  test('minLength: 文字数を満たすと有効', () => {
    expect(validateRule(buildRule('minLength', '3'), textField('abc')).isValid).toBe(true);
  });

  test('minLength: 空文字はチェック対象外（有効）', () => {
    expect(validateRule(buildRule('minLength', '3'), textField('')).isValid).toBe(true);
  });

  test('minLength: 数値に変換できない場合は有効として扱う', () => {
    expect(validateRule(buildRule('minLength', 'abc'), textField('a')).isValid).toBe(true);
  });

  test('maxLength: 文字数を超えると無効', () => {
    expect(validateRule(buildRule('maxLength', '3'), textField('abcd')).isValid).toBe(false);
  });

  test('maxLength: 上限ちょうどは有効', () => {
    expect(validateRule(buildRule('maxLength', '3'), textField('abc')).isValid).toBe(true);
  });

  test('exactLength: 文字数が一致すると有効、しないと無効', () => {
    expect(validateRule(buildRule('exactLength', '4'), textField('abcd')).isValid).toBe(true);
    expect(validateRule(buildRule('exactLength', '4'), textField('abc')).isValid).toBe(false);
  });

  test('exactLength: 空文字はチェック対象外（有効）', () => {
    expect(validateRule(buildRule('exactLength', '4'), textField('')).isValid).toBe(true);
  });
});

describe('validateRule - pattern（正規表現）', () => {
  test('パターンに一致すると有効', () => {
    expect(validateRule(buildRule('pattern', '^A\\d+$'), textField('A123')).isValid).toBe(true);
  });

  test('パターンに一致しないと無効', () => {
    expect(validateRule(buildRule('pattern', '^A\\d+$'), textField('B123')).isValid).toBe(false);
  });

  test('空文字はチェック対象外（有効）', () => {
    expect(validateRule(buildRule('pattern', '^A\\d+$'), textField('')).isValid).toBe(true);
  });

  test('無効な正規表現の場合は有効として扱う（例外を握りつぶす）', () => {
    expect(validateRule(buildRule('pattern', '['), textField('anything')).isValid).toBe(true);
  });
});

describe('validateRule - 数値チェック', () => {
  test('minValue: 下回ると無効、満たすと有効', () => {
    expect(validateRule(buildRule('minValue', '10'), textField('5')).isValid).toBe(false);
    expect(validateRule(buildRule('minValue', '10'), textField('10')).isValid).toBe(true);
  });

  test('maxValue: 超えると無効、ちょうどは有効', () => {
    expect(validateRule(buildRule('maxValue', '10'), textField('11')).isValid).toBe(false);
    expect(validateRule(buildRule('maxValue', '10'), textField('10')).isValid).toBe(true);
  });

  test('数値でない入力はチェック対象外（有効）', () => {
    expect(validateRule(buildRule('minValue', '10'), textField('abc')).isValid).toBe(true);
  });

  test('range: 範囲内は有効、範囲外は無効', () => {
    expect(validateRule(buildRule('range', '1-10'), textField('5')).isValid).toBe(true);
    expect(validateRule(buildRule('range', '1-10'), textField('11')).isValid).toBe(false);
  });

  test('range: min-max 形式でない場合は有効として扱う', () => {
    expect(validateRule(buildRule('range', '1to10'), textField('100')).isValid).toBe(true);
  });
});

describe('validateRule - 形式チェック', () => {
  const cases: Array<[ValidationType, string, string]> = [
    // [type, 有効な値, 無効な値]
    ['email', 'test@example.com', 'not-an-email'],
    ['url', 'https://example.com', 'example.com'],
    ['phone', '03-1234-5678', '12-345'],
    ['postalCode', '123-4567', '1234'],
    ['alphanumeric', 'abc123', 'abc-123'],
    ['numeric', '12345', '12a45'],
    ['alpha', 'abcDEF', 'abc123'],
    ['hiragana', 'ひらがな', 'カタカナ'],
    ['katakana', 'カタカナ', 'ひらがな'],
    ['halfwidthKatakana', 'ｶﾀｶﾅ', 'カタカナ'],
    ['fullwidth', 'あいうえお', 'abc'],
    ['halfwidth', 'abc123', 'あいうえお'],
    ['fullwidthAlphanumeric', 'ＡＢＣ１２３', 'ABC123'],
    ['corporateNumber', '1234567890123', '12345'],
    ['bankAccount', '1234567', '123'],
  ];

  test.each(cases)('%s: 有効な値はパスし、無効な値は弾く', (type, valid, invalid) => {
    expect(validateRule(buildRule(type), textField(valid)).isValid).toBe(true);
    expect(validateRule(buildRule(type), textField(invalid)).isValid).toBe(false);
  });

  test('各形式チェックは空文字を許容する（必須チェックは別ルール）', () => {
    for (const [type] of cases) {
      expect(validateRule(buildRule(type), textField('')).isValid).toBe(true);
    }
  });
});

describe('validateRule - 文字列の包含・前後一致', () => {
  test('contains: 指定文字列を含むと有効', () => {
    expect(validateRule(buildRule('contains', 'abc'), textField('xabcy')).isValid).toBe(true);
    expect(validateRule(buildRule('contains', 'abc'), textField('xyz')).isValid).toBe(false);
  });

  test('notContains: 指定文字列を含まないと有効', () => {
    expect(validateRule(buildRule('notContains', 'abc'), textField('xyz')).isValid).toBe(true);
    expect(validateRule(buildRule('notContains', 'abc'), textField('xabcy')).isValid).toBe(false);
  });

  test('startsWith: 指定文字列で始まると有効', () => {
    expect(validateRule(buildRule('startsWith', 'pre'), textField('prefix')).isValid).toBe(true);
    expect(validateRule(buildRule('startsWith', 'pre'), textField('suffix')).isValid).toBe(false);
  });

  test('endsWith: 指定文字列で終わると有効', () => {
    expect(validateRule(buildRule('endsWith', 'ing'), textField('testing')).isValid).toBe(true);
    expect(validateRule(buildRule('endsWith', 'ing'), textField('tested')).isValid).toBe(false);
  });
});

describe('validateRule - 未対応のルール種別', () => {
  test('custom（将来拡張用）は常に有効を返す', () => {
    expect(validateRule(buildRule('custom'), textField('anything')).isValid).toBe(true);
  });
});

describe('shouldApplyValidation - 適用条件', () => {
  const baseCondition = (overrides: Partial<PluginCondition> = {}): PluginCondition => ({
    id: 'c1',
    fieldCode: 'name',
    targetEvents: ['create', 'edit'],
    showErrorOnChange: false,
    rules: [],
    applyConditions: [],
    ...overrides,
  });

  test('適用条件が未設定なら常に適用する', () => {
    const record = {} as kintoneAPI.RecordData;
    expect(shouldApplyValidation(baseCondition(), record)).toBe(true);
  });

  test('適用条件を満たす場合のみ適用する', () => {
    const condition = baseCondition({
      applyConditions: [{ fieldCode: 'status', conditionType: 'equal', conditionValue: 'done' }],
    });
    const matched = {
      status: { type: 'SINGLE_LINE_TEXT', value: 'done' },
    } as unknown as kintoneAPI.RecordData;
    const unmatched = {
      status: { type: 'SINGLE_LINE_TEXT', value: 'open' },
    } as unknown as kintoneAPI.RecordData;
    expect(shouldApplyValidation(condition, matched)).toBe(true);
    expect(shouldApplyValidation(condition, unmatched)).toBe(false);
  });

  test('複数の適用条件はすべて満たす場合のみ適用する（AND）', () => {
    const condition = baseCondition({
      applyConditions: [
        { fieldCode: 'status', conditionType: 'equal', conditionValue: 'done' },
        { fieldCode: 'flag', conditionType: 'equal', conditionValue: 'yes' },
      ],
    });
    const record = {
      status: { type: 'SINGLE_LINE_TEXT', value: 'done' },
      flag: { type: 'SINGLE_LINE_TEXT', value: 'no' },
    } as unknown as kintoneAPI.RecordData;
    expect(shouldApplyValidation(condition, record)).toBe(false);
  });
});

describe('validateCondition - 条件全体のバリデーション', () => {
  const baseCondition = (overrides: Partial<PluginCondition> = {}): PluginCondition => ({
    id: 'c1',
    fieldCode: 'name',
    targetEvents: ['create', 'edit'],
    showErrorOnChange: false,
    rules: [],
    applyConditions: [],
    ...overrides,
  });

  test('すべてのルールを満たせば有効', () => {
    const condition = baseCondition({
      rules: [buildRule('required', '', '必須'), buildRule('maxLength', '10', '長すぎ')],
    });
    const record = {
      name: { type: 'SINGLE_LINE_TEXT', value: 'hello' },
    } as unknown as kintoneAPI.RecordData;
    expect(validateCondition(condition, record)).toEqual({ isValid: true, errorMessage: '' });
  });

  test('最初に失敗したルールのエラーメッセージを返す', () => {
    const condition = baseCondition({
      rules: [buildRule('required', '', '必須'), buildRule('maxLength', '3', '長すぎ')],
    });
    const record = {
      name: { type: 'SINGLE_LINE_TEXT', value: 'hello' },
    } as unknown as kintoneAPI.RecordData;
    const result = validateCondition(condition, record);
    expect(result.isValid).toBe(false);
    expect(result.errorMessage).toBe('長すぎ');
  });

  test('適用条件を満たさない場合はルール違反でも有効扱いになる', () => {
    const condition = baseCondition({
      applyConditions: [{ fieldCode: 'status', conditionType: 'equal', conditionValue: 'done' }],
      rules: [buildRule('required', '', '必須')],
    });
    const record = {
      status: { type: 'SINGLE_LINE_TEXT', value: 'open' },
      name: { type: 'SINGLE_LINE_TEXT', value: '' },
    } as unknown as kintoneAPI.RecordData;
    expect(validateCondition(condition, record)).toEqual({ isValid: true, errorMessage: '' });
  });
});

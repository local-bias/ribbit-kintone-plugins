import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import { describe, expect, test } from 'vitest';
import type { PluginCondition, ValidationRule, ValidationType } from '@/schema/plugin-config';
import {
  combineErrorMessages,
  mergeValidationResults,
  shouldApplyValidation,
  validateCondition,
  validateRule,
} from './validation';

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

  test('添付ファイルフィールドは、値が空でも常に有効として扱う（kintoneの仕様上、保存時イベントでは新規添付が反映されないため）', () => {
    const field = { type: 'FILE', value: [] } as unknown as kintoneAPI.Field;
    expect(validateRule(buildRule('required'), field).isValid).toBe(true);
  });

  test('添付ファイルフィールドは、値が存在していても有効として扱う', () => {
    const field = {
      type: 'FILE',
      value: [{ contentType: 'text/plain', fileKey: 'key', name: 'a.txt', size: '1' }],
    } as unknown as kintoneAPI.Field;
    expect(validateRule(buildRule('required'), field).isValid).toBe(true);
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
    expect(validateCondition(condition, record)).toEqual({
      isValid: true,
      errorMessage: '',
      errorMessages: [],
    });
  });

  test('失敗したルールのエラーメッセージを返す', () => {
    const condition = baseCondition({
      rules: [buildRule('required', '', '必須'), buildRule('maxLength', '3', '長すぎ')],
    });
    const record = {
      name: { type: 'SINGLE_LINE_TEXT', value: 'hello' },
    } as unknown as kintoneAPI.RecordData;
    const result = validateCondition(condition, record);
    expect(result.isValid).toBe(false);
    expect(result.errorMessages).toEqual(['長すぎ']);
    expect(result.errorMessage).toBe('長すぎ');
  });

  test('複数のルールに違反した場合、すべてのエラーメッセージを返す', () => {
    const condition = baseCondition({
      rules: [
        buildRule('minLength', '10', '短すぎ'),
        buildRule('numeric', '', '数字のみ'),
        buildRule('maxLength', '3', '長すぎ'),
      ],
    });
    const record = {
      name: { type: 'SINGLE_LINE_TEXT', value: 'hello' },
    } as unknown as kintoneAPI.RecordData;
    const result = validateCondition(condition, record);
    expect(result.isValid).toBe(false);
    expect(result.errorMessages).toEqual(['短すぎ', '数字のみ', '長すぎ']);
    expect(result.errorMessage).toBe('・短すぎ\n・数字のみ\n・長すぎ');
  });

  test('違反したルールのみを、設定順のまま返す', () => {
    const condition = baseCondition({
      rules: [
        buildRule('required', '', '必須'),
        buildRule('numeric', '', '数字のみ'),
        buildRule('maxLength', '10', '長すぎ'),
        buildRule('minLength', '10', '短すぎ'),
      ],
    });
    const record = {
      name: { type: 'SINGLE_LINE_TEXT', value: 'hello' },
    } as unknown as kintoneAPI.RecordData;
    expect(validateCondition(condition, record).errorMessages).toEqual(['数字のみ', '短すぎ']);
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
    expect(validateCondition(condition, record)).toEqual({
      isValid: true,
      errorMessage: '',
      errorMessages: [],
    });
  });
});

describe('combineErrorMessages - エラーメッセージの連結', () => {
  test('エラーがない場合は空文字列', () => {
    expect(combineErrorMessages([])).toBe('');
  });

  test('1件の場合はそのまま返す', () => {
    expect(combineErrorMessages(['必須'])).toBe('必須');
  });

  test('複数件の場合は箇条書きで連結する', () => {
    expect(combineErrorMessages(['必須', '長すぎ'])).toBe('・必須\n・長すぎ');
  });
});

describe('mergeValidationResults - 複数条件の結果の統合', () => {
  const baseCondition = (overrides: Partial<PluginCondition> = {}): PluginCondition => ({
    id: 'c1',
    fieldCode: 'name',
    targetEvents: ['create', 'edit'],
    showErrorOnChange: false,
    rules: [],
    applyConditions: [],
    ...overrides,
  });

  const record = {
    name: { type: 'SINGLE_LINE_TEXT', value: 'hello' },
  } as unknown as kintoneAPI.RecordData;

  test('すべて有効なら有効', () => {
    expect(mergeValidationResults([])).toEqual({
      isValid: true,
      errorMessage: '',
      errorMessages: [],
    });
  });

  test('同じフィールドに対する複数条件のエラーをすべてまとめる', () => {
    const results = [
      validateCondition(baseCondition({ rules: [buildRule('numeric', '', '数字のみ')] }), record),
      validateCondition(
        baseCondition({ id: 'c2', rules: [buildRule('minLength', '10', '短すぎ')] }),
        record
      ),
    ];
    const merged = mergeValidationResults(results);
    expect(merged.isValid).toBe(false);
    expect(merged.errorMessages).toEqual(['数字のみ', '短すぎ']);
    expect(merged.errorMessage).toBe('・数字のみ\n・短すぎ');
  });

  test('重複するエラーメッセージは1つにまとめる', () => {
    const results = [
      validateCondition(baseCondition({ rules: [buildRule('numeric', '', 'NG')] }), record),
      validateCondition(
        baseCondition({ id: 'c2', rules: [buildRule('minLength', '10', 'NG')] }),
        record
      ),
    ];
    expect(mergeValidationResults(results).errorMessages).toEqual(['NG']);
  });
});

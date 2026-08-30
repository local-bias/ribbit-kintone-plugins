import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import { evaluateCondition, type FieldConditionValue } from '@konomi-app/kintone-utilities-react';
import { PLUGIN_NAME } from '@/lib/constants';
import type { PluginCondition, ValidationRule } from '@/schema/plugin-config';

type RecordData = kintoneAPI.RecordData;

/**
 * 適用条件を満たしているかどうかを判定します。
 *
 * - 適用条件が未設定の場合は常に`true`（常にバリデーションを適用）。
 * - 適用条件が設定されている場合、すべての条件を満たすときのみ`true`。
 */
export function shouldApplyValidation(condition: PluginCondition, record: RecordData): boolean {
  const applyConditions = (condition.applyConditions ?? []) as FieldConditionValue[];
  if (applyConditions.length === 0) {
    return true;
  }
  return applyConditions.every((c) => evaluateCondition(c, record));
}

/**
 * バリデーションの結果
 */
export interface ValidationResult {
  isValid: boolean;
  /**
   * 表示用に連結されたエラーメッセージ。
   * エラーが複数ある場合は、すべてを箇条書きで連結する。
   * エラーがない場合は空文字列。
   */
  errorMessage: string;
  /** チェックを通過できなかったすべてのエラーメッセージ */
  errorMessages: string[];
}

/**
 * 複数のエラーメッセージを、1つの表示用文字列に連結します。
 *
 * kintoneのエラー表示領域は改行をそのまま反映しない場合があるため、
 * 2件以上ある場合は各メッセージの先頭に記号を付与し、改行が無視されても
 * それぞれのメッセージを区別できるようにする。
 */
export function combineErrorMessages(errorMessages: string[]): string {
  if (errorMessages.length === 0) {
    return '';
  }
  if (errorMessages.length === 1) {
    return errorMessages[0] ?? '';
  }
  return errorMessages.map((message) => `・${message}`).join('\n');
}

/**
 * 複数のエラーメッセージからバリデーション結果を生成します。
 */
function buildResult(errorMessages: string[]): ValidationResult {
  return {
    isValid: errorMessages.length === 0,
    errorMessage: combineErrorMessages(errorMessages),
    errorMessages,
  };
}

/**
 * バリデーションルールを満たしているかどうかを判定します。
 *
 * ルールのパラメータが不正な場合（数値として解釈できない、正規表現として
 * 不正など）は、チェック自体を行わず`true`を返します。
 */
function isRuleSatisfied(rule: ValidationRule, value: kintoneAPI.Field | undefined): boolean {
  const fieldValue = value?.value;
  const strValue = String(fieldValue ?? '');
  const isEmpty =
    fieldValue === undefined ||
    fieldValue === null ||
    fieldValue === '' ||
    (Array.isArray(fieldValue) && fieldValue.length === 0);

  switch (rule.type) {
    case 'required': {
      // 必須入力チェック
      // 添付ファイルフィールドはkintoneの仕様上、レコード保存イベント発火時点では
      // 新たに添付したファイルの情報がrecordに反映されないため、
      // 必須チェックの対象から除外する（常に有効として扱う）。
      if (value?.type === 'FILE') {
        return true;
      }
      return !isEmpty;
    }
    case 'minLength': {
      // 最小文字数チェック
      const minLength = parseInt(rule.value, 10);
      if (Number.isNaN(minLength)) {
        return true;
      }
      return strValue.length === 0 || strValue.length >= minLength;
    }
    case 'maxLength': {
      // 最大文字数チェック
      const maxLength = parseInt(rule.value, 10);
      if (Number.isNaN(maxLength)) {
        return true;
      }
      return strValue.length <= maxLength;
    }
    case 'exactLength': {
      // 正確な文字数チェック
      const exactLength = parseInt(rule.value, 10);
      if (Number.isNaN(exactLength)) {
        return true;
      }
      return strValue.length === 0 || strValue.length === exactLength;
    }
    case 'pattern': {
      // 正規表現チェック
      try {
        const pattern = new RegExp(rule.value);
        // 空の場合はパスする（必須チェックは別途行う）
        return strValue.length === 0 || pattern.test(strValue);
      } catch {
        console.error(`[${PLUGIN_NAME}] 無効な正規表現: ${rule.value}`);
        return true;
      }
    }
    case 'minValue': {
      // 最小値チェック（数値フィールド用）
      const minValue = parseFloat(rule.value);
      if (Number.isNaN(minValue)) {
        return true;
      }
      const numValue = parseFloat(strValue);
      // 空または非数値の場合はパスする
      if (isEmpty || Number.isNaN(numValue)) {
        return true;
      }
      return numValue >= minValue;
    }
    case 'maxValue': {
      // 最大値チェック（数値フィールド用）
      const maxValue = parseFloat(rule.value);
      if (Number.isNaN(maxValue)) {
        return true;
      }
      const numValue = parseFloat(strValue);
      // 空または非数値の場合はパスする
      if (isEmpty || Number.isNaN(numValue)) {
        return true;
      }
      return numValue <= maxValue;
    }
    case 'range': {
      // 数値の範囲チェック（min-max形式）
      const parts = rule.value.split('-').map((s) => s.trim());
      if (parts.length !== 2) {
        return true;
      }
      const minValue = parseFloat(parts[0] ?? '');
      const maxValue = parseFloat(parts[1] ?? '');
      if (Number.isNaN(minValue) || Number.isNaN(maxValue)) {
        return true;
      }
      const numValue = parseFloat(strValue);
      if (isEmpty || Number.isNaN(numValue)) {
        return true;
      }
      return numValue >= minValue && numValue <= maxValue;
    }
    case 'email': {
      // メールアドレス形式チェック
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return strValue.length === 0 || emailPattern.test(strValue);
    }
    case 'url': {
      // URL形式チェック
      const urlPattern = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
      return strValue.length === 0 || urlPattern.test(strValue);
    }
    case 'phone': {
      // 電話番号形式チェック（日本）
      // ハイフンあり/なし、携帯電話、固定電話に対応
      const phonePattern = /^0\d{1,4}[-]?\d{1,4}[-]?\d{3,4}$/;
      return strValue.length === 0 || phonePattern.test(strValue);
    }
    case 'postalCode': {
      // 郵便番号形式チェック（日本）
      // ハイフンあり/なしに対応
      const postalPattern = /^\d{3}[-]?\d{4}$/;
      return strValue.length === 0 || postalPattern.test(strValue);
    }
    case 'alphanumeric': {
      // 英数字のみチェック
      const alphanumericPattern = /^[a-zA-Z0-9]*$/;
      return strValue.length === 0 || alphanumericPattern.test(strValue);
    }
    case 'numeric': {
      // 数字のみチェック
      const numericPattern = /^[0-9]*$/;
      return strValue.length === 0 || numericPattern.test(strValue);
    }
    case 'alpha': {
      // 英字のみチェック
      const alphaPattern = /^[a-zA-Z]*$/;
      return strValue.length === 0 || alphaPattern.test(strValue);
    }
    case 'hiragana': {
      // ひらがなのみチェック
      const hiraganaPattern = /^[\u3040-\u309F\u30FC]*$/;
      return strValue.length === 0 || hiraganaPattern.test(strValue);
    }
    case 'katakana': {
      // カタカナのみチェック（全角）
      const katakanaPattern = /^[\u30A0-\u30FF\u30FC]*$/;
      return strValue.length === 0 || katakanaPattern.test(strValue);
    }
    case 'halfwidthKatakana': {
      // 半角カタカナのみチェック
      // 半角カタカナは U+FF65-U+FF9F の範囲
      const halfwidthKatakanaPattern = /^[\uFF65-\uFF9F]*$/;
      return strValue.length === 0 || halfwidthKatakanaPattern.test(strValue);
    }
    case 'fullwidth': {
      // 全角文字のみチェック
      // 全角文字は半角ASCII (U+0020-U+007E) と半角カナ (U+FF65-U+FF9F) 以外
      const halfwidthPattern = /[\u0020-\u007E\uFF65-\uFF9F]/;
      return strValue.length === 0 || !halfwidthPattern.test(strValue);
    }
    case 'halfwidth': {
      // 半角文字のみチェック
      // 半角ASCII (U+0020-U+007E) と半角カナ (U+FF65-U+FF9F)
      const halfwidthPattern = /^[\u0020-\u007E\uFF65-\uFF9F]*$/;
      return strValue.length === 0 || halfwidthPattern.test(strValue);
    }
    case 'fullwidthAlphanumeric': {
      // 全角英数字のみチェック
      // 全角英数字は U+FF10-U+FF19（数字）, U+FF21-U+FF3A（大文字）, U+FF41-U+FF5A（小文字）
      const fullwidthAlphanumericPattern = /^[\uFF10-\uFF19\uFF21-\uFF3A\uFF41-\uFF5A]*$/;
      return strValue.length === 0 || fullwidthAlphanumericPattern.test(strValue);
    }
    case 'corporateNumber': {
      // 法人番号チェック（13桁の数字）
      // 日本の法人番号は13桁の数字で、最初の1桁はチェックディジット
      const corporateNumberPattern = /^[0-9]{13}$/;
      return strValue.length === 0 || corporateNumberPattern.test(strValue);
    }
    case 'bankAccount': {
      // 銀行口座番号形式チェック
      // 日本の銀行口座番号は通常7桁、ゆうちょ銀行は8桁
      // ハイフンなしの数字のみ、7〜8桁を許容
      const bankAccountPattern = /^[0-9]{7,8}$/;
      return strValue.length === 0 || bankAccountPattern.test(strValue);
    }
    case 'contains': {
      // 特定の文字列を含むチェック
      return strValue.length === 0 || strValue.includes(rule.value);
    }
    case 'notContains': {
      // 特定の文字列を含まないチェック
      return strValue.length === 0 || !strValue.includes(rule.value);
    }
    case 'startsWith': {
      // 特定の文字列で始まるチェック
      return strValue.length === 0 || strValue.startsWith(rule.value);
    }
    case 'endsWith': {
      // 特定の文字列で終わるチェック
      return strValue.length === 0 || strValue.endsWith(rule.value);
    }
    default:
      return true;
  }
}

/**
 * 単一のバリデーションルールを実行します。
 *
 * 複数のルールをまとめて検証する場合は`validateCondition`を使用してください。
 */
export function validateRule(
  rule: ValidationRule,
  value: kintoneAPI.Field | undefined
): ValidationResult {
  return buildResult(isRuleSatisfied(rule, value) ? [] : [rule.errorMessage]);
}

/**
 * 条件に対するバリデーションを実行します。
 *
 * 1つの条件に複数のルールが設定されている場合、最初に違反したルールで
 * 中断せず、すべてのルールを検証してエラーメッセージをまとめて返します。
 */
export function validateCondition(
  condition: PluginCondition,
  record: RecordData
): ValidationResult {
  // 適用条件を満たさない場合はバリデーションをスキップ（常に有効扱い）
  if (!shouldApplyValidation(condition, record)) {
    return buildResult([]);
  }

  const field = record[condition.fieldCode];
  const errorMessages = condition.rules
    .filter((rule) => !isRuleSatisfied(rule, field))
    .map((rule) => rule.errorMessage);

  return buildResult(errorMessages);
}

/**
 * 同一フィールドに対する複数の条件のバリデーション結果を、1つにまとめます。
 * 重複するエラーメッセージは1つにまとめられます。
 */
export function mergeValidationResults(results: ValidationResult[]): ValidationResult {
  const errorMessages = Array.from(new Set(results.flatMap((result) => result.errorMessages)));
  return buildResult(errorMessages);
}

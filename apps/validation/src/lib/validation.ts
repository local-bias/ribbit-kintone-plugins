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
  errorMessage: string;
}

/**
 * バリデーションルールを実行します
 */
export function validateRule(
  rule: ValidationRule,
  value: kintoneAPI.Field | undefined
): ValidationResult {
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
      return {
        isValid: !isEmpty,
        errorMessage: isEmpty ? rule.errorMessage : '',
      };
    }
    case 'minLength': {
      // 最小文字数チェック
      const minLength = parseInt(rule.value, 10);
      if (Number.isNaN(minLength)) {
        return { isValid: true, errorMessage: '' };
      }
      const isValid = strValue.length === 0 || strValue.length >= minLength;
      return {
        isValid,
        errorMessage: isValid ? '' : rule.errorMessage,
      };
    }
    case 'maxLength': {
      // 最大文字数チェック
      const maxLength = parseInt(rule.value, 10);
      if (Number.isNaN(maxLength)) {
        return { isValid: true, errorMessage: '' };
      }
      const isValid = strValue.length <= maxLength;
      return {
        isValid,
        errorMessage: isValid ? '' : rule.errorMessage,
      };
    }
    case 'exactLength': {
      // 正確な文字数チェック
      const exactLength = parseInt(rule.value, 10);
      if (Number.isNaN(exactLength)) {
        return { isValid: true, errorMessage: '' };
      }
      const isValid = strValue.length === 0 || strValue.length === exactLength;
      return {
        isValid,
        errorMessage: isValid ? '' : rule.errorMessage,
      };
    }
    case 'pattern': {
      // 正規表現チェック
      try {
        const pattern = new RegExp(rule.value);
        // 空の場合はパスする（必須チェックは別途行う）
        const isValid = strValue.length === 0 || pattern.test(strValue);
        return {
          isValid,
          errorMessage: isValid ? '' : rule.errorMessage,
        };
      } catch {
        console.error(`[${PLUGIN_NAME}] 無効な正規表現: ${rule.value}`);
        return { isValid: true, errorMessage: '' };
      }
    }
    case 'minValue': {
      // 最小値チェック（数値フィールド用）
      const minValue = parseFloat(rule.value);
      if (Number.isNaN(minValue)) {
        return { isValid: true, errorMessage: '' };
      }
      const numValue = parseFloat(strValue);
      // 空または非数値の場合はパスする
      if (isEmpty || Number.isNaN(numValue)) {
        return { isValid: true, errorMessage: '' };
      }
      const isValid = numValue >= minValue;
      return {
        isValid,
        errorMessage: isValid ? '' : rule.errorMessage,
      };
    }
    case 'maxValue': {
      // 最大値チェック（数値フィールド用）
      const maxValue = parseFloat(rule.value);
      if (Number.isNaN(maxValue)) {
        return { isValid: true, errorMessage: '' };
      }
      const numValue = parseFloat(strValue);
      // 空または非数値の場合はパスする
      if (isEmpty || Number.isNaN(numValue)) {
        return { isValid: true, errorMessage: '' };
      }
      const isValid = numValue <= maxValue;
      return {
        isValid,
        errorMessage: isValid ? '' : rule.errorMessage,
      };
    }
    case 'range': {
      // 数値の範囲チェック（min-max形式）
      const parts = rule.value.split('-').map((s) => s.trim());
      if (parts.length !== 2) {
        return { isValid: true, errorMessage: '' };
      }
      const minValue = parseFloat(parts[0] ?? '');
      const maxValue = parseFloat(parts[1] ?? '');
      if (Number.isNaN(minValue) || Number.isNaN(maxValue)) {
        return { isValid: true, errorMessage: '' };
      }
      const numValue = parseFloat(strValue);
      if (isEmpty || Number.isNaN(numValue)) {
        return { isValid: true, errorMessage: '' };
      }
      const isValid = numValue >= minValue && numValue <= maxValue;
      return {
        isValid,
        errorMessage: isValid ? '' : rule.errorMessage,
      };
    }
    case 'email': {
      // メールアドレス形式チェック
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValid = strValue.length === 0 || emailPattern.test(strValue);
      return {
        isValid,
        errorMessage: isValid ? '' : rule.errorMessage,
      };
    }
    case 'url': {
      // URL形式チェック
      const urlPattern = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
      const isValid = strValue.length === 0 || urlPattern.test(strValue);
      return {
        isValid,
        errorMessage: isValid ? '' : rule.errorMessage,
      };
    }
    case 'phone': {
      // 電話番号形式チェック（日本）
      // ハイフンあり/なし、携帯電話、固定電話に対応
      const phonePattern = /^0\d{1,4}[-]?\d{1,4}[-]?\d{3,4}$/;
      const isValid = strValue.length === 0 || phonePattern.test(strValue);
      return {
        isValid,
        errorMessage: isValid ? '' : rule.errorMessage,
      };
    }
    case 'postalCode': {
      // 郵便番号形式チェック（日本）
      // ハイフンあり/なしに対応
      const postalPattern = /^\d{3}[-]?\d{4}$/;
      const isValid = strValue.length === 0 || postalPattern.test(strValue);
      return {
        isValid,
        errorMessage: isValid ? '' : rule.errorMessage,
      };
    }
    case 'alphanumeric': {
      // 英数字のみチェック
      const alphanumericPattern = /^[a-zA-Z0-9]*$/;
      const isValid = strValue.length === 0 || alphanumericPattern.test(strValue);
      return {
        isValid,
        errorMessage: isValid ? '' : rule.errorMessage,
      };
    }
    case 'numeric': {
      // 数字のみチェック
      const numericPattern = /^[0-9]*$/;
      const isValid = strValue.length === 0 || numericPattern.test(strValue);
      return {
        isValid,
        errorMessage: isValid ? '' : rule.errorMessage,
      };
    }
    case 'alpha': {
      // 英字のみチェック
      const alphaPattern = /^[a-zA-Z]*$/;
      const isValid = strValue.length === 0 || alphaPattern.test(strValue);
      return {
        isValid,
        errorMessage: isValid ? '' : rule.errorMessage,
      };
    }
    case 'hiragana': {
      // ひらがなのみチェック
      const hiraganaPattern = /^[\u3040-\u309F\u30FC]*$/;
      const isValid = strValue.length === 0 || hiraganaPattern.test(strValue);
      return {
        isValid,
        errorMessage: isValid ? '' : rule.errorMessage,
      };
    }
    case 'katakana': {
      // カタカナのみチェック（全角）
      const katakanaPattern = /^[\u30A0-\u30FF\u30FC]*$/;
      const isValid = strValue.length === 0 || katakanaPattern.test(strValue);
      return {
        isValid,
        errorMessage: isValid ? '' : rule.errorMessage,
      };
    }
    case 'halfwidthKatakana': {
      // 半角カタカナのみチェック
      // 半角カタカナは U+FF65-U+FF9F の範囲
      const halfwidthKatakanaPattern = /^[\uFF65-\uFF9F]*$/;
      const isValid = strValue.length === 0 || halfwidthKatakanaPattern.test(strValue);
      return {
        isValid,
        errorMessage: isValid ? '' : rule.errorMessage,
      };
    }
    case 'fullwidth': {
      // 全角文字のみチェック
      // 全角文字は半角ASCII (U+0020-U+007E) と半角カナ (U+FF65-U+FF9F) 以外
      const halfwidthPattern = /[\u0020-\u007E\uFF65-\uFF9F]/;
      const isValid = strValue.length === 0 || !halfwidthPattern.test(strValue);
      return {
        isValid,
        errorMessage: isValid ? '' : rule.errorMessage,
      };
    }
    case 'halfwidth': {
      // 半角文字のみチェック
      // 半角ASCII (U+0020-U+007E) と半角カナ (U+FF65-U+FF9F)
      const halfwidthPattern = /^[\u0020-\u007E\uFF65-\uFF9F]*$/;
      const isValid = strValue.length === 0 || halfwidthPattern.test(strValue);
      return {
        isValid,
        errorMessage: isValid ? '' : rule.errorMessage,
      };
    }
    case 'fullwidthAlphanumeric': {
      // 全角英数字のみチェック
      // 全角英数字は U+FF10-U+FF19（数字）, U+FF21-U+FF3A（大文字）, U+FF41-U+FF5A（小文字）
      const fullwidthAlphanumericPattern = /^[\uFF10-\uFF19\uFF21-\uFF3A\uFF41-\uFF5A]*$/;
      const isValid = strValue.length === 0 || fullwidthAlphanumericPattern.test(strValue);
      return {
        isValid,
        errorMessage: isValid ? '' : rule.errorMessage,
      };
    }
    case 'corporateNumber': {
      // 法人番号チェック（13桁の数字）
      // 日本の法人番号は13桁の数字で、最初の1桁はチェックディジット
      const corporateNumberPattern = /^[0-9]{13}$/;
      const isValid = strValue.length === 0 || corporateNumberPattern.test(strValue);
      return {
        isValid,
        errorMessage: isValid ? '' : rule.errorMessage,
      };
    }
    case 'bankAccount': {
      // 銀行口座番号形式チェック
      // 日本の銀行口座番号は通常7桁、ゆうちょ銀行は8桁
      // ハイフンなしの数字のみ、7〜8桁を許容
      const bankAccountPattern = /^[0-9]{7,8}$/;
      const isValid = strValue.length === 0 || bankAccountPattern.test(strValue);
      return {
        isValid,
        errorMessage: isValid ? '' : rule.errorMessage,
      };
    }
    case 'contains': {
      // 特定の文字列を含むチェック
      const isValid = strValue.length === 0 || strValue.includes(rule.value);
      return {
        isValid,
        errorMessage: isValid ? '' : rule.errorMessage,
      };
    }
    case 'notContains': {
      // 特定の文字列を含まないチェック
      const isValid = strValue.length === 0 || !strValue.includes(rule.value);
      return {
        isValid,
        errorMessage: isValid ? '' : rule.errorMessage,
      };
    }
    case 'startsWith': {
      // 特定の文字列で始まるチェック
      const isValid = strValue.length === 0 || strValue.startsWith(rule.value);
      return {
        isValid,
        errorMessage: isValid ? '' : rule.errorMessage,
      };
    }
    case 'endsWith': {
      // 特定の文字列で終わるチェック
      const isValid = strValue.length === 0 || strValue.endsWith(rule.value);
      return {
        isValid,
        errorMessage: isValid ? '' : rule.errorMessage,
      };
    }
    default:
      return { isValid: true, errorMessage: '' };
  }
}

/**
 * 条件に対するバリデーションを実行します
 */
export function validateCondition(
  condition: PluginCondition,
  record: RecordData
): ValidationResult {
  // 適用条件を満たさない場合はバリデーションをスキップ（常に有効扱い）
  if (!shouldApplyValidation(condition, record)) {
    return { isValid: true, errorMessage: '' };
  }

  const field = record[condition.fieldCode];
  for (const rule of condition.rules) {
    const result = validateRule(rule, field);
    if (!result.isValid) {
      return result;
    }
  }
  return { isValid: true, errorMessage: '' };
}

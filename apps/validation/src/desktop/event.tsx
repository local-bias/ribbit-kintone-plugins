import { manager } from '@/lib/event-manager';
import { restorePluginConfig } from '@/lib/plugin';
import { PluginCondition, ValidationRule, TargetEvent } from '@/schema/plugin-config';
import { PLUGIN_NAME } from '@/lib/constants';
import { kintoneAPI } from '@konomi-app/kintone-utilities';

type RecordData = kintoneAPI.RecordData;

/**
 * バリデーションエラーの結果
 */
interface ValidationResult {
  isValid: boolean;
  errorMessage: string;
}

/**
 * フィールドにエラーを設定する
 */
function setFieldError(record: RecordData, fieldCode: string, errorMessage: string | null): void {
  const field = record[fieldCode];
  if (field) {
    // @ts-ignore - kintone API では field.error が存在するがTypeScript型には含まれていない
    field.error = errorMessage;
  }
}

/**
 * フィールド変更イベントを生成
 */
function getChangeEvents(
  fields: string[],
  events: ('create' | 'edit')[]
): kintoneAPI.js.EventType[] {
  return events.reduce<kintoneAPI.js.EventType[]>(
    (acc, event) =>
      [
        ...acc,
        ...fields.map((field) => `app.record.${event}.change.${field}`),
      ] as kintoneAPI.js.EventType[],
    []
  );
}

/**
 * バリデーションルールを実行
 */
function validateRule(rule: ValidationRule, value: kintoneAPI.Field | undefined): ValidationResult {
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
      if (isNaN(minLength)) {
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
      if (isNaN(maxLength)) {
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
      if (isNaN(exactLength)) {
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
      if (isNaN(minValue)) {
        return { isValid: true, errorMessage: '' };
      }
      const numValue = parseFloat(strValue);
      // 空または非数値の場合はパスする
      if (isEmpty || isNaN(numValue)) {
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
      if (isNaN(maxValue)) {
        return { isValid: true, errorMessage: '' };
      }
      const numValue = parseFloat(strValue);
      // 空または非数値の場合はパスする
      if (isEmpty || isNaN(numValue)) {
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
      if (isNaN(minValue) || isNaN(maxValue)) {
        return { isValid: true, errorMessage: '' };
      }
      const numValue = parseFloat(strValue);
      if (isEmpty || isNaN(numValue)) {
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
      // カタカナのみチェック
      const katakanaPattern = /^[\u30A0-\u30FF\u30FC]*$/;
      const isValid = strValue.length === 0 || katakanaPattern.test(strValue);
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
 * 条件に対するバリデーションを実行
 */
function validateCondition(condition: PluginCondition, record: RecordData): ValidationResult {
  const field = record[condition.fieldCode];
  for (const rule of condition.rules) {
    const result = validateRule(rule, field);
    if (!result.isValid) {
      return result;
    }
  }
  return { isValid: true, errorMessage: '' };
}

const pluginConfig = restorePluginConfig();

// 有効な条件をフィルタリング
const validConditions = pluginConfig.conditions.filter(
  (condition) => condition.fieldCode && condition.rules.length > 0
);

// フィールド変更時のイベント
for (const condition of validConditions) {
  const { fieldCode, showErrorOnChange, targetEvents } = condition;

  if (!showErrorOnChange) {
    continue;
  }

  const changeEventTypes: ('create' | 'edit')[] = [];
  if (targetEvents.includes('create')) {
    changeEventTypes.push('create');
  }
  if (targetEvents.includes('edit')) {
    changeEventTypes.push('edit');
  }

  if (changeEventTypes.length > 0) {
    const changeEvents = getChangeEvents([fieldCode], changeEventTypes);
    manager.addChangeEvents(changeEvents, (event) => {
      const result = validateCondition(condition, event.record as RecordData);
      setFieldError(
        event.record as RecordData,
        fieldCode,
        result.isValid ? null : result.errorMessage
      );
      return event;
    });
  }
}

// レコード保存前のイベント
manager.add(['app.record.create.submit', 'app.record.edit.submit'], (event) => {
  const eventType: TargetEvent = event.type.includes('create') ? 'create' : 'edit';

  let hasError = false;

  for (const condition of validConditions) {
    // 対象イベントかどうかをチェック
    if (!condition.targetEvents.includes(eventType)) {
      continue;
    }

    const result = validateCondition(condition, event.record as RecordData);
    setFieldError(
      event.record as RecordData,
      condition.fieldCode,
      result.isValid ? null : result.errorMessage
    );
    if (!result.isValid) {
      hasError = true;
    }
  }

  if (hasError) {
    event.error = '入力内容にエラーがあります。修正してください。';
  }

  return event;
});

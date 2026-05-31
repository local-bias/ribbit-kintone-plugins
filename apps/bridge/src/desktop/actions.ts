import {
  getAppId,
  getFieldValueAsString,
  getRecords,
  type kintoneAPI,
} from '@konomi-app/kintone-utilities';
import { evaluateCondition, type FieldConditionValue } from '@konomi-app/kintone-utilities-react';
import { safeEvaluate } from '@/lib/calc-parser';
import { GUEST_SPACE_ID, isDev } from '@/lib/global';
import { t } from '@/lib/i18n';
import type { Binding, PluginCondition } from '@/schema/plugin-config';

/**
 * レコード情報から実行可否を判定する関数。
 *
 * - srcConditions が1件以上あればレコードを直接評価（APIコールなし）。
 * - srcConditions が空かつ query が空でなければ、APIを使ったレガシー判定を行う。
 * - どちらも未設定の場合は常に実行可能。
 */
export async function canExecuteAction(params: {
  record: kintoneAPI.RecordData;
  query: string;
  srcConditions: FieldConditionValue[];
}): Promise<boolean> {
  const { record, query, srcConditions } = params;

  // モダン形式: srcConditions が設定されている場合はレコードを直接評価
  if (srcConditions.length > 0) {
    return srcConditions.every((condition) => evaluateCondition(condition, record));
  }

  // レガシー形式: クエリが空の場合は常に実行可能
  if (!query.trim()) {
    return true;
  }

  // クエリの先頭にレコードIDを追加し、1件取得できるかで判定
  const recordId = record.$id.value;
  const queryWithId = `$id = "${recordId}" and (${query})`;
  const { records } = await getRecords({
    app: getAppId()!,
    query: queryWithId,
    guestSpaceId: GUEST_SPACE_ID,
    debug: isDev,
  });
  return records.length > 0;
}

export const getDynamicDstQuery = (params: {
  srcKeyField: kintoneAPI.Field;
  dstKeyFieldProperty: kintoneAPI.FieldProperty;
}): string => {
  const { srcKeyField, dstKeyFieldProperty } = params;

  switch (dstKeyFieldProperty.type) {
    // `in`, `like`が使用できないフィールドタイプ
    case 'CREATED_TIME':
    case 'UPDATED_TIME':
    case 'DATE':
    case 'DATETIME':
    case 'TIME': {
      const srcValue = getFieldValueAsString(srcKeyField);
      return `${dstKeyFieldProperty.code} = "${srcValue}"`;
    }

    // `in`が使用できるフィールドタイプ
    case 'RECORD_NUMBER':
    case 'CREATOR':
    case 'MODIFIER':
    case 'SINGLE_LINE_TEXT':
    case 'LINK':
    case 'NUMBER':
    case 'CALC':
    case 'RADIO_BUTTON':
    case 'CHECK_BOX':
    case 'DROP_DOWN':
    case 'MULTI_SELECT':
    case 'USER_SELECT':
    case 'GROUP_SELECT':
    case 'ORGANIZATION_SELECT':
    case 'STATUS':
      if (srcKeyField.type === 'RADIO_BUTTON') {
        return `${dstKeyFieldProperty.code} = "${srcKeyField.value}"`;
      } else if (srcKeyField.type === 'CHECK_BOX') {
        const values = srcKeyField.value.map((value) => `"${value}"`).join(',');
        return `${dstKeyFieldProperty.code} in (${values})`;
      } else {
        const value = getFieldValueAsString(srcKeyField);
        return `${dstKeyFieldProperty.code} in ("${value}")`;
      }

    // `like`のみ使用できるフィールドタイプ
    case 'MULTI_LINE_TEXT':
    case 'RICH_TEXT':
    case 'FILE': {
      const value = getFieldValueAsString(srcKeyField);
      return `${dstKeyFieldProperty.code} like "${value}"`;
    }
    case 'CATEGORY':
    case 'GROUP':
    case 'REFERENCE_TABLE':
    case 'SUBTABLE':
    default:
      throw new Error(
        `${dstKeyFieldProperty.label}はサポートされていないフィールドタイプです。プラグインの設定を見直してください。`
      );
  }
};

export const convertFieldValue = (params: {
  srcField: kintoneAPI.Field;
  dstPropertyType: kintoneAPI.FieldPropertyType;
}): kintoneAPI.Field['value'] => {
  const { srcField, dstPropertyType } = params;
  if (srcField.type === dstPropertyType) {
    return srcField.value;
  }

  switch (dstPropertyType) {
    // string
    case 'SINGLE_LINE_TEXT':
    case 'MULTI_LINE_TEXT':
    case 'RICH_TEXT':
    case 'LINK':
    case 'NUMBER':
    case 'CALC':
    case 'RADIO_BUTTON':
    case 'DROP_DOWN':
    case 'STATUS':
    case 'DATE':
    case 'DATETIME':
    case 'TIME':
    case 'CREATED_TIME':
    case 'UPDATED_TIME':
      return getFieldValueAsString(srcField);
    // string[]
    case 'CHECK_BOX':
    case 'MULTI_SELECT':
      switch (srcField.type) {
        case 'CHECK_BOX':
        case 'MULTI_SELECT':
          return srcField.value;
        default:
          return [getFieldValueAsString(srcField)];
      }
    // { code: string, name: string }
    case 'USER_SELECT':
    case 'GROUP_SELECT':
    case 'ORGANIZATION_SELECT':
      switch (srcField.type) {
        case 'USER_SELECT':
        case 'GROUP_SELECT':
        case 'ORGANIZATION_SELECT':
          return srcField.value;
        case 'CHECK_BOX':
        case 'MULTI_SELECT':
          return srcField.value.map((value) => ({ code: value, name: '' }));
        default:
          return [{ code: getFieldValueAsString(srcField), name: '' }];
      }

    case 'CREATOR':
    case 'MODIFIER':
      return { code: getFieldValueAsString(srcField), name: '' };

    case 'FILE':
    case 'CATEGORY':
    case 'GROUP':
    case 'REFERENCE_TABLE':
    case 'SUBTABLE':
    case 'RECORD_NUMBER':
    case 'STATUS_ASSIGNEE':
    default:
      return null;
  }
};

export const generateErrorLog = (error: unknown): string => {
  if (error === null || error === undefined) {
    return t('desktop.error.unknown');
  }
  if (typeof error === 'string') {
    return `${t('desktop.error.title')}: ${error}`;
  }
  if (error instanceof Error) {
    return `${t('desktop.error.title')}: ${error.message}`;
  }
  if (typeof error !== 'object') {
    return `${t('desktop.error.title')}: ${error}`;
  }

  if ('results' in error) {
    let log = '';
    if (!Array.isArray(error.results)) {
      return `${t('desktop.error.unknown')}`;
    }
    for (const result of error.results) {
      if (result?.code === 'CB_VA01' && 'errors' in result) {
        log = `エラーが発生しました: ${result.message ?? '不明なエラー'}`;
        const entries: [string, any][] = Object.entries(result.errors);
        for (const [key, v] of entries) {
          if ('messages' in v && Array.isArray(v.messages)) {
            log = `\n${key}: ${v.messages.join(', ')}`;
          }
        }
      }
    }
    return log;
  }
  if ('message' in error) {
    return `エラーが発生しました: ${error.message ?? '不明なエラー'}`;
  }
  return `エラーが発生しました: ${error ?? '不明なエラー'}`;
};

/**
 * event.type から抽象イベントタイプを判定する。
 */
export function getAbstractEventType(
  eventType: string
): 'create' | 'update' | 'delete' | 'process' | null {
  if (eventType.includes('create.submit')) return 'create';
  if (eventType.includes('edit.submit')) return 'update';
  if (eventType.includes('delete.submit')) return 'delete';
  if (eventType.includes('process.proceed')) return 'process';
  return null;
}

/**
 * プロセス変更イベントに対して、条件のアクション・ステータスフィルタを評価する。
 * - processActions が空でなければ action を含むか確認
 * - processStatuses が空でなければ nextStatus を含むか確認
 * - 両方空なら常に true
 */
export function shouldExecuteForProcess(params: {
  condition: PluginCondition;
  action: string;
  nextStatus: string;
}): boolean {
  const { condition, action, nextStatus } = params;
  const { processActions, processStatuses } = condition;

  if (processActions.length > 0 && !processActions.includes(action)) {
    return false;
  }
  if (processStatuses.length > 0 && !processStatuses.includes(nextStatus)) {
    return false;
  }
  return true;
}

/**
 * 日付文字列に指定した単位のオフセットを加算し、同フォーマットで返す。
 * - DATE フォーマット ("YYYY-MM-DD") はローカル日付として処理する
 * - DATETIME / CREATED_TIME / UPDATED_TIME ("YYYY-MM-DDTHH:mm:ssZ") は UTC として処理する
 * - 不正な入力の場合は元の文字列をそのまま返す
 */
export const applyDateOffset = (
  dateStr: string,
  offsetValue: number,
  unit: 'day' | 'month' | 'year'
): string => {
  if (!dateStr) return dateStr;

  // DATE 形式 (YYYY-MM-DD) かどうかで処理を分岐
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);

  let year: number, month: number, day: number;
  let timeStr = '';

  if (isDateOnly) {
    const parts = dateStr.split('-').map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return dateStr;
    [year, month, day] = parts as [number, number, number];
  } else {
    // ISO 8601 形式 (YYYY-MM-DDTHH:mm:ssZ 等)
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    year = d.getUTCFullYear();
    month = d.getUTCMonth() + 1;
    day = d.getUTCDate();
    // 時刻部分を保持
    const timePart = dateStr.indexOf('T');
    timeStr = timePart !== -1 ? dateStr.slice(timePart) : '';
  }

  switch (unit) {
    case 'day': {
      const d = new Date(Date.UTC(year, month - 1, day + offsetValue));
      year = d.getUTCFullYear();
      month = d.getUTCMonth() + 1;
      day = d.getUTCDate();
      break;
    }
    case 'month': {
      const d = new Date(Date.UTC(year, month - 1 + offsetValue, day));
      year = d.getUTCFullYear();
      month = d.getUTCMonth() + 1;
      day = d.getUTCDate();
      break;
    }
    case 'year': {
      const d = new Date(Date.UTC(year + offsetValue, month - 1, day));
      year = d.getUTCFullYear();
      month = d.getUTCMonth() + 1;
      day = d.getUTCDate();
      break;
    }
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  const datePart = `${year}-${pad(month)}-${pad(day)}`;
  return isDateOnly ? datePart : `${datePart}${timeStr}`;
};

const EMBED_FIELD_REGEX = /\{\{fieldCode:([^}]+)\}\}/g;

/**
 * 計算式内の {{fieldCode:XXX}} プレースホルダーをレコードの数値に置換し、算術評価する。
 * 無効な式の場合は '0' を返す。
 */
export const evaluateCalcExpression = (
  expression: string,
  srcRecord: kintoneAPI.RecordData
): string => {
  const resolved = expression.replace(EMBED_FIELD_REGEX, (_, fieldCode: string) => {
    const field = srcRecord[fieldCode];
    if (!field) return '0';
    const val = Number(getFieldValueAsString(field));
    return Number.isNaN(val) ? '0' : String(val);
  });
  const result = safeEvaluate(resolved);
  return Number.isNaN(result) ? '0' : String(result);
};

/**
 * binding の type に応じて更新先フィールドの値を解決する。
 * null を返した場合はスキップされる。
 */
export const resolveBindingValue = (params: {
  binding: Binding;
  srcRecord: kintoneAPI.RecordData;
  dstPropertyType: kintoneAPI.FieldPropertyType;
}): kintoneAPI.Field['value'] | null => {
  const { binding, srcRecord, dstPropertyType } = params;
  const type = binding.type ?? 'field';

  switch (type) {
    case 'field': {
      const srcField = srcRecord[binding.srcFieldCode ?? ''];
      if (!srcField) return null;
      return convertFieldValue({ srcField, dstPropertyType });
    }
    case 'fixed': {
      return binding.fixedValue ?? '';
    }
    case 'concat': {
      const expression = binding.concatExpression ?? '';
      return expression.replace(
        new RegExp(EMBED_FIELD_REGEX.source, 'g'),
        (_, fieldCode: string) => {
          const field = srcRecord[fieldCode];
          return field ? getFieldValueAsString(field) : '';
        }
      );
    }
    case 'calc': {
      return evaluateCalcExpression(binding.calcExpression ?? '', srcRecord);
    }
    case 'date_offset': {
      const srcField = srcRecord[binding.dateOffsetSrcFieldCode ?? ''];
      if (!srcField) return null;
      const dateStr = getFieldValueAsString(srcField);
      if (!dateStr) return null;
      return applyDateOffset(
        dateStr,
        binding.dateOffsetValue ?? 0,
        binding.dateOffsetUnit ?? 'day'
      );
    }
  }
};

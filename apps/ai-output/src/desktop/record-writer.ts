import type { ResolvedOutputFieldDef } from '@/schema/plugin-config';

type KintoneRecord = Record<string, { type: string; value: unknown }>;

function convertFieldValue(
  field: ResolvedOutputFieldDef,
  value: unknown,
  existingValue: unknown
): unknown {
  switch (field.type) {
    case 'string':
      return String(value ?? '');
    case 'number':
      return String(value ?? '');
    case 'boolean':
      if (value) {
        return Array.isArray(existingValue) ? ['true'] : 'true';
      }
      return Array.isArray(existingValue) ? [] : '';
    case 'array_string':
      if (Array.isArray(value)) {
        return value.map(String).join('\n');
      }
      return String(value ?? '');
  }
}

/**
 * AIレスポンスをレコードオブジェクトに適用する(副作用なし)。
 * edit.show / create.show / submit イベントで使用。
 */
export function applyAIResponseToRecord(
  record: KintoneRecord,
  aiResponse: Record<string, unknown>,
  outputFields: ResolvedOutputFieldDef[]
): KintoneRecord {
  for (const field of outputFields) {
    if (!field.fieldCode || !(field.fieldCode in aiResponse)) {
      continue;
    }
    const targetField = record[field.fieldCode];
    if (!targetField) {
      console.warn(`フィールド "${field.fieldCode}" がレコードに存在しません`);
      continue;
    }
    targetField.value = convertFieldValue(field, aiResponse[field.fieldCode], targetField.value);
  }
  return record;
}

/**
 * REST API updateRecord 用のレコードペイロードを構築する。
 * detail.show で kintone.app.record.set() が使えない場合に使用。
 */
export function buildRecordUpdatePayload(
  aiResponse: Record<string, unknown>,
  outputFields: ResolvedOutputFieldDef[],
  currentRecord: KintoneRecord
): Record<string, { value: unknown }> {
  const payload: Record<string, { value: unknown }> = {};
  for (const field of outputFields) {
    if (!field.fieldCode || !(field.fieldCode in aiResponse)) {
      continue;
    }
    const existing = currentRecord[field.fieldCode];
    if (!existing) {
      continue;
    }
    payload[field.fieldCode] = {
      value: convertFieldValue(field, aiResponse[field.fieldCode], existing.value),
    };
  }
  return payload;
}

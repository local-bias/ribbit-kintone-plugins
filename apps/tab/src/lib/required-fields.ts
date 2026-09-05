import { getFieldValueAsString, type kintoneAPI } from '@konomi-app/kintone-utilities';

/** 必須チェックの対象にしないフィールドタイプ(入力欄を持たない、または自動で値が入るもの) */
const UNCHECKED_FIELD_TYPES = new Set<string>([
  'CALC',
  'CATEGORY',
  'CREATED_TIME',
  'CREATOR',
  'GROUP',
  'MODIFIER',
  'RECORD_NUMBER',
  'STATUS',
  'STATUS_ASSIGNEE',
  'SUBTABLE',
  'UPDATED_TIME',
]);

type RequiredFieldProperty = kintoneAPI.FieldProperty & { required?: boolean };

/**
 * 未入力の必須フィールドのフィールドコードを返します
 *
 * kintoneは非表示のフィールドも必須チェックの対象にするため、
 * 「見えないフィールドが原因で保存できない」状態を検出するために使用します。
 *
 * サブテーブル内のフィールドは行ごとの判定が必要なため、対象外としています。
 *
 * @param params.fields アプリのフィールド情報
 * @param params.record 判定対象のレコード
 * @returns 未入力の必須フィールドのフィールドコード
 */
export const findMissingRequiredFieldCodes = (params: {
  fields: kintoneAPI.FieldProperty[];
  record: kintoneAPI.RecordData | null;
}): string[] => {
  const { fields, record } = params;
  if (!record) {
    return [];
  }

  return fields
    .filter((field): field is RequiredFieldProperty => {
      if (UNCHECKED_FIELD_TYPES.has(field.type)) {
        return false;
      }
      return (field as RequiredFieldProperty).required === true;
    })
    .map((field) => field.code)
    .filter((code) => {
      const field = record[code];
      if (!field) {
        return false;
      }
      return getFieldValueAsString(field).trim() === '';
    });
};

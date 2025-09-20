import { isDev } from '@/lib/global';
import { t } from '@/lib/i18n';
import {
  FIELD_TYPES_ENTITY_ARRAY_VALUE,
  FIELD_TYPES_ENTITY_VALUE,
  FIELD_TYPES_STRING_ARRAY_VALUE,
  FIELD_TYPES_STRING_VALUE,
  isEntityArrayValueField,
  isEntityValueField,
  isStringArrayValueField,
  isStringArrayValueFieldType,
  isStringValueFieldType,
} from '@/lib/kintone';
import { ActionParam } from '@/schema/action-values';
import { PluginCondition } from '@/schema/plugin-config';
import {
  downloadFile,
  getFieldValueAsString,
  kintoneAPI,
  uploadFile,
} from '@konomi-app/kintone-utilities';

export async function createUrlParams({
  condition,
  dstAppFields,
  currentRecord,
}: {
  condition: PluginCondition;
  dstAppFields: kintoneAPI.FieldProperty[];
  currentRecord: kintoneAPI.RecordData;
}) {
  const params: ActionParam = {
    values: {},
  };

  const fixedValueFields = condition.fields.filter((f) => f.type === 'fixed_value');
  for (const field of fixedValueFields) {
    const dstField = dstAppFields.find((f) => f.code === field.dstFieldCode);
    if (!dstField) {
      console.warn('Destination field is not found.', field.dstFieldCode);
      continue;
    }
    if (FIELD_TYPES_STRING_VALUE.includes(dstField.type)) {
      params.values[field.dstFieldCode] = {
        value: field.fixedValue,
      };
    } else if (FIELD_TYPES_STRING_ARRAY_VALUE.includes(dstField.type)) {
      params.values[field.dstFieldCode] = {
        value: [field.fixedValue],
      };
    } else if (FIELD_TYPES_ENTITY_VALUE.includes(dstField.type)) {
      params.values[field.dstFieldCode] = {
        value: {
          code: field.fixedValue,
          name: '',
        },
      };
    } else if (FIELD_TYPES_ENTITY_ARRAY_VALUE.includes(dstField.type)) {
      params.values[field.dstFieldCode] = {
        value: [
          {
            code: field.fixedValue,
            name: '',
          },
        ],
      };
    } else {
      throw new Error(`Unsupported field type: ${dstField.type}`);
    }
  }

  const copyFields = condition.fields.filter((f) => f.type === 'copy');
  for (const field of copyFields) {
    const srcField = currentRecord[field.srcFieldCode];
    const dstFieldProperty = dstAppFields.find((f) => f.code === field.dstFieldCode);
    if (!srcField) {
      console.warn('Source field is not found.', field.srcFieldCode);
      continue;
    }
    if (!dstFieldProperty) {
      console.warn('Destination field is not found.', field.dstFieldCode);
      continue;
    }

    const { value, dstError } = await convertFieldValueByTargetType({
      condition,
      dstField: dstFieldProperty,
      sourceField: srcField,
      dstFieldProperties: dstAppFields,
    });
    if (dstError) {
      throw new Error(dstError);
    }
    if (value !== null) {
      params.values[field.dstFieldCode] = { value };
    }
  }

  return params;
}

// export const getDstSubtable = (params: {
//   condition: PluginCondition;
//   record: kintoneAPI.RecordData;
// }): kintoneAPI.field.Subtable | null => {
//   const { condition, record } = params;
//   if (condition.type === 'single') {
//     return null;
//   }
//   const field = record[condition.dstSubtableFieldCode];
//   if (!field || field.type !== 'SUBTABLE') {
//     return null;
//   }
//   return field;
// };

// /**
//  * レコードから目的のフィールドを取得します。
//  * @param params - パラメーター
//  * @param params.condition - プラグイン設定の条件
//  * @param params.record - kintoneレコードデータ
//  * @param params.rowIndex - サブテーブルの行インデックス（サブテーブルフィールドの場合）
//  * @returns フィールドオブジェクト。フィールドが見つからない場合はnull
//  *
//  * @example
//  * // 通常フィールドの場合
//  * getDstField({ condition, record });
//  *
//  * // サブテーブルフィールドの場合
//  * getDstField({ condition, record, rowIndex: 0 });
//  */
// export const getDstField = (params: {
//   condition: PluginCondition;
//   record: kintoneAPI.RecordData;
//   rowIndex?: number;
// }): kintoneAPI.Field | null => {
//   const { condition, record, rowIndex } = params;
//   if (condition.type === 'single') {
//     return record[condition.dstField] ?? null;
//   }
//   if (rowIndex === undefined) {
//     return null;
//   }

//   const subtable = getDstSubtable({ condition, record });
//   if (!subtable) {
//     return null;
//   }

//   const subtableRow = subtable.value[rowIndex];
//   if (subtableRow) {
//     return subtableRow.value[condition.dstInsubtableFieldCode] ?? null;
//   }
//   return null;
// };

/**
 * 値を反映する先のフィールドタイプに応じて、変換した参照元のフィールドの値を返します。
 * @param params
 */
async function convertFieldValueByTargetType(params: {
  condition: PluginCondition;
  dstField: kintoneAPI.FieldProperty;
  sourceField: kintoneAPI.Field;
  dstFieldProperties: kintoneAPI.FieldProperty[];
}): Promise<{
  value: kintoneAPI.Field['value'] | null;
  dstError?: string;
}> {
  const { dstField, sourceField, dstFieldProperties } = params;

  const getDstProperty = () => {
    return dstFieldProperties.find((f) => f.code === dstField.code) ?? null;
  };

  const getDstError = (errorMessage: string) => {
    const dstFieldProperty = getDstProperty();
    if (!dstFieldProperty) {
      console.warn('Destination field properties is not found.', dstField.code);
    }
    let dstFieldName = dstFieldProperty?.label ?? dstField.code;
    return `${dstFieldName}: ${errorMessage}`;
  };

  // 設定不可なフィールドタイプの場合はエラー
  if (
    dstField.type === 'CALC' ||
    dstField.type === 'CREATOR' ||
    dstField.type === 'MODIFIER' ||
    dstField.type === 'RECORD_NUMBER' ||
    dstField.type === 'CREATED_TIME' ||
    dstField.type === 'UPDATED_TIME'
  ) {
    const dstError = getDstError(t('desktop.fieldError.invalidFieldType'));
    return { value: null, dstError };
  }

  if (dstField.type === sourceField.type) {
    return { value: sourceField.value };
  }

  // ファイルフィールドはファイルフィールドにしか設定できない
  if (dstField.type === 'FILE') {
    const dstError = getDstError(t('desktop.fieldError.invalidFieldType'));
    return { value: null, dstError };
  }

  if (dstField.type === 'NUMBER') {
    const isNumber = (value: any): boolean => value !== null && !isNaN(value);

    if (isEntityArrayValueField(sourceField)) {
      for (const entity of sourceField.value) {
        if (isNumber(entity.code)) {
          return { value: entity.code };
        }
        if (isNumber(entity.name)) {
          return { value: entity.name };
        }
      }
      const dstError = getDstError(t('desktop.fieldError.invalidNumber'));
      return { value: null, dstError };
    } else if (isEntityValueField(sourceField)) {
      if (isNumber(sourceField.value.code)) {
        return { value: sourceField.value.code };
      }
      if (isNumber(sourceField.value.name)) {
        return { value: sourceField.value.name };
      }
      const dstError = getDstError(t('desktop.fieldError.invalidNumber'));
      return { value: null, dstError };
    } else if (isStringArrayValueField(sourceField)) {
      const matched = sourceField.value.find((v) => isNumber(v));
      if (matched) {
        return { value: matched };
      }
      const dstError = getDstError(t('desktop.fieldError.invalidNumber'));
      return { value: null, dstError };
    } else {
      // 🚧 ファイル一覧などのフィールドタイプの条件が抜けているため、追加する必要がある
    }

    const sourceFieldValue = getFieldValueAsString(sourceField);
    if (isNumber(sourceFieldValue)) {
      return { value: sourceFieldValue };
    }
    const dstError = getDstError(t('desktop.fieldError.invalidNumber'));
    return { value: null, dstError };
  }

  if (dstField.type === 'DATE' || dstField.type === 'DATETIME' || dstField.type === 'TIME') {
    if (
      isStringArrayValueField(sourceField) ||
      isEntityArrayValueField(sourceField) ||
      isEntityValueField(sourceField)
    ) {
      const dstError = getDstError(t('desktop.fieldError.invalidDate'));
      return { value: null, dstError };
    }

    const sourceFieldValue = sourceField.value;
    if (
      Array.isArray(sourceFieldValue) ||
      sourceFieldValue === null ||
      !Date.parse(sourceFieldValue)
    ) {
      const dstError = getDstError(t('desktop.fieldError.invalidDate'));
      return { value: null, dstError };
    }

    return { value: sourceFieldValue };
  }

  if (dstField.type === 'DROP_DOWN' || dstField.type === 'RADIO_BUTTON') {
    const dstFieldProperty = getDstProperty();
    if (
      !dstFieldProperty ||
      (dstFieldProperty.type !== 'DROP_DOWN' && dstFieldProperty.type !== 'RADIO_BUTTON')
    ) {
      return { value: null };
    }
    const optionValues = Object.values(dstFieldProperty.options).map((option) => option.label);
    if (isEntityArrayValueField(sourceField)) {
      for (const entity of sourceField.value) {
        if (optionValues.includes(entity.code)) {
          return { value: entity.code };
        }
        if (optionValues.includes(entity.name)) {
          return { value: entity.name };
        }
      }
      const dstError = getDstError(t('desktop.fieldError.invalidOption'));
      return { value: null, dstError };
    } else if (isEntityValueField(sourceField)) {
      if (optionValues.includes(sourceField.value.code)) {
        return { value: sourceField.value.code };
      }
      if (optionValues.includes(sourceField.value.name)) {
        return { value: sourceField.value.name };
      }
      const dstError = getDstError(t('desktop.fieldError.invalidOption'));
      return { value: null, dstError };
    } else if (isStringArrayValueField(sourceField)) {
      const matched = sourceField.value.find((v) => optionValues.includes(v));
      if (matched) {
        return { value: matched };
      }
      const dstError = getDstError(t('desktop.fieldError.invalidOption'));
      return { value: null, dstError };
    } else {
      // 🚧 ファイル一覧などのフィールドタイプの条件が抜けているため、追加する必要がある
    }

    const sourceFieldValue = getFieldValueAsString(sourceField);

    if (optionValues.includes(sourceFieldValue)) {
      return { value: sourceFieldValue };
    }
    const dstError = getDstError(t('desktop.fieldError.invalidOption'));
    return { value: null, dstError };
  }

  // 💡 ここまでのコンバート処理で対象とならなかったデータについては
  // フィールドタイプではなく、フィールドの値による変換を行う

  if (isStringValueFieldType(dstField.type)) {
    return {
      value: getFieldValueAsString(sourceField),
    };
  }
  if (isStringArrayValueFieldType(dstField.type)) {
    if (isStringArrayValueField(sourceField)) {
      return {
        value: sourceField.value,
      };
    }
    return {
      value: [getFieldValueAsString(sourceField)],
    };
  }
  if (FIELD_TYPES_ENTITY_VALUE.includes(dstField.type)) {
    if (isEntityValueField(sourceField)) {
      return { value: sourceField.value };
    }
    if (isEntityArrayValueField(sourceField)) {
      return { value: sourceField.value[0]! };
    }
  }
  return { value: sourceField.value };
}

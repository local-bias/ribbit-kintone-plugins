import { t } from '@/lib/i18n';
import { PluginCondition } from '@/schema/plugin-config';
import { getFieldValueAsString, kintoneAPI } from '@konomi-app/kintone-utilities';
import { DateTime } from 'luxon';

export const validateRecord = (params: {
  record: kintoneAPI.RecordData;
  condition: PluginCondition;
}): { valid: true } | { valid: false; errorMessage: string } => {
  const { record, condition } = params;

  const targetField = record[condition.targetFieldCode];
  const basisField = record[condition.basisFieldCode];

  if (!targetField) {
    return {
      valid: false,
      errorMessage: `${condition.targetFieldCode}: ${t('desktop.validation.error.targetFieldCode')}`,
    };
  }
  if (condition.basisType === 'field' && !basisField) {
    return {
      valid: false,
      errorMessage: `${condition.basisFieldCode}: ${t('desktop.validation.error.basisFieldCode')}`,
    };
  }

  if (targetField.type !== 'DATE' && targetField.type !== 'DATETIME') {
    return {
      valid: false,
      errorMessage: `${condition.targetFieldCode}: ${t('desktop.validation.error.targetFieldCode.invalid')}`,
    };
  }
  if (condition.basisType === 'field' && typeof basisField?.value !== 'string') {
    return {
      valid: false,
      errorMessage: `${condition.basisFieldCode}: ${t('desktop.validation.error.basisFieldCode.invalid')}`,
    };
  }
  return { valid: true };
};

export const getAdjustedDate = (params: {
  basisDate: DateTime;
  record: kintoneAPI.RecordData;
  condition: PluginCondition;
}): DateTime => {
  const { basisDate, record, condition } = params;
  let adjusted = basisDate;
  for (const adjustment of condition.adjustments) {
    const { target, type, basisType, basisFieldCode, staticValue } = adjustment;
    const basisField = record[basisFieldCode]!;

    const basisValue = basisType === 'static' ? staticValue : getFieldValueAsString(basisField);

    switch (type) {
      case 'start':
        adjusted = adjusted.startOf(target);
        break;
      case 'end':
        adjusted = adjusted.endOf(target);
        break;
      case 'add':
      case 'subtract': {
        // Luxonの`plus`/`minus`は数値を要求する。文字列のままだと"Invalid unit value"となるため、
        // 数値へ変換し、変換できない場合(NaN, 空文字列など)は該当の調整処理をスキップする。
        const numericValue = typeof basisValue === 'number' ? basisValue : Number(basisValue);
        if (!Number.isFinite(numericValue)) {
          if (process.env.NODE_ENV === 'development') {
            console.warn(`[date/getAdjustedDate] Invalid numeric value for adjustment; skipping.`, {
              target,
              type,
              basisType,
              basisFieldCode,
              basisValue,
            });
          }
          break;
        }
        adjusted =
          type === 'add'
            ? adjusted.plus({ [target]: numericValue })
            : adjusted.minus({ [target]: numericValue });
        break;
      }
    }
  }
  return adjusted;
};

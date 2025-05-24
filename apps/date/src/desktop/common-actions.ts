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
        adjusted = adjusted.plus({ [target]: basisValue });
        break;
      case 'subtract':
        adjusted = adjusted.minus({ [target]: basisValue });
        break;
    }
  }
  return adjusted;
};

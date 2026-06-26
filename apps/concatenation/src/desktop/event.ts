import { getFieldValueAsString, type kintoneAPI } from '@konomi-app/kintone-utilities';
import { DateTime } from 'luxon';
import { manager } from '@/lib/listener';
import {
  FORMATTABLE_FIELD_TYPES,
  NUMBER_FORMATTABLE_FIELD_TYPES,
  restorePluginConfig,
} from '@/lib/plugin';

/**
 * 日時系フィールドの値を指定フォーマットの文字列に変換します
 */
const formatDateValue = (value: string, format: string): string => {
  if (!value) {
    return '';
  }
  return DateTime.fromISO(value).toFormat(format);
};

/**
 * 数値フィールドの値を桁区切り・小数桁・接頭辞/接尾辞でフォーマットします。
 * 数値として解釈できない場合は null を返します(呼び出し側でフォールバック)。
 */
const formatNumberValue = (
  value: string,
  numberFormat: Plugin.ConcatenationItem.NumberFormat
): string | null => {
  if (value === '' || value == null) {
    return '';
  }
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return null;
  }
  const { useGrouping = false, decimalDigits, prefix = '', suffix = '' } = numberFormat;
  const hasFixedDigits = decimalDigits !== null && decimalDigits !== undefined;
  const formatted = new Intl.NumberFormat('ja-JP', {
    useGrouping,
    minimumFractionDigits: hasFixedDigits ? decimalDigits : undefined,
    maximumFractionDigits: hasFixedDigits ? decimalDigits : 20,
  }).format(numericValue);
  return `${prefix}${formatted}${suffix}`;
};

/**
 * 1つのフィールド値を、設定に応じてフォーマット済みの文字列に変換します
 */
const getFormattedFieldValue = (
  field: kintoneAPI.Field,
  options: { format?: string; numberFormat?: Plugin.ConcatenationItem.NumberFormat }
): string => {
  const fieldType = field.type;

  if (FORMATTABLE_FIELD_TYPES.includes(fieldType as any) && options.format) {
    return formatDateValue(field.value as string, options.format);
  }

  if (NUMBER_FORMATTABLE_FIELD_TYPES.includes(fieldType as any) && options.numberFormat) {
    const formatted = formatNumberValue(field.value as string, options.numberFormat);
    if (formatted !== null) {
      return formatted;
    }
  }

  return getFieldValueAsString(field, { ignoresCalculationError: true });
};

/**
 * サブテーブルの1列を区切り文字で連結します
 */
const concatSubtableColumn = (
  field: kintoneAPI.Field | undefined,
  item: Plugin.ConcatenationItem.Subtable
): string => {
  if (field?.type !== 'SUBTABLE') {
    return '';
  }
  const rows = (field.value ?? []) as Array<{ value: Record<string, kintoneAPI.Field> }>;
  return rows
    .map((row) => {
      const column = row.value[item.columnField];
      if (!column) {
        return '';
      }
      return getFormattedFieldValue(column, { format: item.format });
    })
    .join(item.separator ?? '');
};

const { conditions } = restorePluginConfig();

for (const condition of conditions) {
  const { targetField, concatenationItems = [] } = condition;
  if (!targetField) {
    continue;
  }

  const submitEvents: kintoneAPI.js.EventType[] = [
    'app.record.edit.submit',
    'app.record.create.submit',
    'app.record.index.edit.submit',
  ];

  // 値が変わったらリアルタイムに結合し直したいフィールドコードの一覧
  const monitoredFieldCodes = concatenationItems.flatMap((item) => {
    if (item.type === 'field') {
      return [item.value];
    }
    // サブテーブルは内側の列フィールドコードで変更イベントが発火する
    if (item.type === 'subtable') {
      return [item.columnField];
    }
    return [];
  });

  const changeEvents = monitoredFieldCodes.flatMap((code) => [
    //@ts-expect-error
    `app.record.edit.change.${code}`,
    //@ts-expect-error
    `app.record.create.change.${code}`,
    //@ts-expect-error
    `app.record.index.edit.change.${code}`,
  ]);

  manager.add(['app.record.edit.show', 'app.record.create.show'], async (event) => {
    if (!event.record[targetField]) {
      return event;
    }

    //@ts-expect-error
    event.record[targetField].disabled = true;

    return event;
  });

  manager.addChangeEvents([...submitEvents, ...changeEvents], (event) => {
    const { record } = event;
    if (!record[targetField]) {
      return event;
    }

    const concatenated = concatenationItems
      .map((item, i, arr) => {
        switch (item.type) {
          case 'string': {
            if (
              item.isOmittedIfPreviousEmpty &&
              i > 0 &&
              arr[i - 1]?.type === 'field' &&
              //@ts-expect-error
              !record[arr[i - 1].value]?.value
            ) {
              return '';
            }

            if (
              item.isOmittedIfNextEmpty &&
              i < arr.length - 1 &&
              arr[i + 1]?.type === 'field' &&
              //@ts-expect-error
              !record[arr[i + 1].value]?.value
            ) {
              return '';
            }

            return item.value;
          }
          case 'field': {
            const field = record[item.value];
            if (!field) {
              return '';
            }

            return getFormattedFieldValue(field, {
              format: item.format,
              numberFormat: item.numberFormat,
            });
          }
          case 'subtable': {
            return concatSubtableColumn(record[item.value], item);
          }
          default: {
            return '';
          }
        }
      })
      .join('');

    record[targetField].value = concatenated;

    return event;
  });
}

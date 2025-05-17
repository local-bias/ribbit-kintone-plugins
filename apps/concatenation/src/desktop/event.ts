import { FORMATTABLE_FIELD_TYPES, restorePluginConfig } from '@/lib/plugin';
import { manager } from '@/lib/listener';
import { getFieldValueAsString, kintoneAPI } from '@konomi-app/kintone-utilities';
import { DateTime } from 'luxon';

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

  const monitoredFields = concatenationItems.filter((item) => item.type === 'field');

  const changeEvents = monitoredFields.flatMap((item) => [
    //@ts-ignore
    `app.record.edit.change.${item.value}`,
    //@ts-ignore
    `app.record.create.change.${item.value}`,
  ]);

  manager.add(['app.record.edit.show', 'app.record.create.show'], async (event) => {
    if (!event.record[targetField]) {
      return event;
    }

    //@ts-ignore
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
              //@ts-ignore
              !record[arr[i - 1].value]?.value
            ) {
              return '';
            }

            if (
              item.isOmittedIfNextEmpty &&
              i < arr.length - 1 &&
              arr[i + 1]?.type === 'field' &&
              //@ts-ignore
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

            const fieldType = field.type;

            if (FORMATTABLE_FIELD_TYPES.includes(fieldType as any) && item.format) {
              const value = field.value as string;
              if (!value) {
                return '';
              }
              const date = DateTime.fromISO(value);
              return date.toFormat(item.format);
            }

            return getFieldValueAsString(field, {
              ignoresCalculationError: true,
            });
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

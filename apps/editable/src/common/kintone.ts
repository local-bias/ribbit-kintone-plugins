import { kintoneAPI } from '@konomi-app/kintone-utilities';

export const getChangeEvents = (
  fields: string[],
  events: ('create' | 'edit' | 'index.edit')[]
): kintone.EventType[] => {
  const changeEvents = events.reduce<kintone.EventType[]>(
    (accu, event) =>
      [
        ...accu,
        ...fields.map((field) => `app.record.${event}.change.${field}`),
      ] as kintone.EventType[],
    []
  );
  return changeEvents;
};

/** 指定のフィールドコードのフィールドを操作します */
export const controlField = (
  record: kintoneAPI.RecordData,
  fieldCode: string,
  callback: (field: kintoneAPI.Field) => void
): void => {
  if (record[fieldCode]) {
    callback(record[fieldCode]);
    return;
  }

  for (const field of Object.values(record)) {
    if (field.type === 'SUBTABLE') {
      for (const { value } of field.value) {
        if (value[fieldCode]) {
          callback(value[fieldCode]);
        }
      }
    }
  }
};

import { GUEST_SPACE_ID } from '@/lib/global';
import { appFormFieldsAtom, currentAppIdAtom } from '@repo/jotai';
import { atom } from 'jotai';
import { derive } from 'jotai-derive';

export const currentAppFormFieldsAtom = atom((get) => {
  return get(
    appFormFieldsAtom({
      appId: get(currentAppIdAtom),
      spaceId: GUEST_SPACE_ID,
      preview: true,
    })
  );
});

export const stringFieldsAtom = derive([currentAppFormFieldsAtom], (fields) => {
  return fields.filter(
    (field) =>
      field.type === 'SINGLE_LINE_TEXT' ||
      field.type === 'MULTI_LINE_TEXT' ||
      field.type === 'RICH_TEXT'
  );
});

export const flatFieldsState = derive([currentAppFormFieldsAtom], (fields) => {
  return fields.flatMap((field) => {
    if (field.type === 'SUBTABLE') {
      return Object.values(field.fields);
    }
    return field;
  });
});

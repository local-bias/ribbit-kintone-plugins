import { GUEST_SPACE_ID } from '@/lib/global';
import { appFormFieldsAtom, currentAppIdAtom } from '@repo/jotai';
import { atom } from 'jotai';
import { eagerAtom } from 'jotai-eager';

const currentAppFormFieldsAtom = atom((get) => {
  return get(
    appFormFieldsAtom({
      appId: get(currentAppIdAtom),
      spaceId: GUEST_SPACE_ID,
      preview: true,
    })
  );
});

export const targetFieldsAtom = eagerAtom((get) => {
  const fields = get(currentAppFormFieldsAtom);
  return fields.filter(
    (field) =>
      field.type === 'SINGLE_LINE_TEXT' ||
      field.type === 'MULTI_LINE_TEXT' ||
      field.type === 'RICH_TEXT' ||
      field.type === 'DATE' ||
      field.type === 'DATETIME'
  );
});

export const basisFieldsState = eagerAtom((get) => {
  const fields = get(currentAppFormFieldsAtom);
  return fields.filter(
    (field) => field.type === 'SINGLE_LINE_TEXT' || field.type === 'NUMBER' || field.type === 'CALC'
  );
});

export const flatFieldsState = eagerAtom((get) => {
  const fields = get(currentAppFormFieldsAtom);
  return fields.flatMap((field) => {
    if (field.type === 'SUBTABLE') {
      return Object.values(field.fields);
    }
    return field;
  });
});

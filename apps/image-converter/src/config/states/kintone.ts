import { GUEST_SPACE_ID } from '@/lib/global';
import { flatLayout } from '@/lib/kintone';
import { kintoneAPI } from '@konomi-app/kintone-utilities';
import { appFormFieldsAtom, appFormLayoutState, currentAppIdAtom } from '@repo/jotai';
import { atom } from 'jotai';
import { derive } from 'jotai-derive';

export const currentAppFormFieldsAtom = atom((get) => {
  return get(
    appFormFieldsAtom({
      app: get(currentAppIdAtom),
      guestSpaceId: GUEST_SPACE_ID,
      preview: true,
    })
  );
});

export const currentAppFileFieldsAtom = derive(
  [currentAppFormFieldsAtom],
  (currentAppFormFields) => {
    return currentAppFormFields.filter(
      (field) => field.type === 'FILE'
    ) as kintoneAPI.property.File[];
  }
);

export const currentAppFormLayoutAtom = atom((get) => {
  return get(
    appFormLayoutState({
      app: get(currentAppIdAtom),
      guestSpaceId: GUEST_SPACE_ID,
      preview: true,
    })
  );
});

export const currentAppSpaceFieldsAtom = derive(
  [currentAppFormLayoutAtom],
  (currentAppFormLayout) => {
    const fields = flatLayout(currentAppFormLayout);
    const spaces = fields.filter((field) => field.type === 'SPACER') as kintoneAPI.layout.Spacer[];
    return spaces.filter((space) => space.elementId);
  }
);

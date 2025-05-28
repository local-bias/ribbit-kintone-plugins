import { GUEST_SPACE_ID } from '@/lib/global';
import { appFormFieldsAtom, currentAppIdAtom } from '@repo/jotai';
import { atom } from 'jotai';

export const currentAppFormFieldsAtom = atom((get) => {
  return get(
    appFormFieldsAtom({
      app: get(currentAppIdAtom),
      guestSpaceId: GUEST_SPACE_ID,
    })
  );
});

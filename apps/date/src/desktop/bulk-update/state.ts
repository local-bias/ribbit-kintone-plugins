import { appFormFieldsAtom, currentAppIdAtom } from '@repo/jotai';
import { atom } from 'jotai';
import { GUEST_SPACE_ID } from '@/lib/global';

export const currentAppFormFieldsAtom = atom((get) => {
  return get(
    appFormFieldsAtom({
      app: get(currentAppIdAtom),
      guestSpaceId: GUEST_SPACE_ID,
    })
  );
});

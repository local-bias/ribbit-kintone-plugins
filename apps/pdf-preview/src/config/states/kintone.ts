import { appFormFieldsAtom, currentAppIdAtom } from '@repo/jotai';
import { atom } from 'jotai';
import { GUEST_SPACE_ID } from '@/lib/global';

export const currentAppFieldsAtom = atom((get) => {
  const app = get(currentAppIdAtom);
  return get(
    appFormFieldsAtom({
      app,
      guestSpaceId: GUEST_SPACE_ID,
      preview: true,
    })
  );
});

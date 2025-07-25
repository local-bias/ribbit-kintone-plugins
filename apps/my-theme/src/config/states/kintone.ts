import { GUEST_SPACE_ID, isDev } from '@/lib/global';
import { appFormFieldsAtom, currentAppIdAtom } from '@repo/jotai';
import { atom } from 'jotai';

export const currentAppFieldsAtom = atom((get) => {
  const app = get(currentAppIdAtom);
  return get(
    appFormFieldsAtom({
      app,
      guestSpaceId: GUEST_SPACE_ID,
      preview: true,
      debug: isDev,
    })
  );
});

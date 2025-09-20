import { GUEST_SPACE_ID, isProd } from '@/lib/global';
import { kintoneAPI } from '@konomi-app/kintone-utilities';
import { appFormFieldsAtom, currentAppIdAtom } from '@repo/jotai';
import { eagerAtom } from 'jotai-eager';

export const currentAppPropertiesAtom = eagerAtom<kintoneAPI.FieldProperties>((get) => {
  const appId = get(currentAppIdAtom);
  if (!appId) {
    return {};
  }

  const properties = get(
    appFormFieldsAtom({
      app: appId,
      guestSpaceId: GUEST_SPACE_ID,
      debug: !isProd,
    })
  );
  return properties;
});

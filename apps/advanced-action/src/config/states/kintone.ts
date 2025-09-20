import { filterUnsupportedFieldTypes } from '@/lib/constants';
import { GUEST_SPACE_ID, isProd } from '@/lib/global';
import {
  getAllApps,
  getSpace,
  kintoneAPI,
  withSpaceIdFallback,
} from '@konomi-app/kintone-utilities';
import { appFormFieldsAtom, currentAppIdAtom } from '@repo/jotai';
import { atom } from 'jotai';

export const currentAppFieldsAtom = atom(async (get) => {
  const app = get(currentAppIdAtom);
  const properties = await get(
    appFormFieldsAtom({
      app,
      guestSpaceId: GUEST_SPACE_ID,
      preview: true,
    })
  );
  return properties.filter(filterUnsupportedFieldTypes);
});

/**
 * ユーザーがアクセス可能な全てのアプリの情報を取得するAtom
 */
export const kintoneAppsAtom = atom(() => {
  return getAllApps({ guestSpaceId: GUEST_SPACE_ID, debug: !isProd });
});

/**
 * ユーザーがアクセス可能な全てのスペースの情報を取得するAtom
 */
export const kintoneSpacesAtom = atom<Promise<kintoneAPI.rest.space.GetSpaceResponse[]>>(
  async (get) => {
    const apps = await get(kintoneAppsAtom);
    const spaceIds = [
      ...new Set(apps.filter((app) => app.spaceId).map<string>((app) => app.spaceId as string)),
    ];

    const spaces: kintoneAPI.rest.space.GetSpaceResponse[] = [];
    for (const id of spaceIds) {
      try {
        const space = await withSpaceIdFallback({
          spaceId: id,
          func: getSpace,
          funcParams: { id, debug: !isProd },
        });
        spaces.push(space);
      } catch (error) {
        console.error(`スペース情報の取得に失敗しました: ${id}`, error);
      }
    }

    return spaces;
  }
);

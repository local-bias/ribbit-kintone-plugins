import { getApp, getAppId, type kintoneAPI } from '@konomi-app/kintone-utilities';
import { atom } from 'jotai';
import { GUEST_SPACE_ID, isProd } from '@/lib/global';
import { restorePluginConfig } from '@/lib/plugin';

const { config: initialConfig, error: configError } = restorePluginConfig();

export const pluginConfigAtom = atom(initialConfig);
export const pluginConfigErrorAtom = atom(configError ?? null);

export const pluginCommonConfigAtom = atom((get) => get(pluginConfigAtom).common);
export const pluginConditionsAtom = atom((get) => get(pluginConfigAtom).conditions);

export const currentAppAtom = atom(getAppId());

export const currentAppInfoAtom = atom<Promise<kintoneAPI.App | null>>(async (get) => {
  const appId = get(currentAppAtom);
  if (!appId) {
    return null;
  }
  const app = await getApp({
    id: appId,
    guestSpaceId: GUEST_SPACE_ID,
    debug: !isProd,
  });

  return app;
});

export const currentSpaceIdAtom = atom<Promise<string | null>>(async (get) => {
  const app = await get(currentAppInfoAtom);
  return app?.spaceId ?? null;
});

import { createKetch } from '@konomi-app/ketch';
import { URL_PLUGIN_CDN } from '@repo/constants';

export async function hasNewVersion(pluginId: string, currentVersion: string) {
  try {
    const url = `${URL_PLUGIN_CDN}/${pluginId}/version`;
    const ketch = createKetch({ pluginId });
    const response = await ketch(url);
    const version = await response.text();
    return version !== currentVersion;
  } catch (error) {
    return false;
  }
}

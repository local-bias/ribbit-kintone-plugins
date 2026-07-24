import meta from '@/../plugin.config.mjs';

const manifest = meta.manifest.base;

export const PLUGIN_KEY = 'calendar';
export const PLUGIN_NAME = manifest.name.ja;
export const PLUGIN_VERSION = manifest.version;

export const LOCAL_STORAGE_PREFIX = 'ribbit-kintone-plugin-';
export const LOCAL_STORAGE_KEY = `${LOCAL_STORAGE_PREFIX}${PLUGIN_KEY}`;

export const URL_HOMEPAGE = manifest.homepage_url.ja;
export const URL_INQUIRY = 'https://form.konomi.app';
export const URL_PROMOTION = 'https://promotion.konomi.app/kintone-plugin';
export const URL_BANNER = 'https://promotion.konomi.app/kintone-plugin/sidebar';
export const URL_PLUGIN_LIST = 'https://ribbit.konomi.app/kintone-plugin';

export const VIEW_ROOT_ID = 'ribbit-scheduler';

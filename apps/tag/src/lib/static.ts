import config from '../../plugin.config.mjs';

export const WORD_CLOUD_ROOT_ID = `konomi-app_word-cloud`;
export const PLUGIN_NAME = config.manifest.base.name.ja;

export const URL_INQUIRY = 'https://form.konomi.app';
export const URL_PROMOTION = 'https://promotion.konomi.app/kintone-plugin';
export const URL_BANNER = 'https://promotion.konomi.app/kintone-plugin/sidebar';

/** タグサジェスト用のローカルストレージキー */
export const TAG_CACHE_STORAGE_KEY = `🐸${config.id}-tag-cache`;

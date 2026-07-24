import config from '@/../plugin.config.mjs';

export const PLUGIN_NAME = config.manifest.base.name.ja;

export const URL_INQUIRY = 'https://form.konomi.app';
export const URL_PROMOTION = 'https://promotion.konomi.app/kintone-plugin';
export const URL_BANNER = 'https://promotion.konomi.app/kintone-plugin/sidebar';

// レガシー: IndexedDBキャッシュ(desktop/cache-control)導入前に使っていたlocalStorageキーで、
// 現在は初回ロード時に削除するためだけに参照している。新規のキャッシュ用途では使用しないこと。
export const LOCAL_STORAGE_KEY = `🐸${config.id}-cache`;

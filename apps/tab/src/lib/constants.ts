import config from '@/../plugin.config.mjs';

export const PLUGIN_NAME = config.manifest.base.name.ja;

/**
 * タブを描画するルート要素のid
 *
 * `src/styles/desktop.css`のセレクタの起点として使用するため、CSS側と同期させる必要があります
 */
export const PLUGIN_ROOT_ID = 'ribbit-tab-plugin-root';

/**
 * タブの幅(px)の既定値
 *
 * バージョン2でMUIの垂直タブが実際に取っていた幅に合わせています
 */
export const DEFAULT_TAB_WIDTH = 190;

/** 設定できるタブの幅(px)の下限 */
export const MIN_TAB_WIDTH = 80;

/** 設定できるタブの幅(px)の上限 */
export const MAX_TAB_WIDTH = 480;

/** タブを描画する対象となる、kintoneのレコード画面のルート要素 */
export const RECORD_ROOT_SELECTOR = '#record-gaia';

/**
 * レコード画面を横並びのレイアウトへ変更するためのクラス名
 *
 * `src/styles/desktop.css`で定義しています
 */
export const RECORD_LAYOUT_CLASS = 'ribbit-tab-record-layout';

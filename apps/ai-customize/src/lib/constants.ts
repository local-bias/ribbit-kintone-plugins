import config from '@/../plugin.config.mjs';

export const PLUGIN_NAME = config.manifest.base.name.ja;

/** 1対象アプリで実行するアセットの上限。超えたら一部だけ実行せず、全体を実行しない(ADR-22) */
export const MAX_ASSETS_PER_APP = 100;

/** 1アセットのコードの上限(UTF-8 byte) */
export const MAX_CODE_BYTES = 128 * 1024;

/** 1対象アプリの有効コード合計の上限(UTF-8 byte) */
export const MAX_TOTAL_CODE_BYTES = 2 * 1024 * 1024;

/**
 * 起動ゲートでアセットの取得を待つ上限(ms)
 *
 * 暫定値。P-1の実測で確定する(docs/05-runtime.md 2-1)
 */
export const GATE_TIMEOUT_MS = 3000;

/** JSアセットの評価時間がこれを超えたら警告する(ms) */
export const EVALUATION_WARNING_MS = 100;

/** 同一アセットが同一ページでこの回数以上例外を出したら、そのタブでの実行を止める */
export const CIRCUIT_BREAKER_THRESHOLD = 3;

/** 「通信先」の行数の上限 */
export const MAX_EXTERNAL_PATTERNS = 50;

/** 「通信先」の1行の上限(UTF-8 byte) */
export const MAX_EXTERNAL_PATTERN_BYTES = 2048;

/** 実行順が未設定・不正なときの既定値 */
export const DEFAULT_ASSET_ORDER = 100;

/** セーフモードを指定するURLクエリのキー。`?ai-customize=off` */
export const SAFE_MODE_QUERY_KEY = 'ai-customize';
export const SAFE_MODE_QUERY_VALUE = 'off';

/**
 * 本プラグインがlocalStorageで使うキーの接頭辞
 *
 * アセットのコード本文は保存しない。ミュートのID一覧とセーフモードのフラグだけ(docs/05-runtime.md 2-2)
 */
export const STORAGE_KEY_PREFIX = '🐸-ai-customize:v3';

/** 画面に出す通知のルート要素のid */
export const NOTICE_ROOT_ID = 'ribbit-ai-customize-notice';

/** ランチャー(起動ボタンとパネル)のルート要素のid */
export const LAUNCHER_ROOT_ID = 'ribbit-ai-customize-launcher';

/**
 * ランチャーの重なり順
 *
 * kintoneのヘッダーや固定UIより上、MUIのメニュー・ツールチップ(1300〜1500)より下にする。
 * 最大値付近は使わない(kintone本体や他プラグインのダイアログを覆わないため)
 */
export const LAUNCHER_Z_INDEX = 1000;

/** アセットのJSに付ける`sourceURL`の接頭辞 */
export const SOURCE_URL_PREFIX = 'ai-customize';

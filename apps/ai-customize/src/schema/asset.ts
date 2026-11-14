/**
 * アセット(アセット管理アプリの1レコード = 1件のJSまたはCSS)の型定義
 *
 * @see docs/04-asset-app.md
 */

/** アセットの種別 */
export type AssetKind = 'js' | 'css';

/**
 * 影響範囲
 * - `private`: 作成者本人の画面でだけ適用する
 * - `public`: このアプリを開く全員の画面に適用する
 */
export type AssetScope = 'private' | 'public';

/** アセットを適用する画面 */
export const ASSET_SCREENS = ['index', 'detail', 'create', 'edit'] as const;
export type AssetScreen = (typeof ASSET_SCREENS)[number];

/**
 * カスタマイズ単位の権限
 *
 * 読み取り(GET)は常に許可するため、ここには含めない。
 * - `post` / `put` / `delete`: kintone REST APIの追加・更新・削除
 * - `external-listed`: 通信先リストに一致する送信先だけ外部通信を許可する
 * - `external-all`: 送信先を問わず外部通信を許可する
 * - `unrestricted`: 迂回パターンを含むコードの実行を含め、全てを許可する
 *
 * @see docs/13-launch-gate-and-permissions.md 3章
 */
export type AssetPermission =
  | 'post'
  | 'put'
  | 'delete'
  | 'external-listed'
  | 'external-all'
  | 'unrestricted';

/** 通信先として無効だった行と、その理由 */
export type InvalidExternalPattern = {
  /** 「通信先」フィールド内の行番号(1始まり) */
  line: number;
  raw: string;
  reason: ExternalPatternError;
};

export type ExternalPatternError =
  | 'invalid-url'
  | 'unsupported-scheme'
  | 'userinfo'
  | 'query'
  | 'fragment'
  | 'wildcard'
  | 'too-long'
  | 'too-many';

export type Asset = {
  /** レコードID */
  id: string;
  /** 楽観ロック用のリビジョン */
  revision: string;
  title: string;
  /** 適用先のアプリID */
  targetAppId: string;
  /** 適用先のゲストスペースID。通常スペースは`'0'` */
  targetSpaceId: string;
  kind: AssetKind;
  scope: AssetScope;
  enabled: boolean;
  /** 所有者(作成者)のログイン名。取得できない場合は空文字 */
  ownerCode: string;
  code: string;
  /** 実行順(昇順) */
  order: number;
  /** 空配列は「全画面」を意味する */
  screens: AssetScreen[];
  description: string;
  /** 付与済みの権限。空配列は読み取りのみ */
  permissions: AssetPermission[];
  /** 外部通信の通信先パターン(正規化済み・有効なものだけ) */
  externalUrls: string[];
  /** 「通信先」フィールドの値そのもの(コメント行を含む)。編集はこれに対して行い、コメントを消さない */
  externalUrlsText: string;
  /** 無効として除外した通信先の行 */
  invalidExternalUrls: InvalidExternalPattern[];
  /** 通信先の警告(暗号化されない`http:`など) */
  externalUrlWarnings: { line: number; pattern: string; reason: 'insecure' }[];
  /** 管理アプリ側の設定に不備があったときの説明(実行はする) */
  configurationIssues: AssetConfigurationIssue[];
};

export type AssetConfigurationIssue = 'conflicting-external-permissions';

/**
 * パネルとAIのツールから書き換えられる項目
 *
 * タイトル・説明・適用画面はAIの`write_asset`だけが書き換える(docs/07-ai-tools.md 4-10章)
 *
 * @see docs/06-ui.md 5章
 */
export type AssetPatch = Partial<
  Pick<
    Asset,
    | 'enabled'
    | 'scope'
    | 'code'
    | 'order'
    | 'permissions'
    | 'externalUrlsText'
    | 'title'
    | 'description'
    | 'screens'
  >
>;

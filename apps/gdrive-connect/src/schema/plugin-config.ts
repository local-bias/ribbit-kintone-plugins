import { z } from 'zod';

export const FolderCreationTriggerSchema = z.enum(['manual', 'onSave', 'onDemand']);

export const PluginConditionV1Schema = z.object({
  /**
   * プラグイン設定を一意に識別するためのID
   * 設定の並び替えに使用されます
   */
  id: z.string(),
  memo: z.string(),
  /** レコードごとのGoogleドライブフォルダを表示するスペースフィールドのID */
  targetSpaceId: z.string(),
  /** レコードフォルダの作成先となるGoogleドライブの親フォルダID */
  parentFolderId: z.string(),
  /** 作成したGoogleドライブフォルダのIDを保存するフィールドコード(単一行テキスト) */
  folderIdFieldCode: z.string(),
  /** フォルダ名の生成に使用するフィールドコード */
  folderNameFieldCodes: z.array(z.string()),
  /**
   * Googleドライブフォルダの作成タイミング
   * - manual: 自動作成しない(手動でIDが指定されたレコードのみ対象)
   * - onSave: レコード保存時に作成
   * - onDemand: 表示スペースでユーザーが操作(フォルダ作成ボタン)を行ったときに作成
   */
  folderCreationTrigger: FolderCreationTriggerSchema.default('onSave'),
});
export const PluginConfigV1Schema = z.object({
  version: z.literal(1),
  common: z.object({
    /** GoogleドライブAPIへの接続に使用するOAuthクライアントID */
    oauthClientId: z.string(),
    /**
     * GoogleドライブAPIへの接続に使用するOAuthクライアントシークレット
     *
     * Googleの仕様上、「ウェブアプリケーション」タイプのOAuthクライアントはPKCEを使用していても
     * トークン交換時にclient_secretを必須とするため、バックエンドを持たない本プラグインでは
     * やむを得ずここに保持する。プラグイン設定はkintoneの管理者のみが編集できるが、
     * 完全な機密情報としては扱われない(該当kintone環境の管理者からは参照可能)点に注意。
     */
    oauthClientSecret: z.string(),
  }),
  conditions: z.array(PluginConditionV1Schema),
});
type PluginConfigV1 = z.infer<typeof PluginConfigV1Schema>;

/** 🔌 過去全てのバージョンを含むプラグインの設定情報 */
export const AnyPluginConfigSchema = z.discriminatedUnion('version', [PluginConfigV1Schema]);

export const LatestPluginConditionSchema = PluginConditionV1Schema;

/** 🔌 プラグインがアプリ単位で保存する設定情報 */
export type PluginConfig = PluginConfigV1;

/** 🔌 プラグインの共通設定 */
export type PluginCommonConfig = PluginConfig['common'];

/** 🔌 プラグインの詳細設定 */
export type PluginCondition = PluginConfig['conditions'][number];

/** 🔌 Googleドライブフォルダの作成タイミング */
export type FolderCreationTrigger = PluginCondition['folderCreationTrigger'];

/** 🔌 過去全てのバージョンを含むプラグインの設定情報 */
export type AnyPluginConfig = z.infer<typeof AnyPluginConfigSchema>;

import { z } from 'zod';

export const ButtonLocationSchema = z.enum(['list-header', 'detail-header', 'space']);
export type ButtonLocation = z.infer<typeof ButtonLocationSchema>;

export const PluginConditionV1Schema = z.object({
  /**
   * プラグイン設定を一意に識別するためのID
   * 設定の並び替えに使用されます
   */
  id: z.string(),
  /** ダウンロードボタンに表示するラベル */
  buttonLabel: z.string(),
  /** 対象の添付ファイルフィールドコード。サブテーブル内の場合は "サブテーブルコード.フィールドコード" 形式 */
  fieldCodes: z.array(z.string()),
  /** ボタンの設置場所 */
  buttonLocation: ButtonLocationSchema,
  /** スペースフィールドID（buttonLocationが"space"の場合のみ） */
  spaceFieldId: z.string(),
  /** ダウンロードするZIPファイル名。テンプレート変数: {{date:FORMAT}}, {{appName}}, {{appId}} */
  zipFileName: z.string(),
});
export const PluginConfigV1Schema = z.object({
  version: z.literal(1),
  common: z.object({
    memo: z.string(),
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

/** 🔌 過去全てのバージョンを含むプラグインの設定情報 */
export type AnyPluginConfig = z.infer<typeof AnyPluginConfigSchema>;

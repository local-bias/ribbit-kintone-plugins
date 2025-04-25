import { z } from 'zod';
import { ImageFormatSchema } from './image';

export const PluginConditionV1Schema = z.object({
  /**
   * プラグイン設定を一意に識別するためのID
   * 設定の並び替えに使用されます
   */
  id: z.string(),
  /** DnDエリアを設置するスペースのスペースID */
  targetSpaceId: z.string(),
  /** 変換後のファイルを保存するファイルフィールドのフィールドコード */
  targetFileFieldCode: z.string(),
  /** 変換する画像フォーマット */
  imageFormat: ImageFormatSchema,
  /** プラグインを有効にする画面 */
  targetEvents: z.array(z.enum(['create', 'edit', 'detail'])),
  /** DnDエリア内に表示する説明文 */
  dropzoneDescription: z.string(),
  /** 標準のファイルフィールドを無効にするかどうか */
  disableVanillaFileField: z.boolean(),
  // /** アップロードできるファイルサイズの上限 */
  // maxFileSizeKB: z.number(),
});
export const PluginConfigV1Schema = z.object({
  version: z.literal(1),
  common: z.object({}),
  conditions: z.array(PluginConditionV1Schema),
});
type PluginConfigV1 = z.infer<typeof PluginConfigV1Schema>;

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

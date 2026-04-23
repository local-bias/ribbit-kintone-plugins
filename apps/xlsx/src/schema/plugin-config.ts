import { z } from 'zod';

/**
 * 構造共通化前のプラグイン設定スキーマ
 */
export const PluginConfigV0Schema = z.object({
  allRecords: z.boolean(),
  allFields: z.boolean(),
  union: z.boolean(),
  fileNameTemplate: z.string(),
  sheetName: z.string(),
  dateAsExcel: z.boolean(),
});
export type PluginConfigV0 = z.infer<typeof PluginConfigV0Schema>;

export const PluginConditionV1Schema = z.object({
  /**
   * プラグイン設定を一意に識別するためのID
   * 設定の並び替えに使用されます
   */
  id: z.string(),
  allRecords: z.boolean(),
  allFields: z.boolean(),
  union: z.boolean(),
  fileNameTemplate: z.string(),
  sheetName: z.string(),
  dateAsExcel: z.boolean(),
  /**
   * 表示する一覧を制限するか
   * `true`の場合、`targetViews`で指定された一覧のみが表示されます
   * `false`の場合、全ての一覧が表示されます
   */
  targetViewsEnabled: z.boolean(),
  /**
   * 表示する一覧のIDの配列
   * `targetViewsEnabled`が`true`の場合にのみ使用されます
   */
  targetViews: z.array(z.string()),
  /**
   * 出力するフィールドを個別に設定するか
   * `true`の場合、`targetFields`で指定されたフィールドのみが出力されます
   * `false`の場合、表示中の一覧の全てのフィールドが出力されます
   */
  targetFieldsEnabled: z.boolean(),
  /**
   * 出力するフィールドのコードの配列
   * `targetFieldsEnabled`が`true`の場合にのみ使用されます
   */
  targetFields: z.array(z.object({ id: z.string(), fieldCode: z.string() })),
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

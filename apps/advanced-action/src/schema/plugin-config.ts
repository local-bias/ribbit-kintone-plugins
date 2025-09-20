import { z } from 'zod';

export const PluginConditionV1Schema = z.object({
  /**
   * プラグイン設定を一意に識別するためのID
   * 設定の並び替えに使用されます
   */
  id: z.string(),
  /**
   * アプリモード
   * `source`: アクションボタンを設置するアプリ(レコードのコピー元)
   * `destination`: アクションボタンをクリックした際にレコードをコピーするアプリ(レコードのコピー先)
   */
  mode: z.union([z.literal('source'), z.literal('destination')]).default('source'),
  dstAppId: z.string(),
  dstGuestSpaceId: z.string().optional(),
  buttonLabel: z.string(),
  appConnections: z.array(
    z.object({
      id: z.string(),
      appId: z.string(),
      guestSpaceId: z.string().optional(),
      srcFieldCode: z.string(),
      dstFieldCode: z.string(),
    })
  ),
  fields: z.array(
    z.object({
      id: z.string(),
      type: z.union([z.literal('copy'), z.literal('fixed_value'), z.literal('calc')]),
      srcAppId: z.string(),
      srcFieldCode: z.string(),
      dstAppId: z.string(),
      dstFieldCode: z.string(),
      /** `type`が`fixed_value`の場合に使用する固定値 */
      fixedValue: z.string(),
    })
  ),
  /** ボタンを表示するユーザー */
  users: z.array(
    z.object({
      type: z.union([z.literal('user'), z.literal('group'), z.literal('organization')]),
      code: z.string(),
    })
  ),
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

export type PluginAppConnection = PluginCondition['appConnections'][number];
export type PluginField = PluginCondition['fields'][number];
export type PluginFieldType = PluginField['type'];

/** 🔌 過去全てのバージョンを含むプラグインの設定情報 */
export type AnyPluginConfig = z.infer<typeof AnyPluginConfigSchema>;

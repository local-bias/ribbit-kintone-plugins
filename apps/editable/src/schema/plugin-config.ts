import { z } from 'zod';

export const PluginConditionV1Schema = z.object({
  targetField: z.string(),
  rules: z.array(
    z.object({
      type: z.enum([
        'always',
        'empty',
        'full',
        'greater',
        'less',
        'equal',
        'notEqual',
        'includes',
        'notIncludes',
      ]),
      field: z.string(),
      value: z.string(),
      editable: z.boolean(),
      connector: z.enum(['and', 'or']),
    })
  ),
});

export const PluginConfigV1Schema = z.object({
  version: z.literal(1),
  conditions: z.array(PluginConditionV1Schema),
});

export const PluginConditionV2Schema = z.object({
  // ------ 追加 -------
  id: z.string(),

  // ------ 継続 ------
  targetField: z.string(),
  rules: z.array(
    z.object({
      type: z.enum([
        'always',
        'empty',
        'full',
        'greater',
        'less',
        'equal',
        'notEqual',
        'includes',
        'notIncludes',
      ]),
      field: z.string(),
      value: z.string(),
      editable: z.boolean(),
      connector: z.enum(['and', 'or']),
    })
  ),
});

export const PluginConfigV2Schema = z.object({
  version: z.literal(2),
  conditions: z.array(PluginConditionV2Schema),
});

type PluginConfigV2 = z.infer<typeof PluginConfigV2Schema>;

export const AnyPluginConfigSchema = z.discriminatedUnion('version', [
  PluginConfigV1Schema,
  PluginConfigV2Schema,
]);

export const LatestPluginConditionSchema = PluginConditionV2Schema;

/** 🔌 プラグインがアプリ単位で保存する設定情報 */
export type PluginConfig = PluginConfigV2;

// /** 🔌 プラグインの共通設定 */
// export type PluginCommonConfig = PluginConfig['common'];

/** 🔌 プラグインの詳細設定 */
export type PluginCondition = PluginConfig['conditions'][number];

/** 🔌 過去全てのバージョンを含むプラグインの設定情報 */
export type AnyPluginConfig = z.infer<typeof AnyPluginConfigSchema>;

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

type PluginConfigV1 = z.infer<typeof PluginConfigV1Schema>;

export const AnyPluginConfigSchema = z.discriminatedUnion('version', [PluginConfigV1Schema]);

export const LatestPluginConditionSchema = PluginConditionV1Schema;

/** 🔌 プラグインがアプリ単位で保存する設定情報 */
export type PluginConfig = PluginConfigV1;

// /** 🔌 プラグインの共通設定 */
// export type PluginCommonConfig = PluginConfig['common'];

/** 🔌 プラグインの詳細設定 */
export type PluginCondition = PluginConfig['conditions'][number];

/** 🔌 過去全てのバージョンを含むプラグインの設定情報 */
export type AnyPluginConfig = z.infer<typeof AnyPluginConfigSchema>;

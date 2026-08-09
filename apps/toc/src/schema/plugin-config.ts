import { z } from 'zod';

/*
 * プラグインの設定情報
 *
 * z.mergeを使ってバージョン間の差分を表現することもできるが、型推論が複雑になるため、重複して許容して定義する
 */

const PluginConfigV1Schema = z.object({
  version: z.literal(1),
  tocTitle: z.string().optional(),
  maxWidth: z.number().optional(),
  headings: z.array(
    z.object({
      spaceId: z.string(),
      label: z.string(),
      color: z.string().optional(),
    })
  ),
});

const PluginConfigV2Schema = z.object({
  version: z.literal(2),
  common: z.object({
    type: z.union([z.literal('sticky-left'), z.literal('sidebar-right')]),
    tocTitle: z.string(),
    maxWidth: z.number().nullable(),
  }),
  conditions: z.array(
    z.object({
      spaceId: z.string(),
      label: z.string(),
      color: z.string(),
    })
  ),
});

export const AnyPluginConfigSchema = z.discriminatedUnion('version', [
  PluginConfigV1Schema,
  PluginConfigV2Schema,
]);

const LatestPluginConfigSchema = PluginConfigV2Schema;

export const LatestPluginConditionSchema = LatestPluginConfigSchema.shape.conditions.element;

/** 🔌 過去全てのバージョンを含むプラグインの設定情報 */
export type AnyPluginConfig = z.infer<typeof AnyPluginConfigSchema>;

/** 🔌 プラグインがアプリ単位で保存する設定情報 */
export type PluginConfig = z.infer<typeof LatestPluginConfigSchema>;

/** 🔌 プラグインの詳細設定 */
export type PluginCondition = PluginConfig['conditions'][number];

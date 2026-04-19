import { z } from 'zod';

export const OutputFieldTypeSchema = z.enum(['string', 'number', 'boolean', 'array_string']);

// ---- V1 (旧バージョン: マイグレーション用に保持) ----

const ExecutionTimingV1Schema = z.enum(['manual', 'on_save']);

const OutputFieldDefV1Schema = z.object({
  label: z.string(),
  fieldCode: z.string(),
  description: z.string(),
  type: OutputFieldTypeSchema,
});

export const PluginConditionV1Schema = z.object({
  id: z.string(),
  memo: z.string(),
  aiModel: z.string(),
  systemPrompt: z.string(),
  outputFields: z.array(OutputFieldDefV1Schema),
  buttonLabel: z.string(),
  executionTiming: ExecutionTimingV1Schema,
  temperature: z.number(),
  maxExternalRecords: z.number(),
  apiTimeout: z.number(),
});

export const PluginConfigV1Schema = z.object({
  version: z.literal(1),
  common: z.object({}),
  conditions: z.array(PluginConditionV1Schema),
});

// ---- V2 (最新バージョン) ----

const ExecutionTimingSchema = z.enum(['manual', 'on_save', 'space_field']);

export const OutputFieldDefSchema = z.object({
  fieldCode: z.string(),
  description: z.string(),
});

export const PluginConditionV2Schema = z.object({
  id: z.string(),
  memo: z.string(),
  aiModel: z.string(),
  systemPrompt: z.string(),
  outputFields: z.array(OutputFieldDefSchema),
  buttonLabel: z.string(),
  executionTiming: ExecutionTimingSchema,
  spaceFieldId: z.string(),
  temperature: z.number(),
  maxExternalRecords: z.number(),
  apiTimeout: z.number(),
});

export const PluginConfigV2Schema = z.object({
  version: z.literal(2),
  common: z.object({}),
  conditions: z.array(PluginConditionV2Schema),
});
type PluginConfigV2 = z.infer<typeof PluginConfigV2Schema>;

/** 🔌 過去全てのバージョンを含むプラグインの設定情報 */
export const AnyPluginConfigSchema = z.discriminatedUnion('version', [
  PluginConfigV1Schema,
  PluginConfigV2Schema,
]);

export const LatestPluginConditionSchema = PluginConditionV2Schema;

/** 🔌 プラグインがアプリ単位で保存する設定情報 */
export type PluginConfig = PluginConfigV2;

/** 🔌 プラグインの共通設定 */
export type PluginCommonConfig = PluginConfig['common'];

/** 🔌 プラグインの詳細設定 */
export type PluginCondition = PluginConfig['conditions'][number];

/** 🔌 出力フィールド定義(設定保存用) */
export type OutputFieldDef = z.infer<typeof OutputFieldDefSchema>;

/** 🔌 出力フィールドの型(実行時に推論) */
export type OutputFieldType = z.infer<typeof OutputFieldTypeSchema>;

/** 🔌 実行時に補完された出力フィールド定義 */
export interface ResolvedOutputFieldDef extends OutputFieldDef {
  label: string;
  type: OutputFieldType;
}

/** 🔌 実行タイミング */
export type ExecutionTiming = z.infer<typeof ExecutionTimingSchema>;

/** 🔌 過去全てのバージョンを含むプラグインの設定情報 */
export type AnyPluginConfig = z.infer<typeof AnyPluginConfigSchema>;

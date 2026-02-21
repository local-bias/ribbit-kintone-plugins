import { z } from 'zod';
import { nanoid } from 'nanoid';

/**
 * ガントチャートプラグインの設定スキーマ - V1
 */
export const PluginConditionV1Schema = z.object({
  /** 条件ID（Jotai管理用） */
  id: z.string(),
  /** メモ（条件名） */
  memo: z.string(),
  /** 対象カスタムビューのID */
  viewId: z.string(),
  /** タスク名フィールド（SINGLE_LINE_TEXT / MULTI_LINE_TEXT） */
  titleFieldCode: z.string(),
  /** 開始日フィールド（DATE / DATETIME） */
  startDateFieldCode: z.string(),
  /** 終了日フィールド（DATE / DATETIME） */
  endDateFieldCode: z.string(),
  /** 担当者フィールド（USER_SELECT、任意） */
  assigneeFieldCode: z.string(),
  /** カテゴリフィールド（DROP_DOWN / RADIO_BUTTON / SINGLE_LINE_TEXT、任意） */
  categoryFieldCode: z.string(),
  /** 進捗率フィールド（NUMBER、任意） */
  progressFieldCode: z.string(),
  /** 色/ラベルフィールド（DROP_DOWN / RADIO_BUTTON、任意） */
  colorFieldCode: z.string(),
  /** カテゴリソート順フィールド（NUMBER、任意） */
  categorySortFieldCode: z.string(),
  /** デフォルトスケール */
  defaultScale: z.enum(['day', 'week', 'month']),
});

export const PluginConfigV1Schema = z.object({
  version: z.literal(1),
  common: z.object({
    memo: z.string(),
  }),
  conditions: z.array(PluginConditionV1Schema),
});

export const AnyPluginConfigSchema = z.discriminatedUnion('version', [PluginConfigV1Schema]);

export const LatestPluginConditionSchema = PluginConditionV1Schema;

export type AnyPluginConfig = z.infer<typeof AnyPluginConfigSchema>;
export type PluginConfig = z.infer<typeof PluginConfigV1Schema>;
export type PluginCondition = PluginConfig['conditions'][number];
export type GanttScale = PluginCondition['defaultScale'];

export const getNewCondition = (): PluginCondition => ({
  id: nanoid(),
  memo: '',
  viewId: '',
  titleFieldCode: '',
  startDateFieldCode: '',
  endDateFieldCode: '',
  assigneeFieldCode: '',
  categoryFieldCode: '',
  progressFieldCode: '',
  colorFieldCode: '',
  categorySortFieldCode: '',
  defaultScale: 'day',
});

export const createConfig = (): PluginConfig => ({
  version: 1,
  common: { memo: '' },
  conditions: [getNewCondition()],
});

export const migrateConfig = (anyConfig: AnyPluginConfig): PluginConfig => {
  const { version } = anyConfig;
  switch (version) {
    case 1:
    default:
      return anyConfig;
  }
};

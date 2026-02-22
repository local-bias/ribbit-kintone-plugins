import { z } from 'zod';
import { nanoid } from 'nanoid';

// ─── V1 ────────────────────────────────

export const PluginConditionV1Schema = z.object({
  id: z.string(),
  memo: z.string(),
  viewId: z.string(),
  titleFieldCode: z.string(),
  startDateFieldCode: z.string(),
  endDateFieldCode: z.string(),
  assigneeFieldCode: z.string(),
  categoryFieldCode: z.string(),
  progressFieldCode: z.string(),
  colorFieldCode: z.string(),
  categorySortFieldCode: z.string(),
  defaultScale: z.enum(['day', 'week', 'month']),
});

export const PluginConfigV1Schema = z.object({
  version: z.literal(1),
  common: z.object({ memo: z.string() }),
  conditions: z.array(PluginConditionV1Schema),
});

// ─── V2 ──────────────────────────────

/** カテゴリ値ごとの色マッピング */
export const CategoryColorSchema = z.object({
  value: z.string(),
  color: z.string(),
});

/** カテゴリ設定（1 階層分） */
export const CategorySettingSchema = z.object({
  /** カテゴリに使用するフィールドコード（DROP_DOWN / RADIO_BUTTON / SINGLE_LINE_TEXT / USER_SELECT） */
  fieldCode: z.string(),
  /** このカテゴリの値に対する色マッピング（空配列 = 色分けなし） */
  colors: z.array(CategoryColorSchema),
});

export const PluginConditionV2Schema = z.object({
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
  /** 担当者フィールド（USER_SELECT、任意 — ツールチップ表示用） */
  assigneeFieldCode: z.string(),
  /** 階層化カテゴリ設定（上から順に親→子） */
  categories: z.array(CategorySettingSchema),
  /** 進捗率フィールド（NUMBER、任意） */
  progressFieldCode: z.string(),
  /** カテゴリソート順フィールド（NUMBER、任意） */
  categorySortFieldCode: z.string(),
  /** デフォルトスケール */
  defaultScale: z.enum(['day', 'week', 'month']),
});

export const PluginConfigV2Schema = z.object({
  version: z.literal(2),
  common: z.object({ memo: z.string() }),
  conditions: z.array(PluginConditionV2Schema),
});

// ─── 共通型定義 ──────────────────────────────────────

export const AnyPluginConfigSchema = z.discriminatedUnion('version', [
  PluginConfigV1Schema,
  PluginConfigV2Schema,
]);

export const LatestPluginConditionSchema = PluginConditionV2Schema;

export type AnyPluginConfig = z.infer<typeof AnyPluginConfigSchema>;
export type PluginConfig = z.infer<typeof PluginConfigV2Schema>;
export type PluginCondition = PluginConfig['conditions'][number];
export type GanttScale = PluginCondition['defaultScale'];
export type CategorySetting = z.infer<typeof CategorySettingSchema>;
export type CategoryColor = z.infer<typeof CategoryColorSchema>;

export const getNewCondition = (): PluginCondition => ({
  id: nanoid(),
  memo: '',
  viewId: '',
  titleFieldCode: '',
  startDateFieldCode: '',
  endDateFieldCode: '',
  assigneeFieldCode: '',
  categories: [],
  progressFieldCode: '',
  categorySortFieldCode: '',
  defaultScale: 'day',
});

export const createConfig = (): PluginConfig => ({
  version: 2,
  common: { memo: '' },
  conditions: [getNewCondition()],
});

export const migrateConfig = (anyConfig: AnyPluginConfig): PluginConfig => {
  const { version } = anyConfig;
  switch (version) {
    case 1: {
      const v1 = anyConfig;
      return migrateConfig({
        version: 2,
        common: v1.common,
        conditions: v1.conditions.map((c) => ({
          id: c.id,
          memo: c.memo,
          viewId: c.viewId,
          titleFieldCode: c.titleFieldCode,
          startDateFieldCode: c.startDateFieldCode,
          endDateFieldCode: c.endDateFieldCode,
          assigneeFieldCode: c.assigneeFieldCode,
          categories: c.categoryFieldCode ? [{ fieldCode: c.categoryFieldCode, colors: [] }] : [],
          progressFieldCode: c.progressFieldCode,
          categorySortFieldCode: c.categorySortFieldCode,
          defaultScale: c.defaultScale,
        })),
      });
    }
    case 2:
    default:
      return anyConfig;
  }
};

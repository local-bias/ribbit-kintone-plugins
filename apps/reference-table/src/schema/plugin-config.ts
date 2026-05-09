import { z } from 'zod';

export const DEFAULT_RECORDS_PER_PAGE = 20;
export const MIN_RECORDS_PER_PAGE = 1;
export const MAX_RECORDS_PER_PAGE = 500;
export const DEFAULT_AGGREGATION_ROUNDING_MODE = 'round';
export const DEFAULT_AGGREGATION_DECIMAL_DIGITS = 10;
export const MIN_AGGREGATION_DECIMAL_DIGITS = 0;
export const MAX_AGGREGATION_DECIMAL_DIGITS = 10;

export const SortOrderSchema = z.enum(['asc', 'desc']);
export const AggregationRoundingModeSchema = z.enum(['round', 'ceil', 'floor']);
export const RelatedQueryConditionTypeSchema = z.enum([
  'equal',
  'notEqual',
  'include',
  'exclude',
  'dateAfter',
  'dateAfterOrEqual',
  'dateBefore',
  'dateBeforeOrEqual',
  'greater',
  'greaterOrEqual',
  'less',
  'lessOrEqual',
]);

export const RelatedQueryConditionSchema = z.object({
  id: z.string(),
  type: RelatedQueryConditionTypeSchema,
  /** このアプリ側で条件値として使うフィールドコード */
  currentAppFieldCode: z.string(),
  /** 関連先アプリ側で検索対象にするフィールドコード */
  relatedAppFieldCode: z.string(),
});

export const PluginConditionV1Schema = z.object({
  /**
   * プラグイン設定を一意に識別するためのID
   * 設定の並び替えに使用されます
   */
  id: z.string(),
  memo: z.string(),
  /** 表示先のスペースフィールドID */
  targetSpaceId: z.string(),
  /** 関連レコードを取得するアプリID */
  relatedAppId: z.string(),
  /** このアプリ側で照合に使うフィールドコード */
  currentAppFieldCode: z.string(),
  /** 関連先アプリ側で照合に使うフィールドコード */
  relatedAppFieldCode: z.string(),
  /** 関連レコードを取得するための動的な複数条件 */
  relatedQueryConditions: z.array(RelatedQueryConditionSchema),
  /** 関連先アプリのサブテーブルを表示する場合のサブテーブルコード */
  relatedSubtableCode: z.string(),
  /** 表示する関連先レコードのフィールドコード */
  relatedRecordFieldCodes: z.array(z.string()),
  /** サブテーブルを使用する場合にテーブルへ表示するサブテーブル内フィールドコード */
  subtableFieldCodes: z.array(z.string()),
  /** 関連レコードのフィールドを関連レコード単位で結合表示するか */
  mergeRelatedRecordFields: z.boolean().default(true),
  /** サブテーブル内照合フィールドと一致する行だけを表示するか */
  filterSubtableRowsByMatchingField: z.boolean().default(false),
  /** 数値・計算フィールドの集計値を表示するか */
  showFieldAggregations: z.boolean().default(false),
  /** 1ページに表示する行数 */
  recordsPerPage: z
    .number()
    .int()
    .min(MIN_RECORDS_PER_PAGE)
    .max(MAX_RECORDS_PER_PAGE)
    .default(DEFAULT_RECORDS_PER_PAGE),
  /** 集計値の端数処理 */
  aggregationRoundingMode: AggregationRoundingModeSchema.default(DEFAULT_AGGREGATION_ROUNDING_MODE),
  /** 集計値の小数点以下最大表示桁数 */
  aggregationDecimalDigits: z
    .number()
    .int()
    .min(MIN_AGGREGATION_DECIMAL_DIGITS)
    .max(MAX_AGGREGATION_DECIMAL_DIGITS)
    .default(DEFAULT_AGGREGATION_DECIMAL_DIGITS),
  /** 関連レコードの並び替えフィールドコード */
  sortFieldCode: z.string(),
  sortOrder: SortOrderSchema,
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

export type SortOrder = z.infer<typeof SortOrderSchema>;
export type AggregationRoundingMode = z.infer<typeof AggregationRoundingModeSchema>;
export type RelatedQueryConditionType = z.infer<typeof RelatedQueryConditionTypeSchema>;
export type RelatedQueryCondition = z.infer<typeof RelatedQueryConditionSchema>;

/** 🔌 プラグインがアプリ単位で保存する設定情報 */
export type PluginConfig = PluginConfigV1;

/** 🔌 プラグインの共通設定 */
export type PluginCommonConfig = PluginConfig['common'];

/** 🔌 プラグインの詳細設定 */
export type PluginCondition = PluginConfig['conditions'][number];

/** 🔌 過去全てのバージョンを含むプラグインの設定情報 */
export type AnyPluginConfig = z.infer<typeof AnyPluginConfigSchema>;

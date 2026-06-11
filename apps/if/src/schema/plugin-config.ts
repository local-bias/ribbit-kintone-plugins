import type { FieldConditionValue } from '@konomi-app/kintone-utilities-react';
import { z } from 'zod';

export type { FieldConditionValue };

/** `FieldConditionValue` を Zod スキーマとして扱うためのラッパー */
const FieldConditionValueSchema = z.unknown() as z.ZodType<FieldConditionValue>;

/**
 * 処理を発火させるタイミング
 * - `submit`: レコード保存時
 * - `change`: フィールド変更時
 * - `show`: 画面表示時
 */
export const TriggerTimingSchema = z.enum(['submit', 'change', 'show']);
export type TriggerTiming = z.infer<typeof TriggerTimingSchema>;

/**
 * 処理の対象となる画面
 * - `create`: レコード追加画面
 * - `edit`: レコード編集画面
 */
export const TargetEventSchema = z.enum(['create', 'edit']);
export type TargetEvent = z.infer<typeof TargetEventSchema>;

/**
 * 複数条件の結合方法
 * - `and`: すべての条件を満たす場合に発火
 * - `or`: いずれかの条件を満たす場合に発火
 */
export const ConditionLogicSchema = z.enum(['and', 'or']);
export type ConditionLogic = z.infer<typeof ConditionLogicSchema>;

/**
 * フィールドへの自動入力アクション
 */
export const FieldActionV1Schema = z.object({
  /** アクションを一意に識別するためのID */
  id: z.string(),
  /** 値をセットする対象フィールドのコード */
  fieldCode: z.string(),
  /**
   * セットする値
   * - 文字列・数値はそのまま入力されます
   * - `TODAY` / `NOW` は日付・日時・時刻フィールドの現在日時に変換されます
   * - `LOGINUSER` はユーザー選択フィールドのログインユーザーに変換されます
   * - チェックボックス等の複数選択フィールドは改行区切りで複数値を指定できます
   */
  value: z.string(),
});
export type FieldAction = z.infer<typeof FieldActionV1Schema>;

/**
 * テーブル行アクションの種類
 * - `add`: 条件成立時に行を追加する
 * - `exclude`: 条件成立時に行内条件に一致する行を削除する
 */
export const RowActionTypeSchema = z.enum(['add', 'exclude']);
export type RowActionType = z.infer<typeof RowActionTypeSchema>;

/**
 * 追加する行の各セルへ入力する値
 */
export const RowCellValueV1Schema = z.object({
  /** テーブル内フィールドのコード */
  fieldCode: z.string(),
  /** セットする値（{@link FieldActionV1Schema} の `value` と同様の記法） */
  value: z.string(),
});
export type RowCellValue = z.infer<typeof RowCellValueV1Schema>;

/**
 * テーブル行の自動追加・自動削除アクション
 */
export const RowActionV1Schema = z.object({
  /** アクションを一意に識別するためのID */
  id: z.string(),
  /** アクションの種類 */
  type: RowActionTypeSchema,
  /** 対象のテーブル（サブテーブル）のフィールドコード */
  subtableCode: z.string(),
  /** `add` の場合、既存の行をすべて置き換えるか（false の場合は末尾に追加） */
  overwrite: z.boolean(),
  /** `add` の場合に追加する行のセル値 */
  cellValues: z.array(RowCellValueV1Schema),
  /** `exclude` の場合、削除対象の行を判定する行内条件 */
  rowCondition: FieldConditionValueSchema,
});
export type RowAction = z.infer<typeof RowActionV1Schema>;

/**
 * プラグイン設定の各条件（1つの分岐処理の設定）
 */
export const PluginConditionV1Schema = z.object({
  /**
   * プラグイン設定を一意に識別するためのID
   * 設定の並び替えに使用されます
   */
  id: z.string(),
  /** 設定名（メモ） */
  memo: z.string(),
  /** 処理を適用する画面 */
  targetEvents: z.array(TargetEventSchema),
  /** 処理を発火させるタイミング */
  triggerTimings: z.array(TriggerTimingSchema),
  /** 複数条件の結合方法 */
  conditionLogic: ConditionLogicSchema,
  /** 発火させるための条件 */
  conditions: z.array(FieldConditionValueSchema),
  /** 条件成立時に実行するフィールド自動入力アクション */
  fieldActions: z.array(FieldActionV1Schema),
  /** 条件成立時に実行するテーブル行アクション */
  rowActions: z.array(RowActionV1Schema),
});

export const PluginConfigV1Schema = z.object({
  version: z.literal(1),
  common: z.object({
    /** 共通メモ */
    memo: z.string(),
  }),
  conditions: z.array(PluginConditionV1Schema),
});
type PluginConfigV1 = z.infer<typeof PluginConfigV1Schema>;

/** 🔌 過去全てのバージョンを含むプラグインの設定情報 */
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

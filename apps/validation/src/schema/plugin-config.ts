import { z } from 'zod';

/**
 * 入力チェックの種類
 */
export const ValidationTypeSchema = z.enum([
  'required', // 必須入力
  'minLength', // 最小文字数
  'maxLength', // 最大文字数
  'exactLength', // 正確な文字数
  'pattern', // 正規表現パターン
  'minValue', // 最小値（数値フィールド用）
  'maxValue', // 最大値（数値フィールド用）
  'range', // 数値の範囲（min-max形式）
  'email', // メールアドレス形式
  'url', // URL形式
  'phone', // 電話番号形式（日本）
  'postalCode', // 郵便番号形式（日本）
  'alphanumeric', // 英数字のみ
  'numeric', // 数字のみ
  'alpha', // 英字のみ
  'hiragana', // ひらがなのみ
  'katakana', // カタカナのみ（全角）
  'halfwidthKatakana', // 半角カタカナのみ
  'fullwidth', // 全角文字のみ
  'halfwidth', // 半角文字のみ
  'fullwidthAlphanumeric', // 全角英数字のみ
  'corporateNumber', // 法人番号（13桁）
  'bankAccount', // 銀行口座番号形式
  'contains', // 特定の文字列を含む
  'notContains', // 特定の文字列を含まない
  'startsWith', // 特定の文字列で始まる
  'endsWith', // 特定の文字列で終わる
  'custom', // カスタムバリデーション（将来の拡張用）
]);
export type ValidationType = z.infer<typeof ValidationTypeSchema>;

/**
 * バリデーションの対象画面
 */
export const TargetEventSchema = z.enum(['create', 'edit']);
export type TargetEvent = z.infer<typeof TargetEventSchema>;

/**
 * バリデーションルールの定義
 */
export const ValidationRuleV1Schema = z.object({
  /** ルールID（一意識別子） */
  id: z.string(),
  /** バリデーションタイプ */
  type: ValidationTypeSchema,
  /** バリデーションパラメータ（文字数、正規表現パターンなど） */
  value: z.string(),
  /** エラーメッセージ */
  errorMessage: z.string(),
});
export type ValidationRule = z.infer<typeof ValidationRuleV1Schema>;

/**
 * FieldConditionValue の Zod スキーマ。
 * 外部ライブラリ (@konomi-app/kintone-utilities-react) の型と対応する。
 * loose により conditionType ごとの追加フィールドを保持する。
 */
export const FieldConditionValueSchema = z
  .object({
    fieldCode: z.string(),
    conditionType: z.string(),
  })
  .loose();

/**
 * プラグイン設定の各条件（1つのフィールドに対する設定）V1
 */
export const PluginConditionV1Schema = z.object({
  /**
   * プラグイン設定を一意に識別するためのID
   * 設定の並び替えに使用されます
   */
  id: z.string(),
  /** 対象フィールドコード */
  fieldCode: z.string(),
  /** バリデーションを適用する画面 */
  targetEvents: z.array(TargetEventSchema),
  /** フィールド変更直後にエラーを表示するか */
  showErrorOnChange: z.boolean(),
  /** バリデーションルールの配列 */
  rules: z.array(ValidationRuleV1Schema),
});

/**
 * プラグイン設定の各条件（1つのフィールドに対する設定）V2
 *
 * V1 に適用条件（applyConditions）を追加したもの。
 */
export const PluginConditionV2Schema = PluginConditionV1Schema.extend({
  /**
   * バリデーションの適用条件（フィールド条件）。
   * 指定された場合、すべての条件を満たすレコードのみバリデーションを適用する。
   * 空配列の場合は常に適用する。
   */
  applyConditions: z.array(FieldConditionValueSchema),
});

/**
 * プラグインの共通設定（全条件に適用される設定）
 */
export const PluginCommonConfigV1Schema = z.object({
  /** CSVインポート機能の設定 */
  csvImport: z.object({
    /** CSVインポート機能を有効にするか */
    enabled: z.boolean(),
    /** 一覧画面に表示するインポートボタンのラベル */
    buttonLabel: z.string(),
  }),
});

/**
 * プラグイン設定V1
 */
export const PluginConfigV1Schema = z.object({
  version: z.literal(1),
  common: PluginCommonConfigV1Schema,
  conditions: z.array(PluginConditionV1Schema),
});

/**
 * プラグイン設定V2
 *
 * 共通設定は V1 から変更なし。各条件に適用条件（applyConditions）を追加。
 */
export const PluginConfigV2Schema = z.object({
  version: z.literal(2),
  common: PluginCommonConfigV1Schema,
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

/** 🔌 過去全てのバージョンを含むプラグインの設定情報 */
export type AnyPluginConfig = z.infer<typeof AnyPluginConfigSchema>;

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
  'katakana', // カタカナのみ
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
 * プラグイン設定の各条件（1つのフィールドに対する設定）
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
 * プラグイン設定V1
 */
export const PluginConfigV1Schema = z.object({
  version: z.literal(1),
  conditions: z.array(PluginConditionV1Schema),
});
type PluginConfigV1 = z.infer<typeof PluginConfigV1Schema>;

/** 🔌 過去全てのバージョンを含むプラグインの設定情報 */
export const AnyPluginConfigSchema = z.discriminatedUnion('version', [PluginConfigV1Schema]);

export const LatestPluginConditionSchema = PluginConditionV1Schema;

/** 🔌 プラグインがアプリ単位で保存する設定情報 */
export type PluginConfig = PluginConfigV1;

/** 🔌 プラグインの詳細設定 */
export type PluginCondition = PluginConfig['conditions'][number];

/** 🔌 過去全てのバージョンを含むプラグインの設定情報 */
export type AnyPluginConfig = z.infer<typeof AnyPluginConfigSchema>;

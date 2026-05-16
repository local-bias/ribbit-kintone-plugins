import { z } from 'zod';

/**
 * 対応する AI プロバイダーの種別
 * - openai: OpenAI 公式 API
 * - azure: Azure OpenAI Service
 * - gemini: Google Gemini (OpenAI 互換エンドポイント)
 * - custom: 任意の OpenAI 互換 API
 */
export const AI_PROVIDER_TYPES = ['openai', 'azure', 'gemini', 'custom'] as const;
export const AiProviderTypeSchema = z.enum(AI_PROVIDER_TYPES);
export type AiProviderType = z.infer<typeof AiProviderTypeSchema>;

/** 入力予測の自動補完ルール */
export const AutocompleteRuleV1Schema = z.object({
  id: z.string(),
  /** 値が入力されたら提案を生成するソースフィールド (例: 氏名) */
  sourceFieldCode: z.string(),
  /** 提案を流し込む対象フィールド (例: フリガナ) */
  targetFieldCode: z.string(),
  /** AI への指示 */
  instruction: z.string(),
});

/** トリガー種別 - プロンプトテンプレートが起動する契機 */
export const ConditionTriggerSchema = z.enum(['manual', 'fileDrop', 'autocomplete']);
export type ConditionTrigger = z.infer<typeof ConditionTriggerSchema>;

export const PluginConditionV1Schema = z.object({
  /**
   * プラグイン設定を一意に識別するためのID
   * 設定の並び替えに使用されます
   */
  id: z.string(),
  /** プロンプトテンプレートの表示名 */
  name: z.string(),
  /** プロンプトテンプレートの補足説明 */
  description: z.string(),
  /** このテンプレート固有の system prompt (空なら共通設定の値を使用) */
  systemPrompt: z.string(),
  /** 起動トリガー */
  trigger: ConditionTriggerSchema,
  /** 入力予測ルール (trigger=autocomplete のときに使用) */
  autocompleteRules: z.array(AutocompleteRuleV1Schema),
  /** ファイル添付トリガー時に値を流し込む対象フィールド */
  targetFieldCodes: z.array(z.string()),
});

export const PluginConfigV1Schema = z.object({
  version: z.literal(1),
  common: z.object({
    /** AI プロバイダー種別 */
    providerType: AiProviderTypeSchema,
    /** API キー */
    apiKey: z.string(),
    /** 任意の Base URL (空ならプロバイダー既定) */
    baseUrl: z.string(),
    /** 既定のモデル名 */
    model: z.string(),
    /** 既定の system prompt */
    systemPrompt: z.string(),
    /** 既定の temperature */
    temperature: z.number(),
    /** 既定の max_tokens */
    maxTokens: z.number(),
    /** チャット機能を有効化するか */
    chatEnabled: z.boolean(),
    /** ファイル添付機能を有効化するか */
    fileAttachmentEnabled: z.boolean(),
    /** ファイルドロップ時に自動でフィールド補完を開始するか */
    autoFillOnFileDrop: z.boolean(),
    /** 入力予測機能を有効化するか */
    autocompleteEnabled: z.boolean(),
    /** レコード一覧画面で AI バトラーを表示するか */
    displayOnIndex: z.boolean(),
    /** レコード詳細画面で AI バトラーを表示するか */
    displayOnDetail: z.boolean(),
    /** レコード作成画面で AI バトラーを表示するか */
    displayOnCreate: z.boolean(),
    /** レコード編集画面で AI バトラーを表示するか */
    displayOnEdit: z.boolean(),
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

/** 🔌 入力予測ルール */
export type AutocompleteRule = z.infer<typeof AutocompleteRuleV1Schema>;

/** 🔌 過去全てのバージョンを含むプラグインの設定情報 */
export type AnyPluginConfig = z.infer<typeof AnyPluginConfigSchema>;

import { z } from 'zod';
import { ReasoningEffortTypeSchema, VerbosityTypeSchema } from './ai';

const AI_PROVIDER_TYPE_V1 = ['openai', 'openrouter'] as const;
const AiProviderTypeV1Schema = z.enum(AI_PROVIDER_TYPE_V1);

export const AI_PROVIDER_TYPE = AI_PROVIDER_TYPE_V1;
export const AiProviderTypeSchema = AiProviderTypeV1Schema;
export type AiProviderType = z.infer<typeof AiProviderTypeSchema>;

export const PluginConfigV1Schema = z.object({
  version: z.literal(1),
  aiModel: z.string().optional(),
  viewId: z.string(),
  outputAppId: z.string(),
  outputAppSpaceId: z.string().optional(),
  outputKeyFieldCode: z.string(),
  outputContentFieldCode: z.string(),
  logAppId: z.string().optional(),
  logAppSpaceId: z.string().optional(),
  logKeyFieldCode: z.string().optional(),
  logContentFieldCode: z.string().optional(),
  enablesAnimation: z.boolean().optional(),
  aiIcon: z.string().optional(),
  systemPrompt: z.string().optional(),
});
export const PluginConfigV2Schema = z.object({
  version: z.literal(2),
  viewId: z.string(),
  outputAppId: z.string(),
  outputAppSpaceId: z.string().optional(),
  outputKeyFieldCode: z.string(),
  outputContentFieldCode: z.string(),
  logAppId: z.string().optional(),
  logAppSpaceId: z.string().optional(),
  logKeyFieldCode: z.string().optional(),
  logContentFieldCode: z.string().optional(),
  enablesAnimation: z.boolean().optional(),
  assistants: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      aiModel: z.string(),
      aiIcon: z.string(),
      temperature: z.number(),
      systemPrompt: z.string(),
      maxTokens: z.number(),
    })
  ),
});

export const PluginConfigV3Schema = z.object({
  version: z.literal(3),
  viewId: z.string(),
  outputAppId: z.string(),
  outputAppSpaceId: z.string().optional(),
  outputKeyFieldCode: z.string(),
  outputContentFieldCode: z.string(),
  logAppId: z.string().optional(),
  logAppSpaceId: z.string().optional(),
  logKeyFieldCode: z.string().optional(),
  logContentFieldCode: z.string().optional(),
  enablesAnimation: z.boolean(),
  enablesShiftEnter: z.boolean(),
  enablesEnter: z.boolean(),
  assistants: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      aiModel: z.string(),
      aiIcon: z.string(),
      temperature: z.number(),
      systemPrompt: z.string(),
      maxTokens: z.number(),
    })
  ),
});

export const PluginConfigV4Schema = z.object({
  version: z.literal(4),
  viewId: z.string(),
  outputAppId: z.string(),
  outputAppSpaceId: z.string().optional(),
  outputKeyFieldCode: z.string(),
  outputContentFieldCode: z.string(),
  logAppId: z.string().optional(),
  logAppSpaceId: z.string().optional(),
  logKeyFieldCode: z.string().optional(),
  logContentFieldCode: z.string().optional(),
  enablesAnimation: z.boolean(),
  enablesShiftEnter: z.boolean(),
  enablesEnter: z.boolean(),
  assistants: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      aiModel: z.string(),
      aiIcon: z.string(),
      temperature: z.number(),
      systemPrompt: z.string(),
      maxTokens: z.number(),
      examples: z.array(z.string()),
    })
  ),
});

export const PluginConfigV5Schema = z.object({
  version: z.literal(5),
  common: z.object({
    viewId: z.string(),
    outputAppId: z.string(),
    outputAppSpaceId: z.string().optional(),
    outputKeyFieldCode: z.string(),
    outputContentFieldCode: z.string(),
    logAppId: z.string().optional(),
    logAppSpaceId: z.string().optional(),
    logKeyFieldCode: z.string().optional(),
    logContentFieldCode: z.string().optional(),
    enablesAnimation: z.boolean(),
    enablesShiftEnter: z.boolean(),
    enablesEnter: z.boolean(),
  }),
  conditions: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      aiModel: z.string(),
      aiIcon: z.string(),
      temperature: z.number(),
      systemPrompt: z.string(),
      maxTokens: z.number(),
      examples: z.array(z.string()),
    })
  ),
});

export const PluginConditionV6Schema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  aiModel: z.string(),
  aiIcon: z.string(),
  temperature: z.number(),
  systemPrompt: z.string(),
  maxTokens: z.number(),
  examples: z.array(z.string()),
  allowImageUpload: z.boolean(),
});
export const PluginConfigV6Schema = z.object({
  version: z.literal(6),
  common: z.object({
    viewId: z.string(),
    outputAppId: z.string(),
    outputAppSpaceId: z.string().optional(),
    outputKeyFieldCode: z.string(),
    outputContentFieldCode: z.string(),
    logAppId: z.string().optional(),
    logAppSpaceId: z.string().optional(),
    logKeyFieldCode: z.string().optional(),
    logContentFieldCode: z.string().optional(),
    enablesAnimation: z.boolean(),
    enablesShiftEnter: z.boolean(),
    enablesEnter: z.boolean(),
  }),
  conditions: z.array(PluginConditionV6Schema),
});

export const PluginConditionV7Schema = z.object({
  /**
   * プラグイン設定を一意に識別するためのID
   * 設定の並び替えに使用されます
   */
  id: z.string(),
  name: z.string(),
  description: z.string(),
  aiModel: z.string(),
  aiIcon: z.string(),
  temperature: z.number(),
  systemPrompt: z.string(),
  maxTokens: z.number(),
  examples: z.array(z.string()),
  allowImageUpload: z.boolean(),
});
export const PluginConfigV7Schema = z.object({
  version: z.literal(7),
  common: z.object({
    providerType: AiProviderTypeV1Schema,
    viewId: z.string(),
    outputAppId: z.string(),
    outputAppSpaceId: z.string().optional(),
    outputKeyFieldCode: z.string(),
    outputContentFieldCode: z.string(),
    logAppId: z.string().optional(),
    logAppSpaceId: z.string().optional(),
    logKeyFieldCode: z.string().optional(),
    logContentFieldCode: z.string().optional(),
    enablesAnimation: z.boolean(),
    enablesShiftEnter: z.boolean(),
    enablesEnter: z.boolean(),
  }),
  conditions: z.array(PluginConditionV7Schema),
});

export const PluginConditionV8Schema = z.object({
  /**
   * プラグイン設定を一意に識別するためのID
   * 設定の並び替えに使用されます
   */
  id: z.string(),
  name: z.string(),
  description: z.string(),
  aiModel: z.string(),
  aiIcon: z.string(),
  temperature: z.number(),
  systemPrompt: z.string(),
  maxTokens: z.number(),
  examples: z.array(z.string()),
  allowImageUpload: z.boolean(),
  /**
   * どれだけ推論を行うか
   */
  reasoningEffort: ReasoningEffortTypeSchema,
  /**
   * どれだけ詳しく回答するか
   */
  verbosity: VerbosityTypeSchema,
  /**
   * ウェブ検索の利用を許可するかどうか
   */ allowWebSearch: z.boolean(),
  /**
   * OpenAI Prompt API用のプロンプトID (任意)
   */
  promptId: z.string().default(''),
});
export const PluginConfigV8Schema = z.object({
  version: z.literal(8),
  common: z.object({
    providerType: AiProviderTypeV1Schema,
    viewId: z.string(),
    outputAppId: z.string(),
    outputAppSpaceId: z.string().optional(),
    outputKeyFieldCode: z.string(),
    outputContentFieldCode: z.string(),
    logAppId: z.string().optional(),
    logAppSpaceId: z.string().optional(),
    logKeyFieldCode: z.string().optional(),
    logContentFieldCode: z.string().optional(),
    enablesAnimation: z.boolean(),
    enablesShiftEnter: z.boolean(),
    enablesEnter: z.boolean(),
  }),
  conditions: z.array(PluginConditionV8Schema),
});

export const PluginConfigV9Schema = z.object({
  version: z.literal(9),
  common: z.object({
    providerType: AiProviderTypeV1Schema,
    viewId: z.string(),
    outputAppId: z.string(),
    outputAppSpaceId: z.string().optional(),
    outputKeyFieldCode: z.string(),
    outputContentFieldCode: z.string(),
    logAppId: z.string().optional(),
    logAppSpaceId: z.string().optional(),
    logKeyFieldCode: z.string().optional(),
    logContentFieldCode: z.string().optional(),
    // Log App バージョン選択
    logAppVersion: z.enum(['v1', 'v2']).default('v1'),
    // Log App V2設定
    logAppV2SessionIdFieldCode: z.string().optional(),
    logAppV2AssistantIdFieldCode: z.string().optional(),
    logAppV2RoleFieldCode: z.string().optional(),
    logAppV2ContentFieldCode: z.string().optional(),
    enablesAnimation: z.boolean(),
    enablesShiftEnter: z.boolean(),
    enablesEnter: z.boolean(),
  }),
  conditions: z.array(PluginConditionV8Schema),
});

export const PluginConditionV9Schema = z.object({
  /**
   * プラグイン設定を一意に識別するためのID
   * 設定の並び替えに使用されます
   */
  id: z.string(),
  name: z.string(),
  description: z.string(),
  aiModel: z.string(),
  aiIcon: z.string(),
  temperature: z.number(),
  systemPrompt: z.string(),
  maxTokens: z.number(),
  examples: z.array(z.string()),
  allowImageUpload: z.boolean(),
  /**
   * どれだけ推論を行うか
   */
  reasoningEffort: ReasoningEffortTypeSchema,
  /**
   * どれだけ詳しく回答するか
   */
  verbosity: VerbosityTypeSchema,
  /**
   * ウェブ検索の利用を許可するかどうか
   */
  allowWebSearch: z.boolean(),
  /**
   * OpenAI Prompt API用のプロンプトID (任意)
   */
  promptId: z.string().default(''),
  /**
   * AIによる画像生成を許可するかどうか
   */
  allowImageGeneration: z.boolean(),
});

export const PluginConfigV10Schema = z.object({
  version: z.literal(10),
  common: z.object({
    providerType: AiProviderTypeV1Schema,
    viewId: z.string(),
    outputAppId: z.string(),
    outputAppSpaceId: z.string().optional(),
    outputKeyFieldCode: z.string(),
    outputContentFieldCode: z.string(),
    logAppId: z.string().optional(),
    logAppSpaceId: z.string().optional(),
    logKeyFieldCode: z.string().optional(),
    logContentFieldCode: z.string().optional(),
    // Log App バージョン選択
    logAppVersion: z.enum(['v1', 'v2']).default('v1'),
    // Log App V2設定
    logAppV2SessionIdFieldCode: z.string().optional(),
    logAppV2AssistantIdFieldCode: z.string().optional(),
    logAppV2RoleFieldCode: z.string().optional(),
    logAppV2ContentFieldCode: z.string().optional(),
    enablesAnimation: z.boolean(),
    enablesShiftEnter: z.boolean(),
    enablesEnter: z.boolean(),
  }),
  conditions: z.array(PluginConditionV9Schema),
});

export const PluginConditionV11Schema = z.object({
  /**
   * プラグイン設定を一意に識別するためのID
   * 設定の並び替えに使用されます
   */
  id: z.string(),
  name: z.string(),
  description: z.string(),
  aiModel: z.string(),
  aiIcon: z.string(),
  temperature: z.number(),
  systemPrompt: z.string(),
  maxTokens: z.number(),
  examples: z.array(z.string()),
  allowImageUpload: z.boolean(),
  /**
   * どれだけ推論を行うか
   */
  reasoningEffort: ReasoningEffortTypeSchema,
  /**
   * どれだけ詳しく回答するか
   */
  verbosity: VerbosityTypeSchema,
  /**
   * ウェブ検索の利用を許可するかどうか
   */
  allowWebSearch: z.boolean(),
  /**
   * OpenAI Prompt API用のプロンプトID (任意)
   */
  promptId: z.string().default(''),
  /**
   * AIによる画像生成を許可するかどうか
   */
  allowImageGeneration: z.boolean(),
  /**
   * ファクトチェック機能を有効にするかどうか
   */
  enableFactCheck: z.boolean().default(false),
  /**
   * ファクトチェック結果をログに記録するかどうか
   */
  enableFactCheckLog: z.boolean().default(false),
});

export const PluginConfigV11Schema = z.object({
  version: z.literal(11),
  common: z.object({
    providerType: AiProviderTypeV1Schema,
    viewId: z.string(),
    outputAppId: z.string(),
    outputAppSpaceId: z.string().optional(),
    outputKeyFieldCode: z.string(),
    outputContentFieldCode: z.string(),
    logAppId: z.string().optional(),
    logAppSpaceId: z.string().optional(),
    logKeyFieldCode: z.string().optional(),
    logContentFieldCode: z.string().optional(),
    // Log App バージョン選択
    logAppVersion: z.enum(['v1', 'v2']).default('v1'),
    // Log App V2設定
    logAppV2SessionIdFieldCode: z.string().optional(),
    logAppV2AssistantIdFieldCode: z.string().optional(),
    logAppV2RoleFieldCode: z.string().optional(),
    logAppV2ContentFieldCode: z.string().optional(),
    enablesAnimation: z.boolean(),
    enablesShiftEnter: z.boolean(),
    enablesEnter: z.boolean(),
  }),
  conditions: z.array(PluginConditionV11Schema),
});

export const PluginConditionV12Schema = z.object({
  /**
   * プラグイン設定を一意に識別するためのID
   * 設定の並び替えに使用されます
   */
  id: z.string(),
  name: z.string(),
  description: z.string(),
  aiModel: z.string(),
  aiIcon: z.string(),
  temperature: z.number(),
  systemPrompt: z.string(),
  maxTokens: z.number(),
  examples: z.array(z.string()),
  allowImageUpload: z.boolean(),
  /**
   * どれだけ推論を行うか
   */
  reasoningEffort: ReasoningEffortTypeSchema,
  /**
   * どれだけ詳しく回答するか
   */
  verbosity: VerbosityTypeSchema,
  /**
   * ウェブ検索の利用を許可するかどうか
   */
  allowWebSearch: z.boolean(),
  /**
   * OpenAI Prompt API用のプロンプトID (任意)
   */
  promptId: z.string().default(''),
  /**
   * AIによる画像生成を許可するかどうか
   */
  allowImageGeneration: z.boolean(),
  /**
   * ファクトチェック機能を有効にするかどうか
   */
  enableFactCheck: z.boolean().default(false),
  /**
   * ファクトチェック結果をログに記録するかどうか
   */
  enableFactCheckLog: z.boolean().default(false),
  /**
   * AIによるHTML出力を許可するかどうか
   */
  allowHtmlOutput: z.boolean().default(false),
});

export const PluginConfigV12Schema = z.object({
  version: z.literal(12),
  common: z.object({
    providerType: AiProviderTypeV1Schema,
    viewId: z.string(),
    outputAppId: z.string(),
    outputAppSpaceId: z.string().optional(),
    outputKeyFieldCode: z.string(),
    outputContentFieldCode: z.string(),
    logAppId: z.string().optional(),
    logAppSpaceId: z.string().optional(),
    logKeyFieldCode: z.string().optional(),
    logContentFieldCode: z.string().optional(),
    // Log App バージョン選択
    logAppVersion: z.enum(['v1', 'v2']).default('v1'),
    // Log App V2設定
    logAppV2SessionIdFieldCode: z.string().optional(),
    logAppV2AssistantIdFieldCode: z.string().optional(),
    logAppV2RoleFieldCode: z.string().optional(),
    logAppV2ContentFieldCode: z.string().optional(),
    enablesAnimation: z.boolean(),
    enablesShiftEnter: z.boolean(),
    enablesEnter: z.boolean(),
  }),
  conditions: z.array(PluginConditionV12Schema),
});

export const PluginConditionV13Schema = z.object({
  /**
   * プラグイン設定を一意に識別するためのID
   * 設定の並び替えに使用されます
   */
  id: z.string(),
  name: z.string(),
  description: z.string(),
  aiModel: z.string(),
  aiIcon: z.string(),
  temperature: z.number(),
  systemPrompt: z.string(),
  maxTokens: z.number(),
  examples: z.array(z.string()),
  allowImageUpload: z.boolean(),
  /**
   * どれだけ推論を行うか
   */
  reasoningEffort: ReasoningEffortTypeSchema,
  /**
   * どれだけ詳しく回答するか
   */
  verbosity: VerbosityTypeSchema,
  /**
   * ウェブ検索の利用を許可するかどうか
   */
  allowWebSearch: z.boolean(),
  /**
   * OpenAI Prompt API用のプロンプトID (任意)
   */
  promptId: z.string().default(''),
  /**
   * AIによる画像生成を許可するかどうか
   */
  allowImageGeneration: z.boolean(),
  /**
   * ファクトチェック機能を有効にするかどうか
   */
  enableFactCheck: z.boolean().default(false),
  /**
   * ファクトチェック結果をログに記録するかどうか
   */
  enableFactCheckLog: z.boolean().default(false),
  /**
   * AIによるHTML出力を許可するかどうか
   */
  allowHtmlOutput: z.boolean().default(false),
  /**
   * クイックリプライを有効にするかどうか
   */
  allowQuickReplies: z.boolean().default(true),
});

export const PluginConditionV14Schema = z.object({
  /**
   * プラグイン設定を一意に識別するためのID
   * 設定の並び替えに使用されます
   */
  id: z.string(),
  name: z.string(),
  description: z.string(),
  aiModel: z.string(),
  aiIcon: z.string(),
  temperature: z.number(),
  systemPrompt: z.string(),
  maxTokens: z.number(),
  examples: z.array(z.string()),
  allowImageUpload: z.boolean(),
  /**
   * どれだけ推論を行うか
   */
  reasoningEffort: ReasoningEffortTypeSchema,
  /**
   * どれだけ詳しく回答するか
   */
  verbosity: VerbosityTypeSchema,
  /**
   * ウェブ検索の利用を許可するかどうか
   */
  allowWebSearch: z.boolean(),
  /**
   * ウェブ検索を初期状態で有効にするかどうか
   */
  defaultWebSearchEnabled: z.boolean().default(false),
  /**
   * OpenAI Prompt API用のプロンプトID (任意)
   */
  promptId: z.string().default(''),
  /**
   * AIによる画像生成を許可するかどうか
   */
  allowImageGeneration: z.boolean(),
  /**
   * ファクトチェック機能を有効にするかどうか
   */
  enableFactCheck: z.boolean().default(false),
  /**
   * ファクトチェック結果をログに記録するかどうか
   */
  enableFactCheckLog: z.boolean().default(false),
  /**
   * AIによるHTML出力を許可するかどうか
   */
  allowHtmlOutput: z.boolean().default(false),
  /**
   * クイックリプライを有効にするかどうか
   */
  allowQuickReplies: z.boolean().default(true),
});

export const PluginConfigV13Schema = z.object({
  version: z.literal(13),
  common: z.object({
    providerType: AiProviderTypeV1Schema,
    viewId: z.string(),
    outputAppId: z.string(),
    outputAppSpaceId: z.string().optional(),
    outputKeyFieldCode: z.string(),
    outputContentFieldCode: z.string(),
    logAppId: z.string().optional(),
    logAppSpaceId: z.string().optional(),
    logKeyFieldCode: z.string().optional(),
    logContentFieldCode: z.string().optional(),
    // Log App バージョン選択
    logAppVersion: z.enum(['v1', 'v2']).default('v1'),
    // Log App V2設定
    logAppV2SessionIdFieldCode: z.string().optional(),
    logAppV2AssistantIdFieldCode: z.string().optional(),
    logAppV2RoleFieldCode: z.string().optional(),
    logAppV2ContentFieldCode: z.string().optional(),
    enablesAnimation: z.boolean(),
    enablesShiftEnter: z.boolean(),
    enablesEnter: z.boolean(),
  }),
  conditions: z.array(PluginConditionV13Schema),
});

export const PluginConfigV14Schema = z.object({
  version: z.literal(14),
  common: z.object({
    providerType: AiProviderTypeV1Schema,
    viewId: z.string(),
    outputAppId: z.string(),
    outputAppSpaceId: z.string().optional(),
    outputKeyFieldCode: z.string(),
    outputContentFieldCode: z.string(),
    /** 添付ファイルを格納するファイルフィールド（対話ログ - ユーザー削除可能） */
    outputFileFieldCode: z.string().optional(),
    logAppId: z.string().optional(),
    logAppSpaceId: z.string().optional(),
    logKeyFieldCode: z.string().optional(),
    logContentFieldCode: z.string().optional(),
    /** 添付ファイルを格納するファイルフィールド（対話ログ - ユーザー削除不可） */
    logFileFieldCode: z.string().optional(),
    // Log App バージョン選択
    logAppVersion: z.enum(['v1', 'v2']).default('v2'),
    // Log App V2設定
    logAppV2SessionIdFieldCode: z.string().optional(),
    logAppV2AssistantIdFieldCode: z.string().optional(),
    logAppV2RoleFieldCode: z.string().optional(),
    logAppV2ContentFieldCode: z.string().optional(),
    enablesAnimation: z.boolean(),
    enablesShiftEnter: z.boolean(),
    enablesEnter: z.boolean(),
  }),
  conditions: z.array(PluginConditionV13Schema),
});

export const PluginConfigV15Schema = z.object({
  version: z.literal(15),
  common: z.object({
    providerType: AiProviderTypeV1Schema,
    viewId: z.string(),
    outputAppId: z.string(),
    outputAppSpaceId: z.string().optional(),
    outputKeyFieldCode: z.string(),
    outputContentFieldCode: z.string(),
    /** 添付ファイルを格納するファイルフィールド（対話ログ - ユーザー削除可能） */
    outputFileFieldCode: z.string().optional(),
    logAppId: z.string().optional(),
    logAppSpaceId: z.string().optional(),
    logKeyFieldCode: z.string().optional(),
    logContentFieldCode: z.string().optional(),
    /** 添付ファイルを格納するファイルフィールド（対話ログ - ユーザー削除不可） */
    logFileFieldCode: z.string().optional(),
    // Log App バージョン選択
    logAppVersion: z.enum(['v1', 'v2']).default('v2'),
    // Log App V2設定
    logAppV2SessionIdFieldCode: z.string().optional(),
    logAppV2AssistantIdFieldCode: z.string().optional(),
    logAppV2RoleFieldCode: z.string().optional(),
    logAppV2ContentFieldCode: z.string().optional(),
    enablesAnimation: z.boolean(),
    enablesShiftEnter: z.boolean(),
    enablesEnter: z.boolean(),
  }),
  conditions: z.array(PluginConditionV14Schema),
});

export const PluginConfigV16Schema = z.object({
  version: z.literal(16),
  common: z.object({
    providerType: AiProviderTypeV1Schema,
    viewId: z.string(),
    outputAppId: z.string(),
    outputAppSpaceId: z.string().optional(),
    outputKeyFieldCode: z.string(),
    outputContentFieldCode: z.string(),
    /** 添付ファイルを格納するファイルフィールド（対話ログ - ユーザー削除可能） */
    outputFileFieldCode: z.string().optional(),
    logAppId: z.string().optional(),
    logAppSpaceId: z.string().optional(),
    enablesAnimation: z.boolean(),
    enablesShiftEnter: z.boolean(),
    enablesEnter: z.boolean(),
    // 🔥 ログv1のサポートを終了し、v2に統一する
    logAppSessionIdFieldCode: z.string().optional(),
    logAppAssistantIdFieldCode: z.string().optional(),
    logAppRoleFieldCode: z.string().optional(),
    logAppContentFieldCode: z.string().optional(),
    logAppFileFieldCode: z.string().optional(),
    // logAppVersion: z.enum(['v1', 'v2']).default('v2'),
    // logKeyFieldCode: z.string().optional(),
    // logContentFieldCode: z.string().optional(),
    // logFileFieldCode: z.string().optional(),
    // logAppV2SessionIdFieldCode: z.string().optional(),
    // logAppV2AssistantIdFieldCode: z.string().optional(),
    // logAppV2RoleFieldCode: z.string().optional(),
    // logAppV2ContentFieldCode: z.string().optional(),
  }),
  conditions: z.array(PluginConditionV14Schema),
});

export const AnyPluginConfigSchema = z.discriminatedUnion('version', [
  PluginConfigV1Schema,
  PluginConfigV2Schema,
  PluginConfigV3Schema,
  PluginConfigV4Schema,
  PluginConfigV5Schema,
  PluginConfigV6Schema,
  PluginConfigV7Schema,
  PluginConfigV8Schema,
  PluginConfigV9Schema,
  PluginConfigV10Schema,
  PluginConfigV11Schema,
  PluginConfigV12Schema,
  PluginConfigV13Schema,
  PluginConfigV14Schema,
  PluginConfigV15Schema,
  PluginConfigV16Schema,
]);

/** 🔌 プラグインがアプリ単位で保存する設定情報 */
export type PluginConfig = z.infer<typeof PluginConfigV16Schema>;

export const LatestPluginConditionSchema = PluginConditionV14Schema;

/** 🔌 プラグインの共通設定 */
export type PluginCommonConfig = PluginConfig['common'];

/** 🔌 プラグインの詳細設定 */
export type PluginCondition = PluginConfig['conditions'][number];

/** 🔌 過去全てのバージョンを含むプラグインの設定情報 */
export type AnyPluginConfig = z.infer<typeof AnyPluginConfigSchema>;

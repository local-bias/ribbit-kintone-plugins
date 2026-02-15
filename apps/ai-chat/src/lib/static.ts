import { ReasoningEffortType, VerbosityType } from '@/schema/ai';
import { FactCheckResult } from '@/schema/fact-check';
import { ChatModel } from 'openai/resources';
import config from '@/../plugin.config.mjs';

/**
 * OpenRouterのAPIエンドポイント
 *
 * kintone.plugin.app.setProxyConfig()で設定する
 */
export const OPENROUTER_ENDPOINT_ROOT = 'https://openrouter.ai';
/**
 * OpenRouterのAPIベースURL
 *
 * OpenAI SDKのベースURLを変更して使用する
 */
export const OPENROUTER_BASE_URL = `${OPENROUTER_ENDPOINT_ROOT}/api/v1`;
export const OPENROUTER_CHAT_COMPLETION_ENDPOINT = `${OPENROUTER_BASE_URL}/chat/completions`;
export const OPENROUTER_ENDPOINT_MODELS = `${OPENROUTER_BASE_URL}/models`;

/**
 * OpenAIのAPIエンドポイント
 *
 * kintone.plugin.app.setProxyConfig()で設定する
 */
export const OPENAI_ENDPOINT_ROOT = 'https://api.openai.com';
/**
 * OpenAIのAPIベースURL
 *
 * OpenAI SDKのベースURLを変更して使用する
 */
export const OPENAI_BASE_URL = `${OPENAI_ENDPOINT_ROOT}/v1`;
export const OPENAI_ENDPOINT = `${OPENAI_BASE_URL}/responses`;

export const PLUGIN_NAME = config.manifest.base.name.ja;

export const VIEW_ROOT_ID = `ribbit-chatgpt-plugin-root`;

export const URL_INQUIRY = 'https://form.konomi.app';
export const URL_PROMOTION = 'https://promotion.konomi.app/kintone-plugin';
export const URL_BANNER = 'https://promotion.konomi.app/kintone-plugin/sidebar';

export const OPENAI_MODELS = [
  'gpt-4.1',
  'gpt-4.1-mini',
  'gpt-4.1-nano',
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4',
  'o4-mini',
  'o3-mini',
] satisfies ChatModel[];

export const O1_SERIES_MODELS = ['o1', 'o1-preview', 'o3-mini', 'o4-mini'] satisfies ChatModel[];

export const URL_QUERY_CHAT_ID = 'chat_id';

export type ChatImageContentPart = {
  type: 'image_url';
  image_url: {
    url: string;
  };
};

export type ChatTextContentPart = {
  type: 'text';
  text: string;
};

/**
 * AI生成画像のコンテンツパート
 * OpenAI gpt-image-1 や DALL-E モデルで生成された画像を表現
 */
export type ChatGeneratedImageContentPart = {
  type: 'generated_image';
  image_url: string;
  /** 画像生成に使用されたプロンプト（改訂版） */
  revised_prompt?: string;
};

export type ChatMessageContentPart =
  | ChatTextContentPart
  | ChatImageContentPart
  | ChatGeneratedImageContentPart;

export type ChatMessageContent = string | ChatMessageContentPart[];

/**
 * ファクトチェックメッセージ
 * role: 'fact-check' のメッセージ専用型
 */
export type FactCheckMessage = {
  id: string;
  role: 'fact-check';
  /** ファクトチェック対象のassistantメッセージID */
  targetMessageId: string;
  /** ファクトチェック結果 */
  content: FactCheckResult;
};

/**
 * 通常のチャットメッセージ
 */
export type RegularChatMessage = {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: ChatMessageContent;
};

export type ChatMessage = RegularChatMessage | FactCheckMessage;

export type AnyChatHistory =
  | ChatHistoryV1
  | ChatHistoryV2
  | ChatHistoryV3
  | ChatHistoryV4
  | ChatHistoryV5
  | ChatHistoryV6
  | ChatHistoryV7
  | ChatHistoryV8
  | ChatHistoryV9;

type ChatHistoryV9 = Omit<ChatHistoryV8, 'version'> & {
  version: 9;
  /** AI が生成した HTML (Structured Output で取得) */
  html?: string;
};

type ChatHistoryV8 = Omit<ChatHistoryV7, 'version' | 'messages'> & {
  version: 8;
  messages: ChatMessage[];
};

type ChatHistoryV7 = Omit<
  ChatHistoryV6,
  'version' | 'aiModel' | 'temperature' | 'maxTokens' | 'iconUrl' | 'verbosity' | 'reasoningEffort'
> & {
  version: 7;
  assistantId: string;
};

export type ChatHistory = ChatHistoryV9;

export type ChatMessageRole = ChatHistory['messages'][number]['role'];

type ChatHistoryV6 = Omit<ChatHistoryV5, 'version'> & {
  version: 6;
  verbosity: VerbosityType;
  reasoningEffort: ReasoningEffortType;
};

type ChatHistoryV5 = Omit<ChatHistoryV4, 'version' | 'messages'> & {
  version: 5;
  messages: (ChatHistoryV4['messages'][number] & { id: string })[];
};

type ChatHistoryV4 = Omit<ChatHistoryV3, 'version' | 'messages'> & {
  version: 4;
  messages: (Omit<RegularChatMessage, 'id'> & { id?: string })[];
};

type ChatHistoryV3 = Omit<ChatHistoryV2, 'version'> & {
  version: 3;
  aiModel: string;
  temperature: number;
  maxTokens: number;
};

type ChatHistoryV1 = {
  version: 1;
  id: string;
  title: string;
  messages: {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }[];
};

type ChatHistoryV2 = Omit<ChatHistoryV1, 'version'> & {
  version: 2;
  iconUrl: string;
};

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
  'gpt-5.2',
  'gpt-5.2-chat-latest',
  'gpt-5-nano',
  'o4-mini',
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

export type FileAttachment = {
  type: 'file';
  fileKey: string;
  mimeType: string;
  fileName: string;
};

export type FileBase64Attachment = {
  type: 'file-base64';
  dataUrl: string;
  mimeType: string;
  fileName: string;
};

export type FactCheckAttachment = {
  type: 'fact-check';
  result: FactCheckResult;
};

export type MessageAttachment = FileAttachment | FileBase64Attachment | FactCheckAttachment;

export type ChatMessage = ChatMessageV2;

export type ChatMessageV2 = {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  attachments?: MessageAttachment[];
};

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
type RegularChatMessage = {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: ChatMessageContent;
};

type ChatMessageV1 = RegularChatMessage | FactCheckMessage;

export type AnyChatHistory =
  | ChatHistoryV1
  | ChatHistoryV2
  | ChatHistoryV3
  | ChatHistoryV4
  | ChatHistoryV5
  | ChatHistoryV6
  | ChatHistoryV7
  | ChatHistoryV8
  | ChatHistoryV9
  | ChatHistoryV10;

export type ChatHistory = ChatHistoryV10;

export type ChatMessageRole = ChatHistory['messages'][number]['role'];

export type ChatHistoryV10 = {
  version: 10;
  id: string;
  assistantId: string;
  title: string;
  messages: ChatMessageV2[];
  /** AI が生成した HTML (Structured Output で取得) */
  html?: string;
};

type ChatHistoryV9 = {
  version: 9;
  id: string;
  assistantId: string;
  title: string;
  messages: ChatMessageV1[];
  /** AI が生成した HTML (Structured Output で取得) */
  html?: string;
};

interface ChatHistoryV8 {
  version: 8;
  id: string;
  assistantId: string;
  title: string;
  messages: ChatMessageV1[];
}

interface ChatHistoryV7 {
  version: 7;
  id: string;
  assistantId: string;
  title: string;
  messages: RegularChatMessage[];
}

interface ChatHistoryV6 {
  version: 6;
  id: string;
  title: string;
  iconUrl: string;
  aiModel: string;
  temperature: number;
  maxTokens: number;
  messages: RegularChatMessage[];
  verbosity: VerbosityType;
  reasoningEffort: ReasoningEffortType;
}

interface ChatHistoryV5 {
  version: 5;
  id: string;
  title: string;
  iconUrl: string;
  aiModel: string;
  temperature: number;
  maxTokens: number;
  messages: RegularChatMessage[];
}

interface ChatHistoryV4 {
  version: 4;
  id: string;
  title: string;
  iconUrl: string;
  aiModel: string;
  temperature: number;
  maxTokens: number;
  messages: (Omit<RegularChatMessage, 'id'> & { id?: string })[];
}

interface ChatHistoryV3 {
  version: 3;
  id: string;
  title: string;
  messages: {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }[];
  iconUrl: string;
  aiModel: string;
  temperature: number;
  maxTokens: number;
}

interface ChatHistoryV2 {
  version: 2;
  id: string;
  title: string;
  messages: {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }[];
  iconUrl: string;
}

interface ChatHistoryV1 {
  version: 1;
  id: string;
  title: string;
  messages: {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }[];
}

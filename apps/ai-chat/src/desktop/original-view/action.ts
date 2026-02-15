import { createEndpointAdapter } from '@/lib/adapters';
import { ketch } from '@/lib/browser';
import type { ChatCompletionRequest, StructuredAIResponse } from '@/lib/endpoint-adapter';
import { isDev, isProd } from '@/lib/global';
import { AnyChatHistory, ChatHistory, ChatMessage, OPENAI_MODELS } from '@/lib/static';
import { ReasoningEffortType, VerbosityType } from '@/schema/ai';
import { AiProviderType } from '@/schema/plugin-config';
import { marked } from 'marked';
import { nanoid } from 'nanoid';
import { z } from 'zod';

export const migrateChatHistory = (chatHistory: AnyChatHistory): ChatHistory => {
  switch (chatHistory.version) {
    case undefined:
    case 1:
      return migrateChatHistory({ ...chatHistory, version: 2, iconUrl: '' });
    case 2:
      return migrateChatHistory({
        ...chatHistory,
        version: 3,
        aiModel: OPENAI_MODELS[0],
        temperature: 0.7,
        maxTokens: 0,
      });
    case 3:
      return migrateChatHistory({ ...chatHistory, version: 4 });
    case 4:
      return migrateChatHistory({
        ...chatHistory,
        version: 5,
        messages: chatHistory.messages.map((m) => ({ ...m, id: nanoid() })),
      });
    case 5:
      return migrateChatHistory({
        ...chatHistory,
        version: 6,
        verbosity: 'medium',
        reasoningEffort: 'low',
      });
    case 6:
      const { aiModel, temperature, maxTokens, iconUrl, verbosity, reasoningEffort, ...rest } =
        chatHistory;
      return migrateChatHistory({
        ...rest,
        version: 7,
        assistantId: '',
      });
    case 7:
      return migrateChatHistory({
        ...chatHistory,
        version: 8,
      });
    case 8:
      return migrateChatHistory({
        ...chatHistory,
        version: 9,
        html: undefined,
      });
    case 9:
    default:
      return chatHistory;
  }
};

export const createNewChatHistory = (params: Omit<ChatHistory, 'version'>): ChatHistory => {
  return { version: 9, ...params };
};

/**
 * AIリクエストパラメータの型定義
 */
export type AICompletionParams = {
  model: string;
  temperature: number;
  maxTokens: number;
  messages: ChatMessage[];
  systemPrompt?: string;
  providerType?: AiProviderType;
  verbosity?: VerbosityType;
  reasoningEffort?: ReasoningEffortType;
  webSearchEnabled?: boolean;
  promptId?: string;
  imageGenerationEnabled?: boolean;
  htmlOutputEnabled?: boolean;
  currentHtml?: string;
};

/**
 * AI APIを呼び出し、Structured Outputをパースして返す
 * @template T Zodスキーマから推論される型
 * @param params リクエストパラメータ
 * @param schema Zodスキーマ（レスポンスの型定義）
 * @returns 正規化されたAIレスポンス
 */
export async function fetchAICompletion<T>(
  params: AICompletionParams,
  schema: z.ZodType<T>
): Promise<StructuredAIResponse<T>> {
  const {
    model,
    temperature,
    maxTokens,
    messages,
    systemPrompt,
    providerType = 'openai',
    verbosity = 'medium',
    reasoningEffort = 'low',
    webSearchEnabled = false,
    promptId,
    imageGenerationEnabled = false,
    htmlOutputEnabled = false,
    currentHtml,
  } = params;

  const logTitle = `🧠 AI API call`;
  isDev && console.time(logTitle);

  // アダプタの生成
  const adapter = createEndpointAdapter(providerType);

  // リクエストパラメータの構築
  const request: ChatCompletionRequest = {
    model,
    temperature,
    maxTokens,
    messages,
    systemPrompt,
    verbosity,
    reasoningEffort,
    webSearchEnabled,
    promptId,
    imageGenerationEnabled,
    htmlOutputEnabled,
    currentHtml,
    schema,
  };

  // リクエストペイロードの構築（アダプタに委譲）
  const payload = adapter.buildRequestPayload(request);

  isDev &&
    console.log(`${logTitle} - API Request`, {
      endpoint: adapter.endpoint,
      providerType,
      payload,
    });

  // API呼び出し
  const response = await ketch(adapter.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  !isProd && console.timeEnd(logTitle);

  const apiResponse = await response.json();

  !isProd &&
    console.log(`${logTitle} - API Response`, {
      responseBody: apiResponse,
      responseCode: response.status,
      responseHeader: response.headers,
    });

  // レスポンスのパース（アダプタに委譲）
  const result = await adapter.parseResponse(response, apiResponse, schema);

  isDev && console.log(`このやり取りで${result.usage?.totalTokens ?? '不明'}トークン消費しました`);

  return result;
}

export const getHTMLfromMarkdown = (markdown: string): string => {
  return marked(markdown, { async: false }) as string;
};

export const getChatTitle = (message: ChatMessage): string => {
  // ファクトチェックメッセージは対象外
  if (message.role === 'fact-check') {
    return 'ファクトチェック';
  }
  const { content } = message;
  if (!content) {
    return '空のメッセージ';
  }
  if (typeof content === 'string') {
    return content.slice(0, 16);
  }
  const found = content.find((m) => m.type === 'text') as any | undefined;
  return (found?.text ?? '空のメッセージ').slice(0, 16);
};

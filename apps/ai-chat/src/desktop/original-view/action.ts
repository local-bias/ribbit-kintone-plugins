import { createEndpointAdapter } from '@/lib/adapters';
import { ketch } from '@/lib/browser';
import type { ChatCompletionRequest, StructuredAIResponse } from '@/lib/endpoint-adapter';
import { uploadMessageBase64Attachments } from '@/lib/file-utils';
import { isDev, isProd } from '@/lib/global';
import {
  AnyChatHistory,
  ChatHistory,
  ChatImageContentPart,
  ChatGeneratedImageContentPart,
  ChatMessage,
  ChatMessageV2,
  MessageAttachment,
  OPENAI_MODELS,
} from '@/lib/static';
import { ReasoningEffortType, VerbosityType } from '@/schema/ai';
import { AiProviderType } from '@/schema/plugin-config';
import { addRecord, uploadFile } from '@konomi-app/kintone-utilities';
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
    case 9: {
      const newMessages: ChatMessageV2[] = [];
      for (let i = 0; i < chatHistory.messages.length; i++) {
        const message = chatHistory.messages[i];
        const nextMessage = chatHistory.messages[i + 1] ?? null;

        if (message.role === 'fact-check') {
          continue;
        }

        if (message.role === 'user') {
          let text = '';
          const attachments: ChatMessageV2['attachments'] = [];
          if (typeof message.content === 'string') {
            text = message.content;
          } else {
            message.content.forEach((p) => {
              if (p.type === 'image_url') {
                const img = p as ChatImageContentPart;
                const dataUrl = img.image_url.url;
                const mimeType = dataUrl.match(/^data:(.*?);/)?.[1] ?? 'image/png';
                attachments.push({
                  type: 'file-base64',
                  dataUrl,
                  mimeType,
                  fileName: `image.${mimeType.split('/')[1] ?? 'png'}`,
                });
              }
              if (p.type === 'text') {
                text += p.text;
              }
            });
          }
          newMessages.push({
            id: message.id,
            role: message.role,
            content: text,
            attachments,
          });
        } else if (message.role === 'assistant') {
          const factCheck = nextMessage?.role === 'fact-check' ? nextMessage : null;

          let text = '';
          const attachments: ChatMessageV2['attachments'] = [];
          if (typeof message.content === 'string') {
            text = message.content;
          } else {
            message.content.forEach((p) => {
              if (p.type === 'generated_image') {
                const img = p as ChatGeneratedImageContentPart;
                const dataUrl = img.image_url;
                const mimeType = dataUrl.match(/^data:(.*?);/)?.[1] ?? 'image/png';
                attachments.push({
                  type: 'file-base64',
                  dataUrl,
                  mimeType,
                  fileName: `generated.${mimeType.split('/')[1] ?? 'png'}`,
                });
              }
              if (p.type === 'text') {
                text += p.text;
              }
            });
          }
          if (factCheck) {
            attachments.push({
              type: 'fact-check',
              result: factCheck.content,
            });
          }
          newMessages.push({
            id: message.id,
            role: message.role,
            content: text,
            attachments,
          });
        }
      }

      return migrateChatHistory({
        ...chatHistory,
        version: 10,
        messages: newMessages,
      });
    }
    case 10:
    default:
      return chatHistory;
  }
};

export const createNewChatHistory = (params: Omit<ChatHistory, 'version'>): ChatHistory => {
  return { version: 10, ...params };
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
  const payload = await adapter.buildRequestPayload(request);

  isDev &&
    console.log(`${logTitle} - API Request`, {
      endpoint: adapter.endpoint,
      providerType,
      payload,
    });

  // API呼び出し
  const response = await ketch(adapter.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

/**
 * チャットの新規作成時、ユーザーのメッセージからタイトルを生成する
 * @param message チャットメッセージ
 * @returns チャットタイトル
 */
export function getChatTitle(message: ChatMessage): string {
  const { content } = message;
  if (!content) {
    return '空のメッセージ';
  }
  return content.slice(0, 16);
}

export async function addChatLog(params: {
  appId?: string;
  sessionId: string;
  assistantId: string;
  role: string;
  content: string;
  file?: File;
  attachments?: MessageAttachment[];
  sessionIdFieldCode?: string;
  assistantIdFieldCode?: string;
  roleFieldCode?: string;
  contentFieldCode?: string;
  guestSpaceId: string | null;
  fileFieldCode?: string;
}) {
  const {
    appId,
    sessionIdFieldCode,
    assistantIdFieldCode,
    roleFieldCode,
    contentFieldCode,
    guestSpaceId,
    fileFieldCode,
    file,
    attachments,
  } = params;

  if (!appId) {
    isDev && console.warn('Log app is not properly configured');
    return;
  }

  const record: Record<string, { value: unknown }> = {};

  if (fileFieldCode && attachments?.length) {
    const uploadedFileKeys = await uploadMessageBase64Attachments(attachments, guestSpaceId);
    if (uploadedFileKeys.length > 0) {
      record[fileFieldCode] = {
        value: uploadedFileKeys.map((fileKey) => ({ fileKey })),
      };
    }
  } else if (file && fileFieldCode) {
    // ファイルがある場合はKintoneにアップロードしてからレコードにセット
    const uploadedFile = await uploadFile({
      file: { name: file.name, data: file },
      guestSpaceId: guestSpaceId ?? undefined,
      debug: isDev,
    });
    record[fileFieldCode] = { value: [{ fileKey: uploadedFile.fileKey }] };
  }

  if (contentFieldCode) {
    record[contentFieldCode] = { value: params.content };
  }
  if (sessionIdFieldCode) {
    record[sessionIdFieldCode] = { value: params.sessionId };
  }
  if (assistantIdFieldCode) {
    record[assistantIdFieldCode] = { value: params.assistantId };
  }
  if (roleFieldCode) {
    record[roleFieldCode] = { value: params.role };
  }

  return addRecord({ app: appId, record, guestSpaceId: guestSpaceId ?? undefined, debug: isDev });
}

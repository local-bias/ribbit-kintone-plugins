import { ReasoningEffortType, VerbosityType } from '@/schema/ai';
import { z } from 'zod';
import { ChatMessage, ChatMessageContentPart, RegularChatMessage } from './static';

/**
 * AI生成画像
 */
export type GeneratedImage = {
  /** 画像URL (data URL または http URL) */
  url: string;
  /** 画像生成に使用されたプロンプト（改訂版） */
  revisedPrompt?: string;
};

/**
 * トークン使用量
 */
export type TokenUsage = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
};

/**
 * 全プロバイダ共通の正規化されたAIレスポンス
 * アダプタがAPIレスポンスをこの形式に変換する責任を持つ
 * @template T Zodスキーマから推論される型
 */
export type StructuredAIResponse<T> = {
  /** パース済みの構造化データ */
  data: T;
  /** AI生成画像（ある場合） */
  generatedImages?: GeneratedImage[];
  /** トークン使用量 */
  usage?: TokenUsage;
  /** 使用されたモデル */
  model?: string;
};

/**
 * 統一されたリクエストパラメータ
 */
export type ChatCompletionRequest = {
  model: string;
  temperature: number;
  maxTokens: number;
  messages: ChatMessage[];
  systemPrompt?: string;
  verbosity?: VerbosityType;
  reasoningEffort?: ReasoningEffortType;
  webSearchEnabled?: boolean;
  promptId?: string;
  /** 画像生成を許可するかどうか */
  imageGenerationEnabled?: boolean;
  /** HTML出力を有効にするかどうか (Structured Output を使用) */
  htmlOutputEnabled?: boolean;
  /** 現在のHTML (反復編集用) */
  currentHtml?: string;
  /** スキーマ */
  schema?: z.ZodType<unknown>;
};

/**
 * 統一されたレスポンス型
 */
export type ChatCompletionResponse = {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  model?: string;
};

/**
 * エンドポイント設定
 */
export type EndpointConfig = {
  endpoint: string;
  headers?: Record<string, string>;
};

/**
 * エンドポイントアダプタのインターフェース
 * 各エンドポイント(OpenAI, OpenRouter, Unlimited)の差異を吸収する
 */
export interface EndpointAdapter {
  /**
   * エンドポイントURL
   */
  readonly endpoint: string;

  /**
   * リクエストペイロードを構築する
   * @param request 統一されたリクエストパラメータ
   * @returns エンドポイント固有のペイロード
   */
  buildRequestPayload(request: ChatCompletionRequest): Record<string, unknown>;

  /**
   * レスポンスをパースする
   * @param response APIレスポンス
   * @param responseBody レスポンスボディ
   * @param schema Zodスキーマ（Structured Output用）
   * @returns 正規化されたAIレスポンス
   */
  parseResponse<T>(
    response: Response,
    responseBody: unknown,
    schema: z.ZodType<T>
  ): Promise<StructuredAIResponse<T>>;

  /**
   * エラーをハンドリングする
   * @param response エラーレスポンス
   * @param responseBody レスポンスボディ
   */
  handleError(response: Response, responseBody: unknown): never;
}

/**
 * メッセージコンテンツからIDを除去する
 */
export const stripMessageIds = (messages: ChatMessage[]): Omit<ChatMessage, 'id'>[] => {
  return messages.map(({ id, ...rest }) => rest);
};

/**
 * 画像が含まれているかチェックする
 */
export const hasImageContent = (messages: ChatMessage[]): boolean => {
  return messages.some(
    (m) => Array.isArray(m.content) && m.content.some((c) => c.type === 'image_url')
  );
};

/**
 * O1シリーズモデルかどうかを判定する
 */
export const isO1SeriesModel = (model: string): boolean => {
  return model.startsWith('o1') || model.startsWith('o3') || model.startsWith('o4');
};

/**
 * API送信用にメッセージをサニタイズする
 * - IDを除去
 * - generated_image パートをフィルタリング (API送信不可)
 * - ファクトチェックメッセージを除外
 */
export const sanitizeMessagesForApi = (
  messages: ChatMessage[]
): Omit<RegularChatMessage, 'id'>[] => {
  return messages
    .filter((m): m is RegularChatMessage => m.role !== 'fact-check')
    .map(({ id, content, ...rest }) => {
      // 文字列の場合はそのまま
      if (typeof content === 'string') {
        return { ...rest, content };
      }

      // 配列の場合、generated_image をフィルタリング
      const sanitizedContent = content.filter(
        (part: ChatMessageContentPart) => part.type !== 'generated_image'
      );

      // フィルタリング後に空になった場合はプレースホルダー
      if (sanitizedContent.length === 0) {
        return { ...rest, content: '[画像を生成しました]' };
      }

      // テキストのみの場合は文字列に変換
      if (sanitizedContent.length === 1 && sanitizedContent[0].type === 'text') {
        return { ...rest, content: sanitizedContent[0].text };
      }

      return { ...rest, content: sanitizedContent };
    });
};

import type { z } from 'zod';
import type { ReasoningEffortType, VerbosityType } from '@/schema/ai';
import type { ChatMessage } from './static';

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
  buildRequestPayload(
    request: ChatCompletionRequest
  ): Record<string, unknown> | Promise<Record<string, unknown>>;

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
 * 画像やファイル（PDF等）が含まれているかチェックする
 */
export const hasFileContent = (messages: ChatMessage[]): boolean => {
  return messages.some((m) => {
    // Check in content parts
    if (Array.isArray(m.content) && m.content.some((c) => c.type === 'image_url')) {
      return true;
    }
    // Check in attachments
    if (m.attachments?.some((a) => a.type === 'file-base64' || a.type === 'file')) {
      return true;
    }
    return false;
  });
};

/**
 * テキストからJSONブロックを抽出する。
 * Markdownコードブロック（```json ... ``` や ``` ... ```）で囲まれたJSONや、
 * テキスト中に埋め込まれた最初のJSON object を検出して返す。
 * 見つからなければ null を返す。
 */
const extractJsonFromText = (text: string): string | null => {
  // 1) Markdownコードブロック内のJSONを検出
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch?.[1]) {
    const candidate = codeBlockMatch[1].trim();
    try {
      JSON.parse(candidate);
      return candidate;
    } catch {
      // コードブロック内がJSONでなければ次を試す
    }
  }

  // 2) テキスト中の最初の { ... } ブロックを検出（ネスト対応）
  const firstBrace = text.indexOf('{');
  if (firstBrace !== -1) {
    let depth = 0;
    let inString = false;
    let isEscape = false;
    for (let i = firstBrace; i < text.length; i++) {
      const ch = text[i];
      if (isEscape) {
        isEscape = false;
        continue;
      }
      if (ch === '\\' && inString) {
        isEscape = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          const candidate = text.slice(firstBrace, i + 1);
          try {
            JSON.parse(candidate);
            return candidate;
          } catch {
            break;
          }
        }
      }
    }
  }

  return null;
};

/**
 * AIレスポンスのテキストをJSONとしてパースし、Zodスキーマで検証する。
 *
 * 以下の順にフォールバックを試みる:
 * 1. そのままJSON.parseを試行
 * 2. Markdownコードブロックや埋め込みJSON objectを抽出して再試行
 * 3. テキスト全体をmessageフィールドとして構造化データに変換
 */
export const parseStructuredResponse = <T>(textContent: string, schema: z.ZodType<T>): T => {
  // 1) そのままパースを試行
  try {
    return schema.parse(JSON.parse(textContent));
  } catch {
    // fall through
  }

  // 2) テキスト中からJSONブロックを抽出して試行
  const extracted = extractJsonFromText(textContent);
  if (extracted) {
    try {
      return schema.parse(JSON.parse(extracted));
    } catch {
      // fall through
    }
  }

  // 3) JSONパース不可: テキストをmessageとして構造化データにフォールバック
  // html, quickReplies は nullable なので null を指定（スキーマで omit されていても Zod が無視する）
  return schema.parse({ message: textContent, html: null, quickReplies: null });
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
export const sanitizeMessagesForApi = (messages: ChatMessage[]): Omit<ChatMessage, 'id'>[] => {
  return messages.map(({ id, content, ...rest }) => {
    return { ...rest, content };
  });
};

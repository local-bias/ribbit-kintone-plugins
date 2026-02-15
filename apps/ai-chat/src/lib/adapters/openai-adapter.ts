import { InteractiveAIResponseSchema, ReasoningEffortType } from '@/schema/ai';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import {
  ChatCompletionRequest,
  EndpointAdapter,
  GeneratedImage,
  hasImageContent,
  isO1SeriesModel,
  sanitizeMessagesForApi,
  StructuredAIResponse,
  TokenUsage,
} from '../endpoint-adapter';
import { getWebSearchLocation } from '../i18n';
import { ChatMessageContent, OPENAI_ENDPOINT } from '../static';

/**
 * Response API用のコンテンツパート型定義
 */
type ResponseApiTextContentPart = {
  type: 'input_text';
  text: string;
};

type ResponseApiImageContentPart = {
  type: 'input_image';
  image_url: string;
};

type ResponseApiContentPart = ResponseApiTextContentPart | ResponseApiImageContentPart;

type ResponseApiMessage = {
  role: string;
  content?: string | ResponseApiContentPart[];
};

/**
 * OpenAI Response APIのレスポンスボディ型
 */
type OpenAIResponseAPIBody = {
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
    result?: string;
    revised_prompt?: string;
  }>;
  output_text?: string | string[];
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
  model?: string;
};

/**
 * OpenAI Response API 用のアダプタ
 * OpenAIの/v1/responsesエンドポイント専用
 */
export class OpenAIAdapter implements EndpointAdapter {
  readonly endpoint = OPENAI_ENDPOINT;

  buildRequestPayload(request: ChatCompletionRequest): Record<string, unknown> {
    const {
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
    } = request;

    let max_tokens = maxTokens === 0 ? undefined : maxTokens;

    // 画像が含まれている場合はmax_tokensの指定が必須
    if (!max_tokens && hasImageContent(messages)) {
      max_tokens = 2048;
    }

    // メッセージをサニタイズ（ファクトチェック除外、generated_image除外）
    const regularMessages = sanitizeMessagesForApi(messages);

    if (systemPrompt) {
      regularMessages.unshift({
        role: 'system',
        content: systemPrompt,
      });
    }

    // HTML出力モード用のプロンプト拡張
    if (htmlOutputEnabled && currentHtml) {
      // 後ろから2番目(最後のユーザー指示の直前)に追加
      if (regularMessages.length >= 2) {
        const lastAssistantMessage = regularMessages[regularMessages.length - 2];
        if (typeof lastAssistantMessage.content === 'string') {
          lastAssistantMessage.content += `\n\n\`\`\`html\n${currentHtml}\n\`\`\``;
        }
      }
    }

    // Response API用のメッセージ形式に変換
    const responseInputMessages: ResponseApiMessage[] = regularMessages.map((msg) => ({
      role: msg.role,
      content: this.convertContentForResponses(msg.content),
    }));

    const payload: Record<string, unknown> = {
      model,
      temperature,
      max_output_tokens: max_tokens,
      input: responseInputMessages,
      text: schema
        ? { format: zodTextFormat(schema, 'json_response') }
        : {
            format: { type: 'text' },
            verbosity: verbosity === 'model-default' ? undefined : verbosity,
          },
    };

    // 画像生成が有効な場合、toolsに画像生成ツールを追加
    if (imageGenerationEnabled) {
      payload.tools = payload.tools || [];
      if (Array.isArray(payload.tools)) {
        payload.tools.push({
          type: 'image_generation',
        });
      }
    }

    // Prompt IDが設定されている場合、promptオブジェクトを追加
    if (promptId) {
      payload.prompt = {
        id: promptId,
      };
    }

    // Web検索の設定
    if (webSearchEnabled) {
      payload.tools = [{ type: 'web_search', user_location: getWebSearchLocation() }];
    }

    // Reasoning effortの設定
    const normalizedReasoningEffort = this.normalizeReasoningEffort(reasoningEffort);
    if (normalizedReasoningEffort) {
      payload.reasoning = {
        effort: normalizedReasoningEffort,
      };
    }

    // O1シリーズモデルの場合はtemperatureを削除
    if (isO1SeriesModel(model)) {
      delete payload.temperature;
    }

    return payload;
  }

  async parseResponse<T>(
    response: Response,
    responseBody: unknown,
    schema: z.ZodType<T>
  ): Promise<StructuredAIResponse<T>> {
    if (response.status !== 200) {
      this.handleError(response, responseBody);
    }

    const body = responseBody as OpenAIResponseAPIBody;

    // テキストコンテンツを抽出
    const textContent = this.extractTextContent(body);

    // Zodスキーマでパース
    const data = schema.parse(JSON.parse(textContent));

    // 生成画像を抽出
    const generatedImages = this.extractGeneratedImages(body);

    // Usage情報を変換
    const usage: TokenUsage | undefined = body.usage
      ? {
          promptTokens: body.usage.input_tokens,
          completionTokens: body.usage.output_tokens,
          totalTokens: (body.usage.input_tokens ?? 0) + (body.usage.output_tokens ?? 0),
        }
      : undefined;

    return {
      data,
      generatedImages: generatedImages.length > 0 ? generatedImages : undefined,
      usage,
      model: body.model,
    };
  }

  handleError(_response: Response, responseBody: unknown): never {
    const errorResponse = responseBody as { error?: { message?: string } };
    if (errorResponse?.error?.message) {
      throw new Error(errorResponse.error.message);
    }
    throw new Error(
      'APIの呼び出しに失敗しました。再度実行しても失敗する場合は、管理者にお問い合わせください。'
    );
  }

  /**
   * Response APIレスポンスからテキストコンテンツを抽出する
   */
  private extractTextContent(body: OpenAIResponseAPIBody): string {
    // output_text フィールドがあれば使用
    if (body.output_text) {
      return Array.isArray(body.output_text) ? body.output_text.join('\n') : body.output_text;
    }

    // output 配列からテキストを抽出
    if (Array.isArray(body.output)) {
      for (const item of body.output) {
        if (item?.type === 'message' && Array.isArray(item.content)) {
          for (const part of item.content) {
            if ((part?.type === 'output_text' || part?.type === 'text') && part?.text) {
              return part.text;
            }
          }
        }
      }
    }

    throw new Error('AIレスポンスからテキストコンテンツを取得できませんでした。');
  }

  /**
   * Response APIレスポンスから生成画像を抽出する
   */
  private extractGeneratedImages(body: OpenAIResponseAPIBody): GeneratedImage[] {
    const images: GeneratedImage[] = [];

    if (Array.isArray(body.output)) {
      for (const item of body.output) {
        if (item?.type === 'image_generation_call' && item?.result) {
          images.push({
            url: `data:image/png;base64,${item.result}`,
            revisedPrompt: item.revised_prompt,
          });
        }
      }
    }

    return images;
  }

  /**
   * ChatMessageのcontentをResponse API用の形式に変換する
   */
  private convertContentForResponses(content: ChatMessageContent): ResponseApiMessage['content'] {
    if (!content) {
      return undefined;
    }
    if (typeof content === 'string') {
      return content;
    }
    return content.map<ResponseApiContentPart>((part) => {
      if (part.type === 'text') {
        return { type: 'input_text', text: part.text };
      }
      const imageUrl = typeof part.image_url === 'string' ? part.image_url : part.image_url.url;
      if (!imageUrl) {
        return { type: 'input_text', text: '[image missing]' };
      }
      return {
        type: 'input_image',
        image_url: imageUrl,
      };
    });
  }

  /**
   * OpenAI用にreasoning_effortを正規化する
   */
  private normalizeReasoningEffort(value?: ReasoningEffortType): string | undefined {
    if (!value || value === 'model-default' || value === 'none') {
      return undefined;
    }
    if (value === 'minimal') {
      return 'low';
    }
    if (value === 'low' || value === 'medium' || value === 'high') {
      return value;
    }
    return undefined;
  }
}

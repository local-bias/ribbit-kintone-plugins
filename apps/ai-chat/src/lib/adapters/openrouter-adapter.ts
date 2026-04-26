import { zodTextFormat } from 'openai/helpers/zod.mjs';
import type { z } from 'zod';
import { dataUrlAtom } from '@/desktop/original-view/states/kintone';
import {
  type ChatCompletionRequest,
  type EndpointAdapter,
  type GeneratedImage,
  hasFileContent,
  isO1SeriesModel,
  parseStructuredResponse,
  type StructuredAIResponse,
  type TokenUsage,
} from '../endpoint-adapter';
import { OPENROUTER_CHAT_COMPLETION_ENDPOINT } from '../static';
import { store } from '../store';

/**
 * OpenRouter ChatCompletionのレスポンスボディ型
 */
type OpenRouterResponseBody = {
  choices?: Array<{
    message?: {
      content?:
        | string
        | Array<{
            type?: string;
            text?: string;
            image_url?: { url?: string };
            revised_prompt?: string;
          }>;
      images?: Array<{
        type?: string;
        image_url?: { url?: string };
      }>;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  model?: string;
};

/**
 * OpenRouter エンドポイント用のアダプタ
 */
export class OpenRouterAdapter implements EndpointAdapter {
  readonly endpoint = OPENROUTER_CHAT_COMPLETION_ENDPOINT;

  async buildRequestPayload(request: ChatCompletionRequest): Promise<Record<string, unknown>> {
    const {
      model,
      temperature,
      maxTokens,
      messages,
      systemPrompt,
      verbosity,
      reasoningEffort,
      webSearchEnabled,
      imageGenerationEnabled,
      schema,
    } = request;

    let max_tokens = maxTokens === 0 ? undefined : maxTokens;

    // 画像が含まれている場合はmax_tokensの指定が必須
    if (!max_tokens && hasFileContent(messages)) {
      max_tokens = 2048;
    }

    const responseInput: Record<string, unknown>[] = [];
    if (systemPrompt) {
      responseInput.push({
        role: 'system',
        content: [{ type: 'input_text', text: systemPrompt }],
      });
    }
    for (const message of messages) {
      const content: Record<string, unknown>[] = [
        {
          type: 'text',
          text: message.content,
        },
      ];

      if (!message.attachments?.length) {
        responseInput.push({ role: message.role, content });
        continue;
      }
      for (const attachment of message.attachments) {
        if (attachment.type === 'file-base64') {
          if (attachment.mimeType.startsWith('image/')) {
            content.push({
              type: 'image_url',
              image_url: {
                url: attachment.dataUrl,
              },
              detail: 'high',
            });
          } else {
            content.push({
              type: 'file',
              file: {
                filename: attachment.fileName,
                file_data: attachment.dataUrl,
              },
            });
          }
        } else if (attachment.type === 'file') {
          // ファイルの実体を取得し、base64エンコードする
          const dataUrl = await store.get(dataUrlAtom(attachment.fileKey));
          if (dataUrl) {
            // mimeTypeが画像の場合は`"input_Image"`それ以外は`"input_file"`として扱う
            if (attachment.mimeType.startsWith('image/')) {
              content.push({
                type: 'image_url',
                image_url: {
                  url: dataUrl,
                },
                detail: 'high',
              });
            } else {
              content.push({
                type: 'file',
                file: {
                  filename: attachment.fileName,
                  file_data: dataUrl,
                },
              });
            }
          }
        }
      }
      responseInput.push({ role: message.role, content });
    }

    let responseFormat: Record<string, unknown> = { type: 'text' };
    if (schema) {
      // jsonスキーマはヘルパー関数を使い、それ以外のパラメータは直接指定する
      const jsonSchema = zodTextFormat(schema, 'json_response').schema;
      responseFormat = {
        type: 'json_schema',
        json_schema: {
          name: 'response_schema',
          strict: true,
          schema: jsonSchema,
        },
      };
    }

    const payload: Record<string, unknown> = {
      model,
      temperature,
      max_completion_tokens: max_tokens,
      messages: responseInput,
      response_format: responseFormat,
      verbosity: verbosity === 'model-default' ? undefined : verbosity,
      reasoning_effort: reasoningEffort === 'model-default' ? undefined : reasoningEffort,
    };

    // Web検索の設定
    if (webSearchEnabled) {
      payload.plugins = payload.plugins || [];
      if (Array.isArray(payload.plugins)) {
        payload.plugins.push({ id: 'web' });
      }
    }

    // 画像生成が有効な場合、modalitiesに画像を追加
    if (imageGenerationEnabled) {
      payload.modalities = ['text', 'image'];
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

    const body = responseBody as OpenRouterResponseBody;

    // テキストコンテンツを抽出
    const textContent = this.extractTextContent(body);

    // Zodスキーマでパース（Structured Output非対応モデルのフォールバック付き）
    const data = parseStructuredResponse(textContent, schema);

    // 生成画像を抽出
    const generatedImages = this.extractGeneratedImages(body);

    // Usage情報を変換
    const usage: TokenUsage | undefined = body.usage
      ? {
          promptTokens: body.usage.prompt_tokens,
          completionTokens: body.usage.completion_tokens,
          totalTokens: body.usage.total_tokens,
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
   * OpenRouterレスポンスからテキストコンテンツを抽出する
   */
  private extractTextContent(body: OpenRouterResponseBody): string {
    const content = body.choices?.[0]?.message?.content;

    if (typeof content === 'string') {
      return content;
    }

    if (Array.isArray(content)) {
      for (const part of content) {
        if (part.type === 'text' && part.text) {
          return part.text;
        }
      }
    }

    throw new Error('AIレスポンスからテキストコンテンツを取得できませんでした。');
  }

  /**
   * OpenRouterレスポンスから生成画像を抽出する
   */
  private extractGeneratedImages(body: OpenRouterResponseBody): GeneratedImage[] {
    const images: GeneratedImage[] = [];
    const message = body.choices?.[0]?.message;

    if (!message) return images;

    // content 配列内の画像
    if (Array.isArray(message.content)) {
      for (const part of message.content) {
        if (part.type === 'image_url' && part.image_url?.url) {
          images.push({
            url: part.image_url.url,
            revisedPrompt: part.revised_prompt,
          });
        }
      }
    }

    // images フィールド
    if (Array.isArray(message.images)) {
      for (const image of message.images) {
        if (image?.type === 'image_url' && image?.image_url?.url) {
          images.push({
            url: image.image_url.url,
          });
        }
      }
    }

    return images;
  }
}

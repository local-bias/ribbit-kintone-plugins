import { dataUrlAtom } from '@/desktop/original-view/states/kintone';
import { ReasoningEffortType } from '@/schema/ai';
import { zodTextFormat } from 'openai/helpers/zod';
import {
  EasyInputMessage,
  ResponseInputMessageContentList,
} from 'openai/resources/responses/responses.mjs';
import { z } from 'zod';
import {
  ChatCompletionRequest,
  EndpointAdapter,
  GeneratedImage,
  hasFileContent,
  isO1SeriesModel,
  parseStructuredResponse,
  StructuredAIResponse,
  TokenUsage,
} from '../endpoint-adapter';
import { getWebSearchLocation } from '../i18n';
import { ChatMessageContent, OPENAI_ENDPOINT } from '../static';
import { store } from '../store';

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
      promptId,
      imageGenerationEnabled,
      htmlOutputEnabled,
      currentHtml,
      schema,
    } = request;

    const responseInput: EasyInputMessage[] = [];
    if (systemPrompt) {
      responseInput.push({
        role: 'system',
        content: [{ type: 'input_text', text: systemPrompt }],
      });
    }
    for (const message of messages) {
      const content: ResponseInputMessageContentList = [
        {
          type: message.role === 'assistant' ? ('output_text' as 'input_text') : 'input_text',
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
              type: 'input_image',
              image_url: attachment.dataUrl,
              detail: 'high',
            });
          } else {
            content.push({
              type: 'input_file',
              filename: attachment.fileName,
              file_data: attachment.dataUrl,
            });
          }
        } else if (attachment.type === 'file') {
          // ファイルの実体を取得し、base64エンコードする
          const dataUrl = await store.get(dataUrlAtom(attachment.fileKey));
          if (dataUrl) {
            // mimeTypeが画像の場合は`"input_Image"`それ以外は`"input_file"`として扱う
            if (attachment.mimeType.startsWith('image/')) {
              content.push({
                type: 'input_image',
                image_url: dataUrl,
                detail: 'high',
              });
            } else {
              content.push({
                type: 'input_file',
                filename: attachment.fileName,
                file_data: dataUrl,
              });
            }
          }
        }
      }
      responseInput.push({ role: message.role, content });
    }

    // HTML出力モード用のプロンプト拡張
    if (htmlOutputEnabled && currentHtml) {
      const index = responseInput.findLastIndex((msg) => msg.role === 'assistant');
      if (index !== -1) {
        responseInput[index].content += `\n\n\`\`\`html\n${currentHtml}\n\`\`\``;
      }
    }

    const payload: Record<string, unknown> = {
      model,
      temperature,
      max_output_tokens: maxTokens || undefined,
      input: responseInput,
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

    // Zodスキーマでパース（Structured Output非対応モデルのフォールバック付き）
    const data = parseStructuredResponse(textContent, schema);

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

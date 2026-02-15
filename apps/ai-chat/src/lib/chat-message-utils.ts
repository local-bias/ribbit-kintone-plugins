import { nanoid } from 'nanoid';
import { z } from 'zod';
import { InteractiveAIResponseSchema } from '@/schema/ai';
import type { GeneratedImage, StructuredAIResponse } from './endpoint-adapter';
import type { ChatHistory, ChatMessageContentPart, RegularChatMessage } from './static';

export type InteractiveAIResponse = z.infer<typeof InteractiveAIResponseSchema>;

/**
 * StructuredAIResponse から ChatMessage を生成
 * messageフィールドのみ必須で、html/quickRepliesはオプショナル
 */
export function buildChatMessage(
  response: StructuredAIResponse<
    { message: string } & Partial<Omit<InteractiveAIResponse, 'message'>>
  >
): RegularChatMessage {
  const parts: ChatMessageContentPart[] = [];

  // テキストコンテンツ
  if (response.data.message) {
    parts.push({ type: 'text', text: response.data.message });
  }

  // 生成画像
  if (response.generatedImages) {
    for (const img of response.generatedImages) {
      parts.push({
        type: 'generated_image',
        image_url: img.url,
        revised_prompt: img.revisedPrompt,
      });
    }
  }

  // テキストのみの場合は文字列として返す
  const content = parts.length === 1 && parts[0].type === 'text' ? parts[0].text : parts;

  return {
    id: nanoid(),
    role: 'assistant',
    content,
  };
}

/**
 * 生成画像をChatMessageContentPartに変換
 */
export function generatedImagesToParts(images: GeneratedImage[]): ChatMessageContentPart[] {
  return images.map((img) => ({
    type: 'generated_image' as const,
    image_url: img.url,
    revised_prompt: img.revisedPrompt,
  }));
}

/**
 * ChatHistory にアシスタントメッセージを追加
 */
export function appendAssistantResponse(
  history: ChatHistory,
  response: StructuredAIResponse<InteractiveAIResponse>
): ChatHistory {
  return {
    ...history,
    messages: [...history.messages, buildChatMessage(response)],
    html: response.data.html ?? history.html,
  };
}

/**
 * InteractiveAIResponse からクイックリプライを抽出
 */
export function extractQuickReplies(
  response: StructuredAIResponse<InteractiveAIResponse>
): Array<{ label: string; action: string }> | undefined {
  return response.data.quickReplies ?? undefined;
}

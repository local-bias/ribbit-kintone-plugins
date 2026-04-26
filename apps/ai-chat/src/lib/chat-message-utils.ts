import { nanoid } from 'nanoid';
import type { z } from 'zod';
import type { InteractiveAIResponseSchema } from '@/schema/ai';
import type { GeneratedImage, StructuredAIResponse } from './endpoint-adapter';
import type { ChatHistory, ChatMessage, ChatMessageContentPart, MessageAttachment } from './static';

export type InteractiveAIResponse = z.infer<typeof InteractiveAIResponseSchema>;

/**
 * StructuredAIResponse から ChatMessage を生成
 * messageフィールドのみ必須で、html/quickRepliesはオプショナル
 */
export function buildChatMessage(
  response: StructuredAIResponse<
    { message: string } & Partial<Omit<InteractiveAIResponse, 'message'>>
  >
): ChatMessage {
  const attachments: MessageAttachment[] = [];

  // 生成画像
  if (response.generatedImages) {
    for (const img of response.generatedImages) {
      attachments.push({
        type: 'file-base64',
        dataUrl: img.url,
        mimeType: 'image/png',
        fileName: `generated_image_${nanoid()}.png`,
      });
    }
  }

  return {
    id: nanoid(),
    role: 'assistant',
    content: response.data.message,
    attachments,
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

import { ketch } from '@/lib/browser';
import { OPENAI_CHAT_COMPLETION_ENDPOINT } from '@/lib/constants';
import { isDev } from '@/lib/global';
import type { OpenAIInputAttachment } from './file-attachments';

/** テキスト以外の添付（image_url / file として送信可能なもの） */
type BinaryAttachment = Extract<OpenAIInputAttachment, { type: 'image' } | { type: 'pdf' }>;

interface ChatCompletionParams {
  attachments: BinaryAttachment[];
  model: string;
  systemPrompt: string;
  responseSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required: string[];
    additionalProperties: false;
  };
  temperature: number;
  timeoutMs: number;
}

export async function callOpenAI(params: ChatCompletionParams): Promise<Record<string, unknown>> {
  const { attachments, model, systemPrompt, responseSchema, temperature } = params;

  const logTitle = '🧠 AI Output API call';
  if (isDev) {
    console.time(logTitle);
  }

  const userContent =
    attachments.length > 0
      ? [
          {
            type: 'text',
            text: '上記のシステムプロンプトに基づいて、指定されたJSON形式で出力してください。',
          },
          ...attachments.map((attachment) => {
            if (attachment.type === 'image') {
              return {
                type: 'image_url',
                image_url: { url: attachment.dataUrl },
              };
            }
            return {
              type: 'file',
              file: {
                filename: attachment.fileName,
                file_data: attachment.dataUrl,
              },
            };
          }),
        ]
      : '上記のシステムプロンプトに基づいて、指定されたJSON形式で出力してください。';

  const body = {
    model,
    temperature,
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: userContent,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'ai_output',
        strict: true,
        schema: responseSchema,
      },
    },
  };

  const response = await ketch(OPENAI_CHAT_COMPLETION_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (isDev) {
    console.timeEnd(logTitle);
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message =
      (errorData as { error?: { message?: string } })?.error?.message ??
      'APIリクエストに失敗しました';
    throw new Error(message);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('AIからの応答が空でした');
  }

  return JSON.parse(content) as Record<string, unknown>;
}

import OpenAI from 'openai';
import type { PluginCommonConfig } from '@/schema/plugin-config';
import { ketch } from './browser';
import { DEFAULT_BASE_URLS } from './static';

/**
 * AI 呼び出し用 OpenAI 互換クライアントを生成します
 *
 * - すべてのリクエストは `@konomi-app/ketch` 経由でプロキシされ、kintone の CORS 制約を回避します
 * - apiKey が未設定の場合はダミー値を渡します (社内プロキシ等で API キーをサーバー側保持する想定にも対応)
 */
export function createAIClient(common: PluginCommonConfig): OpenAI {
  const baseURL = common.baseUrl?.trim() || DEFAULT_BASE_URLS[common.providerType] || undefined;

  return new OpenAI({
    apiKey: common.apiKey?.trim() || 'dummy-api-key',
    baseURL,
    fetch: ketch as unknown as typeof fetch,
    dangerouslyAllowBrowser: true,
  });
}

/** チャット用メッセージ */
export interface AIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompleteOptions {
  signal?: AbortSignal;
  /** モデル名を上書き (未指定なら common.model を使用) */
  model?: string;
  /** temperature を上書き */
  temperature?: number;
  /** max_tokens を上書き */
  maxTokens?: number;
}

/**
 * メッセージ列を渡して AI からの返信内容 (テキスト) を 1 つだけ取得します
 *
 * - `messages` の先頭に system プロンプトが含まれていない場合のみ、`common.systemPrompt` を自動で挿入します
 * - 例外はそのまま投げるので、呼び出し側で UI 表示・トーストなどを行ってください
 */
export async function chatComplete(
  common: PluginCommonConfig,
  messages: AIChatMessage[],
  options: ChatCompleteOptions = {}
): Promise<{ content: string }> {
  const client = createAIClient(common);

  const hasSystem = messages.some((m) => m.role === 'system');
  const finalMessages: AIChatMessage[] =
    hasSystem || !common.systemPrompt
      ? messages
      : [{ role: 'system', content: common.systemPrompt }, ...messages];

  const response = await client.chat.completions.create(
    {
      model: options.model ?? common.model,
      messages: finalMessages,
      temperature: options.temperature ?? common.temperature,
    },
    { signal: options.signal }
  );

  const content = response.choices[0]?.message?.content ?? '';
  return { content };
}

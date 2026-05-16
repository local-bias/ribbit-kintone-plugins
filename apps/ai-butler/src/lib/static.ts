import type { AiProviderType } from '@/schema/plugin-config';

/**
 * 各 AI プロバイダーの既定 Base URL
 * - OpenAI 互換のエンドポイントに合わせた URL を設定する
 * - Azure はデプロイメント単位で URL が異なるため空文字 (= ユーザーが必須入力)
 * - custom は完全にユーザーが任意で指定する
 */
export const DEFAULT_BASE_URLS: Record<AiProviderType, string> = {
  openai: 'https://api.openai.com/v1',
  azure: '',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/openai/',
  custom: '',
};

/** 各 AI プロバイダーで提案するモデル名の候補 */
export const DEFAULT_MODELS: Record<AiProviderType, string[]> = {
  openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-4.1', 'gpt-4.1-mini', 'o1-mini'],
  azure: [],
  gemini: [
    'gemini-2.0-flash',
    'gemini-2.0-flash-thinking-exp',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
  ],
  custom: [],
};

/** プロバイダー表示名 (UI 用) */
export const PROVIDER_LABELS: Record<AiProviderType, string> = {
  openai: 'OpenAI',
  azure: 'Azure OpenAI',
  gemini: 'Google Gemini',
  custom: 'カスタム (OpenAI互換)',
};

/** トリガー表示名 */
export const TRIGGER_LABELS: Record<'manual' | 'fileDrop' | 'autocomplete', string> = {
  manual: 'チャットから手動実行',
  fileDrop: 'ファイル添付時',
  autocomplete: '入力予測',
};

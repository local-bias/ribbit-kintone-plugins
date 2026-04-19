import config from '@/../plugin.config.mjs';

export const PLUGIN_NAME = config.manifest.base.name.ja;

export const OPENAI_ENDPOINT_ROOT = 'https://api.openai.com';
export const OPENAI_CHAT_COMPLETION_ENDPOINT = `${OPENAI_ENDPOINT_ROOT}/v1/chat/completions`;

export const OPENAI_MODELS = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4.1',
  'gpt-4.1-mini',
  'gpt-4.1-nano',
] as const;

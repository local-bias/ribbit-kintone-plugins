import { API_ROUTE_UNLIMITED, isOpenSource } from '@repo/constants';
import OpenAI from 'openai';
import type { AiProviderType } from '@/schema/plugin-config';
import { ketch } from './browser';
import { OPENAI_BASE_URL, OPENROUTER_BASE_URL } from './static';

export function createOpenAIClient(providerType: AiProviderType) {
  let baseUrl = OPENAI_BASE_URL;
  if (providerType === 'openrouter') {
    baseUrl = OPENROUTER_BASE_URL;
  }
  if (!isOpenSource) {
    baseUrl = API_ROUTE_UNLIMITED;
  }

  return new OpenAI({
    apiKey: '🐸',
    baseURL: baseUrl,
    fetch: ketch,
    dangerouslyAllowBrowser: true,
  });
}

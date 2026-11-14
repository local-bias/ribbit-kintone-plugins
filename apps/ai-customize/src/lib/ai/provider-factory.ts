import type { LanguageModel } from 'ai';
import {
  normalizeProviderSettings,
  OPENROUTER_BASE_URL,
  PROXY_MANAGED_API_KEY,
  type ProviderSettings,
} from './endpoint';

export { PROXY_MANAGED_API_KEY };

/**
 * プラグイン設定から、AI SDKの言語モデルを作ります
 *
 * プロバイダーのパッケージは`desktop.js`に含めるが(1ファイルで配布する。ADR-47)、選んだ1つだけをチャットの開始時に評価する。
 * APIキーは操作画面へ返らないため、`apiKey`には固定のsentinelを渡す。同じ名前の認証ヘッダーの本物の値を
 * proxy設定へ保存しておき、kintoneが実行時に保存済みの値で上書きする(docs/07b 5章「AI SDKの認証ヘッダーとの接続」)
 *
 * @see docs/07b-ai-providers.md 2章
 */

export const createLanguageModel = async (
  raw: ProviderSettings,
  fetch: typeof globalThis.fetch
): Promise<LanguageModel> => {
  const apiKey = PROXY_MANAGED_API_KEY;
  // 送信先の算出(`buildProxyEndpoint`)と同じ正規化をかける
  const settings = normalizeProviderSettings(raw);
  switch (settings.providerType) {
    case 'openai': {
      const { createOpenAI } = await import(/* webpackMode: "eager" */ '@ai-sdk/openai');
      return createOpenAI({ apiKey, fetch }).responses(settings.model);
    }
    case 'anthropic': {
      const { createAnthropic } = await import(/* webpackMode: "eager" */ '@ai-sdk/anthropic');
      return createAnthropic({ apiKey, fetch })(settings.model);
    }
    case 'google': {
      const { createGoogleGenerativeAI } = await import(
        /* webpackMode: "eager" */ '@ai-sdk/google'
      );
      return createGoogleGenerativeAI({ apiKey, fetch })(settings.model);
    }
    case 'azure-openai': {
      const { createAzure } = await import(/* webpackMode: "eager" */ '@ai-sdk/azure');
      return createAzure({
        apiKey,
        fetch,
        resourceName: settings.azureResourceName,
        apiVersion: settings.azureApiVersion || undefined,
        // デプロイ名をURLに含める形にする(proxy設定のURLとデプロイが1対1になる)
        useDeploymentBasedUrls: true,
      }).chat(settings.azureDeploymentName);
    }
    case 'openrouter':
    case 'custom': {
      const { createOpenAICompatible } = await import(
        /* webpackMode: "eager" */ '@ai-sdk/openai-compatible'
      );
      return createOpenAICompatible({
        name: settings.providerType,
        baseURL: settings.providerType === 'openrouter' ? OPENROUTER_BASE_URL : settings.baseUrl,
        apiKey,
        fetch,
      }).chatModel(settings.model);
    }
  }
};

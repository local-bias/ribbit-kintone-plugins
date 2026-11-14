import type { PluginCommonConfig } from '@/schema/plugin-config';

/**
 * AIの生成リクエストの送信先(= proxy設定を登録するURL)を、プラグイン設定から求めます(純粋関数)
 *
 * GoogleはモデルID、Azureはデプロイ名でURLが変わるため、それらを変えるとproxy設定の登録し直し
 * (APIキーの再入力)が要る。差はここのテーブルだけで持つ
 *
 * @see docs/07b-ai-providers.md 5章「モデル変更がendpointを変えるプロバイダーがある」
 */

/**
 * 本物のAPIキーの代わりにプロバイダーへ渡す値
 *
 * proxy経由の送信の直前に、この値を持つヘッダーは取り除く(kintoneが保存済みの認証ヘッダーを付ける)
 */
export const PROXY_MANAGED_API_KEY = '__KINTONE_PROXY_MANAGED__';

/** OpenRouterのOpenAI互換API */
export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

export type ProviderSettings = Pick<
  PluginCommonConfig,
  | 'providerType'
  | 'baseUrl'
  | 'azureResourceName'
  | 'azureDeploymentName'
  | 'azureApiVersion'
  | 'model'
>;

export type ProxyEndpoint = Readonly<{
  /** proxy設定に登録するURL(クエリを含む) */
  url: string;
  origin: string;
  pathname: string;
  search: string;
  method: 'POST';
}>;

export type EndpointError =
  | 'model-required'
  | 'invalid-model'
  | 'invalid-base-url'
  | 'azure-resource-required'
  | 'azure-deployment-required'
  | 'invalid-azure-api-version';

export type EndpointResult =
  | { ok: true; endpoint: ProxyEndpoint }
  | { ok: false; reason: EndpointError };

/** URLのパスへそのまま入れる識別子(モデルID・デプロイ名)。`/`や`?`でURLの形を変えさせない */
const PATH_SEGMENT = /^[A-Za-z0-9._-]{1,128}$/;
/** `{resource}.openai.azure.com`のホスト名に入る名前 */
const AZURE_RESOURCE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,62})$/;
const AZURE_API_VERSION = /^[A-Za-z0-9.-]{1,32}$/;
/** `@ai-sdk/azure`が、APIバージョン未指定のときに使う値 */
const AZURE_DEFAULT_API_VERSION = 'v1';

const toEndpoint = (raw: string): EndpointResult => {
  const url = new URL(raw);
  return {
    ok: true,
    endpoint: {
      url: url.href,
      origin: url.origin,
      pathname: url.pathname,
      search: url.search,
      method: 'POST',
    },
  };
};

/** OpenAI互換APIのベースURL。`https:`で、ユーザー情報・クエリ・フラグメントを含まないこと */
const normalizeBaseUrl = (raw: string): string | null => {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (
    url.protocol !== 'https:' ||
    url.username !== '' ||
    url.password !== '' ||
    url.search !== '' ||
    url.hash !== '' ||
    raw.includes('?') ||
    raw.includes('#')
  ) {
    return null;
  }
  return `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
};

/**
 * 送信先の算出とプロバイダーの作成で同じ値を使うため、設定値を正規化します
 *
 * 前後の空白を除き、OpenAI互換APIのベースURLは`オリジン + パス`(末尾の`/`なし)にする。
 * ずれると、算出した送信先と実際の送信先が一致せず全て拒否される
 */
export const normalizeProviderSettings = (settings: ProviderSettings): ProviderSettings => ({
  providerType: settings.providerType,
  baseUrl: normalizeBaseUrl(settings.baseUrl) ?? settings.baseUrl.trim(),
  azureResourceName: settings.azureResourceName.trim(),
  azureDeploymentName: settings.azureDeploymentName.trim(),
  azureApiVersion: settings.azureApiVersion.trim(),
  model: settings.model.trim(),
});

export const buildProxyEndpoint = (raw: ProviderSettings): EndpointResult => {
  const settings = normalizeProviderSettings(raw);
  const model = settings.model;
  switch (settings.providerType) {
    case 'openai':
      return model === ''
        ? { ok: false, reason: 'model-required' }
        : toEndpoint('https://api.openai.com/v1/responses');
    case 'anthropic':
      return model === ''
        ? { ok: false, reason: 'model-required' }
        : toEndpoint('https://api.anthropic.com/v1/messages');
    case 'google':
      if (model === '') return { ok: false, reason: 'model-required' };
      if (!PATH_SEGMENT.test(model)) return { ok: false, reason: 'invalid-model' };
      return toEndpoint(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
      );
    case 'azure-openai': {
      const resource = settings.azureResourceName.trim();
      const deployment = settings.azureDeploymentName.trim();
      const apiVersion = settings.azureApiVersion.trim() || AZURE_DEFAULT_API_VERSION;
      if (!AZURE_RESOURCE.test(resource)) return { ok: false, reason: 'azure-resource-required' };
      if (!PATH_SEGMENT.test(deployment)) return { ok: false, reason: 'azure-deployment-required' };
      if (!AZURE_API_VERSION.test(apiVersion)) {
        return { ok: false, reason: 'invalid-azure-api-version' };
      }
      return toEndpoint(
        `https://${resource}.openai.azure.com/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`
      );
    }
    case 'openrouter':
      return model === ''
        ? { ok: false, reason: 'model-required' }
        : toEndpoint(`${OPENROUTER_BASE_URL}/chat/completions`);
    case 'custom': {
      const base = normalizeBaseUrl(settings.baseUrl);
      if (base === null) return { ok: false, reason: 'invalid-base-url' };
      return model === ''
        ? { ok: false, reason: 'model-required' }
        : toEndpoint(`${base}/chat/completions`);
    }
  }
};

/** 設定の変更で送信先が変わり、APIキーを登録し直す必要があるか */
export const requiresKeyReentry = (
  registeredProxyEndpoint: string,
  settings: ProviderSettings
): boolean => {
  const result = buildProxyEndpoint(settings);
  return !result.ok || result.endpoint.url !== registeredProxyEndpoint;
};

/**
 * proxy設定へ保存する認証ヘッダー
 *
 * AI SDKがsentinelのAPIキーで作るヘッダーと同じ名前にする。kintoneは実行時のヘッダーより
 * 保存済みのヘッダーを優先するため、本物のキーに置き換わって送られる(docs/07b 5章)
 */
export const buildAuthHeaders = (
  providerType: ProviderSettings['providerType'],
  apiKey: string
): Record<string, string> => {
  switch (providerType) {
    case 'anthropic':
      return { 'x-api-key': apiKey };
    case 'google':
      return { 'x-goog-api-key': apiKey };
    case 'azure-openai':
      return { 'api-key': apiKey };
    case 'openai':
    case 'openrouter':
    case 'custom':
      // ketchはヘッダー名を小文字にして送るため、保存する名前も小文字に揃える
      return { authorization: `Bearer ${apiKey}` };
  }
};

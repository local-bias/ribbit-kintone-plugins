import type { AssetScreen } from '@/schema/asset';
import type { PluginCommonConfig } from '@/schema/plugin-config';
import { buildProxyEndpoint, type EndpointError, type ProxyEndpoint } from './endpoint';

/**
 * チャットを始められるか(AIの設定とAPIキーの登録)を判定します(純粋関数)
 *
 * APIキーは操作画面から読めないため、設定画面が最後にキーを登録した送信先(`registeredProxyEndpoint`)と、
 * いまの設定から求めた送信先が一致することで「登録済み」とみなす(docs/07b 5章)
 */

export type ChatConfigCheck =
  | { ok: true; endpoint: ProxyEndpoint }
  | { ok: false; reason: EndpointError | 'key-not-registered' };

export const checkChatConfig = (common: PluginCommonConfig): ChatConfigCheck => {
  const result = buildProxyEndpoint(common);
  if (!result.ok) return result;
  return result.endpoint.url === common.registeredProxyEndpoint
    ? { ok: true, endpoint: result.endpoint }
    : { ok: false, reason: 'key-not-registered' };
};

/**
 * PC版のURLから画面の種類とレコードIDを読みます
 *
 * - `/k/{app}/` → 一覧、`/k/{app}/edit` → 追加
 * - `/k/{app}/show#record=1` → 詳細、`#record=1&mode=edit` → 編集
 */
export const detectScreen = (url: string): { screen: AssetScreen; recordId: string | null } => {
  const { pathname, hash } = new URL(url);
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  if (/\/k\/(?:guest\/\d+\/)?\d+\/edit\/?$/.test(pathname)) {
    return { screen: 'create', recordId: null };
  }
  if (/\/k\/(?:guest\/\d+\/)?\d+\/show\/?$/.test(pathname)) {
    const record = params.get('record');
    const recordId = record !== null && /^\d+$/.test(record) ? record : null;
    return { screen: params.get('mode') === 'edit' ? 'edit' : 'detail', recordId };
  }
  return { screen: 'index', recordId: null };
};

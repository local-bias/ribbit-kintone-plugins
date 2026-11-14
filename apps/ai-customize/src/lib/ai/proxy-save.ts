import type { PluginCommonConfig } from '@/schema/plugin-config';
import { buildAuthHeaders, buildProxyEndpoint, type EndpointError } from './endpoint';

/**
 * 設定を保存するとき、proxy設定(APIキー)へ何をするかを決めます(純粋関数)
 *
 * - 送信先が変わったら、APIキーを入力し直すまで保存させない(旧送信先の秘密を移し替えない)
 * - 新しい送信先に登録したら、旧送信先の登録は空にして無効にする
 * - AIの設定を空にしたら、登録も消す
 * - 「いま登録されている送信先」は、画面上の設定ではなくkintoneに保存済みのものを使う。
 *   画面上の設定はインポートやリセットで書き換わるため、それを信じると旧送信先の登録が残ったり、
 *   インポートした送信先を検証なしに「登録済み」と扱ったりする
 *
 * 呼び出し側は、proxy設定の登録 → 旧送信先の無効化 → 通常の設定の保存、の順に行う
 *
 * @see docs/07b-ai-providers.md 5章「APIキーはendpointが変わったら再入力させる」
 */

export type ProxySavePlan =
  | { ok: false; reason: 'key-required' | EndpointError }
  | {
      ok: true;
      /** 登録するproxy設定。APIキーを入力していなければ無い */
      register: { url: string; headers: Record<string, string> } | null;
      /** 無効にする旧送信先 */
      unregister: string | null;
      registeredProxyEndpoint: string;
      /**
       * APIキーを、これまでと別のホストへ登録する(インポートや入力の誤りで、意図しない送信先へ
       * キーを渡さないよう、URLを示して確認する)
       */
      confirmDestination: boolean;
    };

type AiSettings = Pick<
  PluginCommonConfig,
  | 'providerType'
  | 'baseUrl'
  | 'azureResourceName'
  | 'azureDeploymentName'
  | 'azureApiVersion'
  | 'model'
>;

/** kintoneに保存済みの状態 */
export type PersistedProxy = {
  /** 最後に保存した設定の`registeredProxyEndpoint` */
  endpoint: string;
  /** その送信先にAPIキー(ヘッダー)が実際に登録されているか */
  keyRegistered: boolean;
};

/** AIの項目が1つでも入力されているか(全て空ならAIを使わない設定) */
const hasAnyAiInput = (settings: AiSettings): boolean =>
  [settings.model, settings.baseUrl, settings.azureResourceName, settings.azureDeploymentName].some(
    (value) => value.trim() !== ''
  );

const hostOf = (url: string): string | null => {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
};

export const planProxySave = (
  settings: AiSettings,
  apiKey: string,
  persisted: PersistedProxy
): ProxySavePlan => {
  const previous = persisted.endpoint;
  const key = apiKey.trim();
  if (!hasAnyAiInput(settings)) {
    return {
      ok: true,
      register: null,
      unregister: previous === '' ? null : previous,
      registeredProxyEndpoint: '',
      confirmDestination: false,
    };
  }
  const result = buildProxyEndpoint(settings);
  if (!result.ok) {
    return result;
  }
  const { url } = result.endpoint;
  if (key === '') {
    return url === previous && persisted.keyRegistered
      ? {
          ok: true,
          register: null,
          unregister: null,
          registeredProxyEndpoint: url,
          confirmDestination: false,
        }
      : { ok: false, reason: 'key-required' };
  }
  return {
    ok: true,
    register: { url, headers: buildAuthHeaders(settings.providerType, key) },
    unregister: previous !== '' && previous !== url ? previous : null,
    registeredProxyEndpoint: url,
    confirmDestination: hostOf(url) !== hostOf(previous),
  };
};

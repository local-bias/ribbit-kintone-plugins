import { atom } from '@repo/jotai';
import { enqueueSnackbar } from 'notistack';
import type { ChangeEvent, ReactNode } from 'react';
import { planProxySave } from '@/lib/ai/proxy-save';
import { restorePluginConfig } from '@/lib/config-restore';
import { t } from '@/lib/i18n';
import { importPluginConfigAtom, pluginConfigAtom, updatePluginConfig } from './plugin';

/**
 * 設定画面のAI(BYOK)の状態と保存
 *
 * APIキーはこの画面のメモリーにだけ持ち、プラグインの通常の設定・エクスポートへは書かない。
 * 保存はproxy設定(APIキー)を先に行い、通常の設定を最後に保存する
 *
 * @see docs/07b-ai-providers.md 5章
 */

/** 入力中のAPIキー。保存したら消す */
export const apiKeyInputAtom = atom('');

/**
 * kintoneに保存済みの送信先(画面を開いたときの値。保存に成功したら更新する)
 *
 * 画面上の設定はインポートやリセットで書き換わるため、旧送信先の無効化や「登録済み」の判定には使わない
 */
export const persistedEndpointAtom = atom(restorePluginConfig().common.registeredProxyEndpoint);

const setProxyConfig = (url: string, headers: Record<string, string>): Promise<void> =>
  new Promise((resolve, reject) => {
    try {
      // コールバックを渡すと、保存後に画面遷移しない
      kintone.plugin.app.setProxyConfig(url, 'POST', headers, {}, () => resolve());
    } catch (error) {
      reject(error);
    }
  });

/**
 * 送信先にAPIキーが登録済みか
 *
 * `getProxyConfig`は保存済みのヘッダー(秘密)を返すが、登録の有無の判定にだけ使い、値は保持しない
 */
export const isProxyKeyRegistered = (url: string): boolean => {
  if (url === '') return false;
  try {
    const saved = kintone.plugin.app.getProxyConfig(url, 'POST') as {
      headers?: Record<string, unknown>;
    } | null;
    return Object.keys(saved?.headers ?? {}).length > 0;
  } catch {
    return false;
  }
};

/**
 * 設定を保存します(フッターの「保存」)
 *
 * 1. 新しい送信先へAPIキーを登録 2. 旧送信先の登録を空にして無効化 3. 通常の設定を保存。
 * 2で失敗したら1を取り消し、通常の設定は保存しない(送信先とキーの登録をずらさない)
 */
export const saveConfigAtom = atom(null, async (get, set, actionComponent: ReactNode) => {
  const config = get(pluginConfigAtom);
  const persisted = get(persistedEndpointAtom);
  const plan = planProxySave(config.common, get(apiKeyInputAtom), {
    endpoint: persisted,
    keyRegistered: isProxyKeyRegistered(persisted),
  });
  if (!plan.ok) {
    enqueueSnackbar(t(`config.ai.error.${plan.reason}`), { variant: 'error' });
    return;
  }
  // APIキーを別のホストへ渡す前に、送信先のURLを全て見せて確かめる
  if (
    plan.register !== null &&
    plan.confirmDestination &&
    !window.confirm(t('config.ai.confirmDestination', plan.register.url))
  ) {
    return;
  }
  try {
    if (plan.register !== null) {
      await setProxyConfig(plan.register.url, plan.register.headers);
    }
  } catch {
    // 例外にはヘッダー(APIキー)が含まれうるため、内容は出さない
    enqueueSnackbar(t('config.ai.error.proxy'), { variant: 'error' });
    return;
  }
  try {
    if (plan.unregister !== null) {
      await setProxyConfig(plan.unregister, {});
    }
  } catch {
    if (plan.register !== null) {
      await setProxyConfig(plan.register.url, {}).catch(() => {});
    }
    enqueueSnackbar(t('config.ai.error.proxy'), { variant: 'error' });
    return;
  }
  set(pluginConfigAtom, {
    ...config,
    common: { ...config.common, registeredProxyEndpoint: plan.registeredProxyEndpoint },
  });
  set(persistedEndpointAtom, plan.registeredProxyEndpoint);
  set(apiKeyInputAtom, '');
  set(updatePluginConfig, actionComponent);
});

/**
 * 設定をインポートします
 *
 * 取り込んだ設定の「登録済みの送信先」は、この環境のproxy設定とは無関係なので消す(APIキーは入力し直す)
 */
export const importConfigAtom = atom(
  null,
  async (get, set, event: ChangeEvent<HTMLInputElement>) => {
    await set(importPluginConfigAtom, event);
    const config = get(pluginConfigAtom);
    set(pluginConfigAtom, {
      ...config,
      common: { ...config.common, registeredProxyEndpoint: '' },
    });
    set(apiKeyInputAtom, '');
  }
);

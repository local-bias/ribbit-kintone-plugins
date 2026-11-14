import type { TargetCoordinate } from '@/lib/asset-query';
import {
  buildNormalModeUrl,
  isSafeMode,
  readMutedIds,
  removeOtherUsersKeys,
  type StorageLike,
} from '@/lib/browser-storage';
import { restorePluginConfig } from '@/lib/config-restore';
import { CIRCUIT_BREAKER_THRESHOLD } from '@/lib/constants';
import { collectAssetProblems, createDiagnostics, type Diagnostics } from '@/lib/diagnostics';
import { GUEST_SPACE_ID, LOGIN_USER } from '@/lib/global';
import { t } from '@/lib/i18n';
import { type RuntimeView, toRuntimePhase } from '@/lib/launcher-status';
import { isUsableConfig } from '@/lib/plugin';
import { logDiagnostic } from './diagnostic-log';
import { createLauncherServices, type LauncherServices } from './launcher/services';
import { createNotice } from './notice';
import { type RuntimeController, type RuntimeStatus, startRuntime } from './runtime';

/**
 * 操作画面の起動処理(読み込み時に同期で実行する)
 *
 * 1. 設定とセーフモードの判定
 * 2. アセットの取得を開始(awaitしない)
 * 3. show系4イベントへ起動ゲートを登録
 *
 * 画面(ランチャー)の描画はここでは行わず、戻り値を使って呼び出し元が行う。
 * ランチャーの描画をアセットの実行結果に依存させないため(docs/05-runtime.md 9章)。
 *
 * @see docs/05-runtime.md 2章
 */

const getStorage = (kind: 'localStorage' | 'sessionStorage'): StorageLike | null => {
  try {
    return window[kind] ?? null;
  } catch {
    return null;
  }
};

export type BootstrapResult = {
  services: LauncherServices;
  /** いまの実行基盤の状態 */
  view: () => RuntimeView;
};

const EMPTY_APPLIED = { js: new Set<string>(), css: new Set<string>() };

/**
 * @param options.onChange 実行基盤の状態が変わったとき(取得完了・評価・診断の記録・パネルでの切り替え)に呼ぶ
 * @returns 設定が完了していない、またはアプリ以外の画面では`null`
 */
export const bootstrap = (options: { onChange?: () => void } = {}): BootstrapResult | null => {
  const onChange = () => options.onChange?.();
  const { common } = restorePluginConfig();
  if (!isUsableConfig(common)) {
    console.warn('[ai-customize]', t('desktop.log.unusableConfig'));
    return null;
  }
  const appId = kintone.app.getId();
  if (appId === null) {
    return null;
  }
  const target: TargetCoordinate = { spaceId: GUEST_SPACE_ID ?? '0', appId: String(appId) };
  const loginUserCode = LOGIN_USER.code;
  const localStorage = getStorage('localStorage');
  removeOtherUsersKeys(localStorage, loginUserCode);
  const safeMode = isSafeMode({
    search: location.search,
    storage: localStorage,
    target,
    loginUserCode,
  });

  const status: RuntimeStatus = { loaded: false, loadError: null, timedOut: false };
  let diagnostics: Diagnostics | null = null;
  let controller: RuntimeController | null = null;

  if (safeMode) {
    // ランチャーを開かなくても気づけるよう、画面にも出す
    createNotice(t('desktop.notice.dismiss')).show({
      level: 'info',
      message: t('desktop.notice.safeMode'),
      actions: [
        { label: t('desktop.notice.exitSafeMode'), href: buildNormalModeUrl(location.href) },
      ],
    });
  } else {
    diagnostics = createDiagnostics({
      circuitBreakerThreshold: CIRCUIT_BREAKER_THRESHOLD,
      onRecord: (entry) => {
        logDiagnostic(entry);
        onChange();
      },
    });
    controller = startRuntime({
      common,
      applyContext: {
        target,
        loginUserCode,
        mutedIds: readMutedIds(localStorage, target, loginUserCode),
        safeMode: false,
      },
      diagnostics,
      status,
      onChange,
    });
  }

  const services = createLauncherServices({
    common,
    target,
    loginUserCode,
    safeMode,
    controller,
    localStorage,
    sessionStorage: getStorage('sessionStorage'),
  });

  return {
    services,
    view: () => {
      const entries = diagnostics?.entries() ?? [];
      return {
        phase: toRuntimePhase(safeMode, status),
        loadError: status.loadError,
        applied: controller?.applied() ?? EMPTY_APPLIED,
        diagnostics: entries,
        problems: collectAssetProblems(entries),
      };
    },
  };
};

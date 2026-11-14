import type { TargetCoordinate } from '@/lib/asset-query';
import type { AssetLoadError } from '@/lib/asset-repository';
import {
  buildNormalModeUrl,
  buildSafeModeUrl,
  isSafeMode,
  readMutedIds,
  removeOtherUsersKeys,
  type StorageLike,
} from '@/lib/browser-storage';
import { restorePluginConfig } from '@/lib/config-restore';
import { CIRCUIT_BREAKER_THRESHOLD, MAX_ASSETS_PER_APP } from '@/lib/constants';
import { createDiagnostics, type Diagnostics, summarizeDiagnostics } from '@/lib/diagnostics';
import { GUEST_SPACE_ID, LOGIN_USER } from '@/lib/global';
import { t } from '@/lib/i18n';
import { isUsableConfig } from '@/lib/plugin';
import { logDiagnostic } from './diagnostic-log';
import { createNotice, type NoticeContent } from './notice';
import { type RuntimeStatus, startRuntime } from './runtime';

/**
 * 操作画面の起動処理(読み込み時に同期で実行する)
 *
 * 1. 設定とセーフモードの判定
 * 2. アセットの取得を開始(awaitしない)
 * 3. show系4イベントへ起動ゲートを登録
 *
 * @see docs/05-runtime.md 2章
 */

const getLocalStorage = (): StorageLike | null => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const describeLoadError = (error: AssetLoadError): string => {
  switch (error.reason) {
    case 'request-failed':
      return t('desktop.notice.loadFailed', error.message);
    case 'too-many':
      return t('desktop.notice.tooMany', String(MAX_ASSETS_PER_APP));
    case 'too-large':
      return t('desktop.notice.tooLarge');
  }
};

/** 利用者に知らせるべき状態から、通知の内容を決めます。何も無ければ`null` */
const buildNoticeContent = (
  status: RuntimeStatus,
  diagnostics: Diagnostics
): NoticeContent | null => {
  const reload = { label: t('desktop.notice.reload'), href: location.href };
  if (status.loadError !== null) {
    return { level: 'error', message: describeLoadError(status.loadError), actions: [reload] };
  }
  if (status.timedOut) {
    return { level: 'warning', message: t('desktop.notice.timeout'), actions: [reload] };
  }
  const summary = summarizeDiagnostics(diagnostics.entries());
  const count = new Set([
    ...summary.failedAssetIds,
    ...summary.deniedAssetIds,
    ...summary.blockedAssetIds,
  ]).size;
  if (count === 0) {
    return null;
  }
  return {
    level: 'warning',
    message: t('desktop.notice.problems', String(count)),
    actions: [{ label: t('desktop.notice.openSafeMode'), href: buildSafeModeUrl(location.href) }],
  };
};

export const bootstrap = (): void => {
  const { common } = restorePluginConfig();
  if (!isUsableConfig(common)) {
    console.warn('[ai-customize]', t('desktop.log.unusableConfig'));
    return;
  }
  const appId = kintone.app.getId();
  if (appId === null) {
    return;
  }
  const target: TargetCoordinate = { spaceId: GUEST_SPACE_ID ?? '0', appId: String(appId) };
  const loginUserCode = LOGIN_USER.code;
  const storage = getLocalStorage();
  removeOtherUsersKeys(storage, loginUserCode);

  const notice = createNotice(t('desktop.notice.dismiss'));
  if (isSafeMode({ search: location.search, storage, target, loginUserCode })) {
    notice.show({
      level: 'info',
      message: t('desktop.notice.safeMode'),
      actions: [
        { label: t('desktop.notice.exitSafeMode'), href: buildNormalModeUrl(location.href) },
      ],
    });
    return;
  }

  const status: RuntimeStatus = { loadError: null, timedOut: false };
  const diagnostics: Diagnostics = createDiagnostics({
    circuitBreakerThreshold: CIRCUIT_BREAKER_THRESHOLD,
    onRecord: (entry) => {
      logDiagnostic(entry);
      const content = buildNoticeContent(status, diagnostics);
      if (content !== null) notice.show(content);
    },
  });

  startRuntime({
    common,
    applyContext: {
      target,
      loginUserCode,
      mutedIds: readMutedIds(storage, target, loginUserCode),
      safeMode: false,
    },
    diagnostics,
    status,
  });
};

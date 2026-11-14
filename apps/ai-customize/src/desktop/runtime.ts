import { getRecords } from '@konomi-app/kintone-utilities';
import {
  type ApplyContext,
  type AssetGrants,
  checkCapabilityPolicy,
  isScreenTarget,
  shouldApply,
} from '@/lib/asset-filter';
import { createAssetKintone, type KintoneGlobal } from '@/lib/asset-kintone';
import type { TargetCoordinate } from '@/lib/asset-query';
import { type AssetLoadError, loadEnabledAssets } from '@/lib/asset-repository';
import { GATE_TIMEOUT_MS } from '@/lib/constants';
import type { Diagnostics } from '@/lib/diagnostics';
import {
  createEventBridge,
  type EventBridge,
  SHOW_EVENT_TYPES,
  toScreen,
} from '@/lib/event-bridge';
import { GUEST_SPACE_ID, isDev, LOGIN_USER } from '@/lib/global';
import { t } from '@/lib/i18n';
import { createInjector, type DocumentLike } from '@/lib/injector';
import { createLaunchGate, type GateLoadResult } from '@/lib/launch-gate';
import type { PermissionDenial } from '@/lib/permission-error';
import { type AssetContext, createRunner, type Runner } from '@/lib/runner';
import type { Asset, AssetScreen } from '@/schema/asset';
import type { PluginCommonConfig } from '@/schema/plugin-config';

/**
 * アセットの実行基盤の組み立て(取得 → 起動ゲート → 評価 → 配信)
 *
 * @see docs/05-runtime.md
 */

export type RuntimeStatus = { loadError: AssetLoadError | null; timedOut: boolean };

/** 適用するアセット・実行順・現在の権限の台帳。取得完了時に一度だけ登録する */
type AssetRegistry = {
  register: (assets: readonly Asset[]) => void;
  get: (assetId: string) => Asset | undefined;
  rankOf: (assetId: string) => number;
  grantsOf: (assetId: string) => AssetGrants;
};

const createAssetRegistry = (): AssetRegistry => {
  const assets = new Map<string, Asset>();
  const ranks = new Map<string, number>();
  const grants = new Map<string, AssetGrants>();
  return {
    register: (list) => {
      list.forEach((asset, index) => {
        assets.set(asset.id, asset);
        ranks.set(asset.id, index);
        grants.set(asset.id, { permissions: asset.permissions, externalUrls: asset.externalUrls });
      });
    },
    get: (assetId) => assets.get(assetId),
    rankOf: (assetId) => ranks.get(assetId) ?? Number.MAX_SAFE_INTEGER,
    grantsOf: (assetId) => grants.get(assetId) ?? { permissions: [], externalUrls: [] },
  };
};

const describeRequirement = (denial: PermissionDenial): string => {
  switch (denial.operation) {
    case 'kintone.api':
      return denial.required.filter((requirement) => requirement !== 'read').join(', ');
    case 'kintone.proxy':
      return t('desktop.denied.external');
    case 'kintone.getRequestToken':
      return t('desktop.denied.writePermission');
    case 'kintone.plugin.app.proxy':
      return t('desktop.denied.never');
  }
};

const describeDenial = (denial: PermissionDenial): string => {
  const operation = [denial.operation, denial.method, denial.target]
    .filter((part) => part !== null && part !== '')
    .join(' ');
  return t('desktop.denied', denial.assetId, operation, describeRequirement(denial));
};

const createContext = (asset: Asset, screen: AssetScreen, target: TargetCoordinate): AssetContext =>
  Object.freeze({
    appId: target.appId,
    guestSpaceId: GUEST_SPACE_ID,
    screen,
    loginUser: Object.freeze({ code: LOGIN_USER.code, name: LOGIN_USER.name }),
    asset: Object.freeze({
      id: asset.id,
      title: asset.title,
      kind: asset.kind,
      scope: asset.scope,
      permissions: Object.freeze([...asset.permissions]),
      externalUrls: Object.freeze([...asset.externalUrls]),
    }),
    log: (...args: unknown[]) => console.info(`[ai-customize #${asset.id}]`, ...args),
  });

/**
 * 有効なアセットを取得し、このページで適用するものに絞って台帳へ登録します
 *
 * CSSは実行時に迂回できないので、権限の判定を取得時に一度だけ行って外す
 */
const loadApplicableAssets = (params: {
  common: PluginCommonConfig;
  applyContext: ApplyContext;
  origin: string;
  registry: AssetRegistry;
  diagnostics: Diagnostics;
}): Promise<GateLoadResult> => {
  const { common, applyContext, origin, registry, diagnostics } = params;
  return loadEnabledAssets({
    fetchRecords: (request) => getRecords({ ...request, debug: isDev }),
    common,
    target: applyContext.target,
    onSkipped: (assetId, reason) =>
      diagnostics.record({ kind: 'mapping-skipped', assetId, reason }),
  }).then((result): GateLoadResult => {
    if (result.status === 'error') {
      return result;
    }
    const assets = result.assets.filter((asset) => {
      if (!shouldApply(asset, applyContext)) {
        return false;
      }
      if (asset.kind === 'js') {
        return true;
      }
      const policy = checkCapabilityPolicy(asset, origin);
      if (!policy.allowed) {
        diagnostics.record({ kind: 'blocked', assetId: asset.id, policy });
      }
      return policy.allowed;
    });
    registry.register(assets);
    return { status: 'ok', assets };
  });
};

const createRuntimeBridge = (registry: AssetRegistry, diagnostics: Diagnostics): EventBridge =>
  createEventBridge({
    registerNative: (type, handler) => kintone.events.on(type, handler),
    canDeliver: (assetId, type) => {
      const asset = registry.get(assetId);
      const screen = toScreen(type);
      return (
        asset !== undefined &&
        screen !== null &&
        isScreenTarget(asset, screen) &&
        !diagnostics.isSuspended(assetId)
      );
    },
    rankOf: registry.rankOf,
    onHandlerError: (assetId, eventType, error) =>
      diagnostics.record({ kind: 'handler-failed', assetId, eventType, error }),
    onRejectedType: (assetId, eventType) =>
      diagnostics.record({ kind: 'rejected-event-type', assetId, eventType }),
    onIgnoredThenable: (assetId, eventType) =>
      diagnostics.record({ kind: 'ignored-thenable', assetId, eventType }),
    submitErrorMessage: t('desktop.submitError'),
  });

const createRuntimeRunner = (params: {
  registry: AssetRegistry;
  bridge: EventBridge;
  diagnostics: Diagnostics;
  origin: string;
  target: TargetCoordinate;
}): Runner => {
  const { registry, bridge, diagnostics, origin, target } = params;
  const real = kintone as unknown as KintoneGlobal;
  return createRunner({
    createFacade: (asset) =>
      createAssetKintone({
        real,
        assetId: asset.id,
        bridge,
        getGrants: () => registry.grantsOf(asset.id),
        origin,
        onDenied: (error) =>
          diagnostics.record({ kind: 'permission-denied', denial: error.denial }),
        describeDenial,
      }),
    createContext: (asset, screen) => createContext(asset, screen, target),
    checkPolicy: (asset) => checkCapabilityPolicy(asset, origin),
    record: diagnostics.record,
    now: () => performance.now(),
  });
};

/**
 * 実行基盤を組み立て、show系4イベントへ起動ゲートを同期で登録します
 *
 * @param status 通知の内容を決めるための状態。タイムアウト・取得失敗をここへ書き込む
 */
export const startRuntime = (params: {
  common: PluginCommonConfig;
  applyContext: ApplyContext;
  diagnostics: Diagnostics;
  status: RuntimeStatus;
}): void => {
  const { common, applyContext, diagnostics, status } = params;
  const origin = location.origin;
  const registry = createAssetRegistry();
  const load = loadApplicableAssets({ common, applyContext, origin, registry, diagnostics });
  const bridge = createRuntimeBridge(registry, diagnostics);
  const runner = createRuntimeRunner({
    registry,
    bridge,
    diagnostics,
    origin,
    target: applyContext.target,
  });
  const injector = createInjector(document as unknown as DocumentLike);

  const gate = createLaunchGate({
    load,
    timeoutMs: GATE_TIMEOUT_MS,
    setTimer: (callback, ms) => {
      const id = window.setTimeout(callback, ms);
      return () => window.clearTimeout(id);
    },
    prepare: (assets, screen) => {
      injector.sync(assets, screen);
      runner.evaluatePending(assets, screen);
    },
    applyCssOnly: (assets, screen) => injector.sync(assets, screen),
    dispatch: (type, event) => bridge.dispatch(type, event),
    onTimeout: () => {
      status.timedOut = true;
      console.warn('[ai-customize]', t('desktop.log.timeout', String(GATE_TIMEOUT_MS)));
      diagnostics.record({ kind: 'gate-timeout' });
    },
    onLoadError: (error) => {
      status.loadError = error;
      diagnostics.record({ kind: 'load-failed', error });
    },
    onInternalError: (error) => console.error('[ai-customize]', t('desktop.log.internal'), error),
  });

  // show系は読み込み時に同期で登録する(遅れて登録すると取りこぼす)
  kintone.events.on([...SHOW_EVENT_TYPES], (event) => gate.handleShow(event));
};

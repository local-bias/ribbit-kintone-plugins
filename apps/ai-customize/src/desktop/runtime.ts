import { getRecords } from '@konomi-app/kintone-utilities';
import {
  type ApplyContext,
  type AssetGrants,
  checkCapabilityPolicy,
  isScreenTarget,
  mergePanelAssets,
  selectApplicableCss,
  shouldApply,
} from '@/lib/asset-filter';
import { narrowGrants } from '@/lib/asset-grants';
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
import { type AssetContext, createRunner, type Runner } from '@/lib/runner';
import type { Asset, AssetScreen } from '@/schema/asset';
import type { PluginCommonConfig } from '@/schema/plugin-config';
import { describeDenial } from './diagnostic-text';

/**
 * アセットの実行基盤の組み立て(取得 → 起動ゲート → 評価 → 配信)
 *
 * @see docs/05-runtime.md
 */

export type RuntimeStatus = {
  /** 取得が終わり、適用してよい結果が得られた */
  loaded: boolean;
  loadError: AssetLoadError | null;
  timedOut: boolean;
};

/** パネルでの有効・無効の切り替え(最新のもの) */
type PanelChanges = {
  /** パネルで取得した、無効なものも含む全件(このパネルで更新した状態を重ねたもの) */
  assets: readonly Asset[];
  mutedIds: ReadonlySet<string>;
};

/** パネル(ランチャー)から実行基盤を操作するための窓口 */
export type RuntimeController = {
  /** このページで適用しているアセット(評価できたJSと、`<style>`を付けたCSS) */
  applied: () => { js: ReadonlySet<string>; css: ReadonlySet<string> };
  /**
   * パネルでの有効・無効の切り替えを反映します
   *
   * - CSSは即時に付け直す
   * - JSは評価済みのものを取り消さない(二重実行しない。ADR-3)。取得中に無効にしたものは、取得後も評価しない
   * - 取得に失敗したページでは何も適用しない(上限超過などはfail closed)
   *
   * @param assets パネルで取得した、無効なものも含む全件
   */
  applyPanelChanges: (assets: readonly Asset[], mutedIds: ReadonlySet<string>) => void;
};

/**
 * 適用するアセット・実行順・現在の権限の台帳
 *
 * JSは取得完了時に一度だけ登録する。CSSはパネルでの切り替えで入れ替わる
 */
type AssetRegistry = {
  register: (assets: readonly Asset[]) => void;
  get: (assetId: string) => Asset | undefined;
  rankOf: (assetId: string) => number;
  grantsOf: (assetId: string) => AssetGrants;
  /**
   * パネルで変えた権限と通信先を、このページで適用中のアセットへ反映する(狭める方向だけ)
   *
   * ファサードは呼び出しのたびに現在値を読むため、取り消しは次のAPI呼び出しから効く。
   * 付与は再読み込みしてから効かせる(docs/13 3-7章)
   */
  updateGrants: (assets: readonly Asset[]) => void;
  /**
   * パネルで無効・ミュート・削除などにしたアセットを、このページで評価しないようにする
   *
   * 一度外したものはこのページでは戻さない(後の画面遷移で、評価前のJSを評価しない)
   */
  revoke: (assetIds: Iterable<string>) => void;
  /** 評価してよいアセットだけを、現在の権限を重ねて返します */
  current: (assets: readonly Asset[]) => Asset[];
  /** 取得して、このページで適用すると決めたアセット(実行順) */
  loaded: () => readonly Asset[];
  /** いま`<style>`を付けるべきCSSアセット(実行順) */
  activeCss: () => readonly Asset[];
  setActiveCss: (assets: readonly Asset[]) => void;
};

const createAssetRegistry = (): AssetRegistry => {
  const assets = new Map<string, Asset>();
  const ranks = new Map<string, number>();
  const grants = new Map<string, AssetGrants>();
  const revoked = new Set<string>();
  let activeCss: readonly Asset[] = [];
  let loaded: readonly Asset[] = [];
  return {
    register: (list) => {
      loaded = list;
      list.forEach((asset, index) => {
        assets.set(asset.id, asset);
        ranks.set(asset.id, index);
        grants.set(asset.id, { permissions: asset.permissions, externalUrls: asset.externalUrls });
      });
      activeCss = list.filter((asset) => asset.kind === 'css');
    },
    get: (assetId) => assets.get(assetId),
    rankOf: (assetId) => ranks.get(assetId) ?? Number.MAX_SAFE_INTEGER,
    grantsOf: (assetId) => grants.get(assetId) ?? { permissions: [], externalUrls: [] },
    updateGrants: (list) => {
      for (const asset of list) {
        const current = grants.get(asset.id);
        if (current !== undefined) {
          grants.set(asset.id, narrowGrants(current, asset));
        }
      }
    },
    revoke: (ids) => {
      for (const id of ids) revoked.add(id);
    },
    current: (list) =>
      list.flatMap((asset) => {
        if (revoked.has(asset.id)) return [];
        const current = grants.get(asset.id);
        return [current === undefined ? asset : { ...asset, ...current }];
      }),
    loaded: () => loaded,
    activeCss: () => activeCss,
    setActiveCss: (list) => {
      activeCss = list;
    },
  };
};

/**
 * パネルの一覧で、このページでは適用しなくなった(無効・ミュート・自分の画面の対象外)か
 * コードを書き換えたアセットを、評価対象から外す
 *
 * 評価済みのJSは取り消せないが、後の画面遷移で評価前のJSを評価しないようにする
 */
const revokeByPanel = (
  registry: AssetRegistry,
  panelAssets: readonly Asset[],
  context: ApplyContext
): void =>
  registry.revoke(
    panelAssets
      .filter((asset) => {
        const loaded = registry.get(asset.id);
        return loaded !== undefined && (!shouldApply(asset, context) || asset.code !== loaded.code);
      })
      .map((asset) => asset.id)
  );

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
  /**
   * 取得が終わった時点の、パネルでの変更
   *
   * 取得中にパネルで無効にしたものを、取得後に実行・適用しないため、取得を始めた時点ではなく終わった時点の値で絞る
   */
  currentPanelChanges: () => PanelChanges | null;
}): Promise<GateLoadResult> => {
  const { common, applyContext, origin, registry, diagnostics, currentPanelChanges } = params;
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
    const changes = currentPanelChanges();
    const context = { ...applyContext, mutedIds: changes?.mutedIds ?? applyContext.mutedIds };
    const disabledInPanel = new Set(
      (changes?.assets ?? []).filter((asset) => !asset.enabled).map((asset) => asset.id)
    );
    const assets = result.assets.filter((asset) => {
      if (!shouldApply(asset, context) || disabledInPanel.has(asset.id)) {
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
    if (changes !== null) {
      registry.updateGrants(changes.assets);
      revokeByPanel(registry, changes.assets, context);
      registry.setActiveCss(
        selectApplicableCss(mergePanelAssets(assets, changes.assets), context, origin)
      );
    }
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
 * @param onChange 適用状況が変わったとき(取得完了・評価・パネルでの切り替え)に呼ぶ
 */
export const startRuntime = (params: {
  common: PluginCommonConfig;
  applyContext: ApplyContext;
  diagnostics: Diagnostics;
  status: RuntimeStatus;
  onChange: () => void;
}): RuntimeController => {
  const { common, applyContext, diagnostics, status, onChange } = params;
  const origin = location.origin;
  const registry = createAssetRegistry();
  let panelChanges: PanelChanges | null = null;
  const load = loadApplicableAssets({
    common,
    applyContext,
    origin,
    registry,
    diagnostics,
    currentPanelChanges: () => panelChanges,
  }).then((result) => {
    status.loaded = result.status === 'ok';
    onChange();
    return result;
  });
  const bridge = createRuntimeBridge(registry, diagnostics);
  const runner = createRuntimeRunner({
    registry,
    bridge,
    diagnostics,
    origin,
    target: applyContext.target,
  });
  const injector = createInjector(document as unknown as DocumentLike);
  let currentScreen: AssetScreen | null = null;
  let cssApplied = false;

  const applyCss = (screen: AssetScreen) => {
    injector.sync(registry.activeCss(), screen);
    cssApplied = true;
  };

  const gate = createLaunchGate({
    load,
    timeoutMs: GATE_TIMEOUT_MS,
    setTimer: (callback, ms) => {
      const id = window.setTimeout(callback, ms);
      return () => window.clearTimeout(id);
    },
    // CSSはパネルでの切り替えを反映した台帳から付ける(ページ内の画面遷移で、無効にしたCSSを戻さない)
    prepare: (assets, screen) => {
      applyCss(screen);
      // 取得時点のアセットではなく、パネルで外したもの・狭めた権限を反映したもので評価する
      runner.evaluatePending(registry.current(assets), screen);
      onChange();
    },
    applyCssOnly: (_assets, screen) => {
      applyCss(screen);
      onChange();
    },
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
  kintone.events.on([...SHOW_EVENT_TYPES], (event) => {
    currentScreen = toScreen(String(event.type)) ?? currentScreen;
    return gate.handleShow(event);
  });

  return {
    applied: () => ({
      js: runner.evaluatedIds(),
      css: new Set(cssApplied ? registry.activeCss().map((asset) => asset.id) : []),
    }),
    applyPanelChanges: (assets, mutedIds) => {
      panelChanges = { assets, mutedIds };
      // 取得前なら、取得が終わった時点でこの変更を使って絞る
      if (!status.loaded) {
        return;
      }
      registry.updateGrants(assets);
      revokeByPanel(registry, assets, { ...applyContext, mutedIds });
      // パネルの一覧に無いもの(一覧が古い)は、取得したものを残す
      registry.setActiveCss(
        selectApplicableCss(
          mergePanelAssets(registry.loaded(), assets),
          { ...applyContext, mutedIds },
          origin
        )
      );
      if (currentScreen !== null && cssApplied) {
        applyCss(currentScreen);
      }
      onChange();
    },
  };
};

import { type AssetGrants, isExternalTargetAllowed } from './asset-filter';
import type { EventBridge } from './event-bridge';
import { describeExternalTarget } from './external-target';
import {
  classifyKintoneRequest,
  hasAnyWritePermission,
  isGranted,
  normalizeKintonePath,
} from './kintone-request-classifier';
import { type PermissionDenial, PermissionDeniedError } from './permission-error';

/**
 * アセットへ渡す`kintone`ファサード
 *
 * 本物の`kintone`のプロパティを写した新しいオブジェクトで、次のメンバーだけを差し替える。
 *
 * - 本物をプロトタイプに持たせない。`Object.getPrototypeOf(kintone).api(...)`で判定を素通りできてしまうため。
 *   入れ子の`events` / `plugin` / `plugin.app`も同じく写す
 * - `Proxy`は使わない(本物のプロパティが凍結されていると、getで別の値を返したときに不変条件違反になるため)
 * - 差し替えない関数は参照のまま写す(`bind`すると`kintone.Promise.all`のような静的メンバーが消える)。
 *   `this`を使う関数も、ファサードが同じメンバーを持つため動く
 *
 * | メンバー | 差し替え後 |
 * | `events.on/off` | イベントブリッジへ、アセットIDつきで登録・解除 |
 * | `api` | 権限を判定してから本物へ委譲 |
 * | `proxy` / `proxy.upload` | 外部通信の設定と通信先で判定してから委譲 |
 * | `plugin.app.proxy` / `.upload` | 常に拒否 |
 * | `getRequestToken` | 書き込み系権限が無ければ拒否 |
 *
 * これは安全装置であって、檻ではない。`window.kintone`を使えば本物へ届く(静的検出で扱う)。
 *
 * @see docs/05-runtime.md 4-5章
 */

type AnyFunction = (...args: unknown[]) => unknown;

/** ファサードが必要とする、本物の`kintone`の最小形 */
export type KintoneGlobal = {
  events: { on: AnyFunction; off: AnyFunction };
  api: AnyFunction & Record<string, unknown>;
  proxy: AnyFunction & { upload: AnyFunction };
  plugin: { app: Record<string, unknown> };
  getRequestToken: () => string;
};

export type AssetKintoneOptions = {
  real: KintoneGlobal;
  assetId: string;
  bridge: EventBridge;
  /** 呼び出し時点の権限。パネルで変更されたら、次の呼び出しから反映される */
  getGrants: () => AssetGrants;
  /** kintoneのオリジン(`location.origin`) */
  origin: string;
  onDenied: (error: PermissionDeniedError) => void;
  /** 拒否エラーのメッセージ */
  describeDenial: (denial: PermissionDenial) => string;
};

const isFunction = (value: unknown): value is AnyFunction => typeof value === 'function';

/** 関数オブジェクトが元から持つ、写してはいけないプロパティ */
const INTRINSIC_FUNCTION_KEYS = new Set(['length', 'name', 'prototype', 'arguments', 'caller']);

/**
 * 本物の関数オブジェクトが持つプロパティ(`api.url`など)を、thisを保ったまま写します
 *
 * 列挙不可のプロパティも拾うため`getOwnPropertyNames`を使う
 */
const copyFunctionProperties = (
  target: AnyFunction,
  source: Record<string, unknown>
): AnyFunction & Record<string, unknown> =>
  Object.assign(
    target,
    Object.fromEntries(
      Object.getOwnPropertyNames(source)
        .filter((key) => !INTRINSIC_FUNCTION_KEYS.has(key))
        .map((key) => {
          const value = source[key];
          return [key, isFunction(value) ? value.bind(source) : value];
        })
    )
  );

/** 写してはいけない、オブジェクトの基本的なプロパティ */
const INTRINSIC_OBJECT_KEYS = new Set(['constructor', '__proto__']);

/** プロトタイプチェーン上のプロパティ名(`Object.prototype`は除く)を集めます */
const collectPropertyNames = (source: object): string[] => {
  const names = new Set<string>();
  for (
    let current: object | null = source;
    current !== null && current !== Object.prototype;
    current = Object.getPrototypeOf(current)
  ) {
    for (const name of Object.getOwnPropertyNames(current)) {
      if (!INTRINSIC_OBJECT_KEYS.has(name)) names.add(name);
    }
  }
  return [...names];
};

/**
 * 本物のオブジェクトのプロパティを、プロトタイプを引き継がない新しいオブジェクトへ写します
 *
 * 値は参照のまま写す。`overrides`で指定したメンバーは差し替える
 */
const snapshot = (source: object, overrides: Record<string, unknown>): Record<string, unknown> => {
  const record = source as Record<string, unknown>;
  const copied = Object.fromEntries(
    collectPropertyNames(source)
      .filter((key) => !(key in overrides))
      .map((key) => [key, record[key]])
  );
  return { ...copied, ...overrides };
};

/** `kintone.api`の対象を、クエリを除いたパスで表します */
const describeApiTarget = (pathOrUrl: unknown, origin: string): string | null =>
  typeof pathOrUrl === 'string'
    ? (normalizeKintonePath(pathOrUrl, origin) ?? '(other origin)')
    : null;

export const createAssetKintone = (options: AssetKintoneOptions): KintoneGlobal => {
  const { real, assetId, bridge, getGrants, origin } = options;

  /**
   * 拒否します
   *
   * コールバック形式の呼び出しには失敗コールバックを非同期で呼び、Promise形式にはrejectを返す
   * (本物の`kintone.api`と同じ受け取り方でアセット側が扱えるようにする)
   */
  const deny = (denial: Omit<PermissionDenial, 'assetId'>, callbacks: unknown[]): unknown => {
    const error = new PermissionDeniedError(
      { ...denial, assetId },
      options.describeDenial({ ...denial, assetId })
    );
    options.onDenied(error);
    if (callbacks.some(isFunction)) {
      const failure = callbacks[1];
      queueMicrotask(() => {
        if (isFunction(failure)) failure(error);
      });
      return undefined;
    }
    return Promise.reject(error);
  };

  const api = copyFunctionProperties((...args: unknown[]) => {
    const [pathOrUrl, method, params, success, failure] = args;
    const required = classifyKintoneRequest(pathOrUrl, method, params, origin);
    if (!isGranted(required, getGrants().permissions)) {
      return deny(
        {
          operation: 'kintone.api',
          required,
          method: typeof method === 'string' ? method.toUpperCase() : null,
          target: describeApiTarget(pathOrUrl, origin),
        },
        [success, failure]
      );
    }
    return real.api(...args);
  }, real.api);

  /** `kintone.proxy(url, method, headers, data, success, failure)`の形の関数を包みます */
  const guardProxy =
    (original: AnyFunction) =>
    (...args: unknown[]) => {
      const [url, method, , , success, failure] = args;
      const target = typeof url === 'string' ? url : null;
      if (!isExternalTargetAllowed(getGrants(), target)) {
        return deny(
          {
            operation: 'kintone.proxy',
            required: [],
            method: typeof method === 'string' ? method.toUpperCase() : null,
            target: target === null ? null : describeExternalTarget(target),
          },
          [success, failure]
        );
      }
      return original(...args);
    };

  const proxy = Object.assign(guardProxy(real.proxy.bind(real)), {
    upload: guardProxy(real.proxy.upload.bind(real.proxy)),
  });

  /**
   * 本プラグインのAI用endpointを含め、他プラグインの認証済みproxyを流用させない
   *
   * `kintone.plugin.app.proxy(pluginId, url, method, headers, data, success, failure)`
   */
  const denyPluginProxy = (...args: unknown[]) =>
    deny({ operation: 'kintone.plugin.app.proxy', required: [], method: null, target: null }, [
      args[5],
      args[6],
    ]);
  const plugin = snapshot(real.plugin, {
    app: snapshot(real.plugin.app, {
      proxy: Object.assign(denyPluginProxy, { upload: denyPluginProxy }),
    }),
  });

  const getRequestToken = () => {
    if (!hasAnyWritePermission(getGrants().permissions)) {
      const denial: PermissionDenial = {
        assetId,
        operation: 'kintone.getRequestToken',
        required: [],
        method: null,
        target: null,
      };
      const error = new PermissionDeniedError(denial, options.describeDenial(denial));
      options.onDenied(error);
      throw error;
    }
    return real.getRequestToken();
  };

  const events = snapshot(real.events, {
    on: (types: unknown, handler: unknown) => bridge.on(assetId, types, handler),
    off: (types?: unknown, handler?: unknown) => bridge.off(assetId, types, handler),
  });

  return snapshot(real, { events, api, proxy, plugin, getRequestToken }) as KintoneGlobal;
};

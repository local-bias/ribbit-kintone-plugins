import type { AssetScreen } from '@/schema/asset';

/**
 * アセットのイベントハンドラを、持ち主(アセットID)つきで管理するイベントバス
 *
 * - show系4イベントのnative handlerは起動ゲートが読み込み時に同期登録する
 * - それ以外は、アセットが購読した時点で、そのexact typeのnative handlerを1回だけ登録する
 * - 購読者が0件なら、eventをそのまま同期で返す(保存処理へ割り込まない)
 * - リプレイはしない
 *
 * @see docs/05-runtime.md 3章
 */

export const SHOW_EVENT_TYPES = [
  'app.record.index.show',
  'app.record.detail.show',
  'app.record.create.show',
  'app.record.edit.show',
] as const;
export type ShowEventType = (typeof SHOW_EVENT_TYPES)[number];

/** show以外で、アセットが購読できるexact typeのイベント */
const FIXED_EVENT_TYPES = new Set<string>([
  ...SHOW_EVENT_TYPES,
  'app.record.create.submit',
  'app.record.create.submit.success',
  'app.record.edit.submit',
  'app.record.edit.submit.success',
  'app.record.detail.delete.submit',
  'app.record.detail.process.proceed',
  'app.record.index.edit.show',
  'app.record.index.edit.submit',
  'app.record.index.delete.submit',
]);

/** フィールドの変更イベント。フィールドコードまで含むexact typeだけを受け付ける */
const CHANGE_EVENT_PATTERN = /^app\.record\.(create|edit|index\.edit)\.change\.(\S.*)$/;

export const isShowEventType = (type: string): type is ShowEventType =>
  (SHOW_EVENT_TYPES as readonly string[]).includes(type);

/** アセットが購読してよいイベント名か */
export const isAllowedEventType = (type: unknown): type is string =>
  typeof type === 'string' && (FIXED_EVENT_TYPES.has(type) || CHANGE_EVENT_PATTERN.test(type));

const isChangeEvent = (type: string): boolean => CHANGE_EVENT_PATTERN.test(type);

/** `false`を返すと処理を止められるイベント */
const isCancelableEvent = (type: string): boolean =>
  /\.submit$/.test(type) || type === 'app.record.detail.process.proceed';

/** イベント名から、アセットの適用画面の判定に使う画面種別を返します */
export const toScreen = (type: string): AssetScreen | null => {
  const match = /^app\.record\.(index|detail|create|edit)\./.exec(type);
  return (match?.[1] as AssetScreen | undefined) ?? null;
};

export type BridgeHandler = (event: unknown) => unknown;
export type KintoneEventObject = Record<string, unknown> & { type?: unknown; error?: unknown };

export type EventBridgeOptions = {
  /** show以外のexact typeのnative handlerをkintoneへ登録する */
  registerNative: (type: string, handler: (event: KintoneEventObject) => unknown) => void;
  /** そのアセットへ配信してよいか(適用画面、サーキットブレーカー) */
  canDeliver: (assetId: string, type: string) => boolean;
  /** アセットの実行順。小さいほど先に呼ぶ */
  rankOf: (assetId: string) => number;
  onHandlerError: (assetId: string, type: string, error: unknown) => void;
  onRejectedType: (assetId: string, type: unknown) => void;
  /** Promiseに対応していないイベントでthenableが返された */
  onIgnoredThenable: (assetId: string, type: string) => void;
  /** 保存系のハンドラが例外を投げたときに、利用者へ見せる一般向けの文言 */
  submitErrorMessage: string;
};

export type EventBridge = {
  on: (assetId: string, types: unknown, handler: unknown) => void;
  off: (assetId: string, types?: unknown, handler?: unknown) => boolean;
  dispatch: (type: string, event: KintoneEventObject) => unknown;
  /** 購読されているイベント名(診断用) */
  subscribedTypes: () => string[];
};

type Subscription = { assetId: string; type: string; handler: BridgeHandler; sequence: number };

const isThenable = (value: unknown): value is PromiseLike<unknown> =>
  typeof (value as PromiseLike<unknown> | null)?.then === 'function';

const toTypeList = (types: unknown): unknown[] => (Array.isArray(types) ? types : [types]);

type Step = { stop: true; value: unknown } | { stop: false; event: KintoneEventObject };

export const createEventBridge = (options: EventBridgeOptions): EventBridge => {
  let subscriptions: Subscription[] = [];
  let sequence = 0;
  const nativeTypes = new Set<string>(SHOW_EVENT_TYPES);

  const on: EventBridge['on'] = (assetId, types, handler) => {
    if (typeof handler !== 'function') {
      options.onRejectedType(assetId, types);
      return;
    }
    for (const type of toTypeList(types)) {
      if (!isAllowedEventType(type)) {
        options.onRejectedType(assetId, type);
        continue;
      }
      if (!nativeTypes.has(type)) {
        nativeTypes.add(type);
        options.registerNative(type, (event) => dispatch(type, event));
      }
      subscriptions = [
        ...subscriptions,
        { assetId, type, handler: handler as BridgeHandler, sequence: sequence++ },
      ];
    }
  };

  const off: EventBridge['off'] = (assetId, types, handler) => {
    const typeList = types === undefined ? null : toTypeList(types);
    const remaining = subscriptions.filter(
      (subscription) =>
        subscription.assetId !== assetId ||
        (typeList !== null && !typeList.includes(subscription.type)) ||
        (handler !== undefined && subscription.handler !== handler)
    );
    const removed = remaining.length !== subscriptions.length;
    subscriptions = remaining;
    return removed;
  };

  /** ハンドラの戻り値を、次のハンドラへ渡すeventへ反映します */
  const applyResult = (type: string, result: unknown, current: KintoneEventObject): Step => {
    if (result === false && isCancelableEvent(type)) {
      return { stop: true, value: false };
    }
    if (typeof result === 'object' && result !== null) {
      return { stop: false, event: result as KintoneEventObject };
    }
    return { stop: false, event: current };
  };

  /**
   * ハンドラの例外を処理します
   *
   * 保存系では、アセットが担う入力検証を障害時だけ迂回しないよう保存を止める(fail closed。ADR-23)。
   * 例外の中身は一般利用者へ見せず、診断へ送る。
   */
  const handleError = (
    subscription: Subscription,
    error: unknown,
    current: KintoneEventObject
  ): Step => {
    options.onHandlerError(subscription.assetId, subscription.type, error);
    if (isCancelableEvent(subscription.type)) {
      // kintoneのイベントAPIは、受け取ったeventへ`error`を設定して返す契約のため、ここだけは書き換える
      current.error = options.submitErrorMessage;
      return { stop: true, value: current };
    }
    return { stop: false, event: current };
  };

  const runChain = (
    type: string,
    chain: Subscription[],
    start: number,
    event: KintoneEventObject
  ): unknown => {
    let current = event;
    for (let index = start; index < chain.length; index++) {
      const subscription = chain[index] as Subscription;
      let result: unknown;
      try {
        result = subscription.handler(current);
      } catch (error) {
        const step = handleError(subscription, error, current);
        if (step.stop) return step.value;
        continue;
      }

      if (isThenable(result)) {
        if (isChangeEvent(type)) {
          // changeイベントはPromiseに対応しないため、待たずに直前のeventで続ける
          options.onIgnoredThenable(subscription.assetId, type);
          Promise.resolve(result).catch((error: unknown) =>
            options.onHandlerError(subscription.assetId, type, error)
          );
          continue;
        }
        const base = current;
        return Promise.resolve(result).then(
          (resolved) => {
            const step = applyResult(type, resolved, base);
            return step.stop ? step.value : runChain(type, chain, index + 1, step.event);
          },
          (error: unknown) => {
            const step = handleError(subscription, error, base);
            return step.stop ? step.value : runChain(type, chain, index + 1, step.event);
          }
        );
      }

      const step = applyResult(type, result, current);
      if (step.stop) return step.value;
      current = step.event;
    }
    return current;
  };

  const dispatch: EventBridge['dispatch'] = (type, event) => {
    const chain = subscriptions
      .filter(
        (subscription) =>
          subscription.type === type && options.canDeliver(subscription.assetId, type)
      )
      .sort(
        (a, b) => options.rankOf(a.assetId) - options.rankOf(b.assetId) || a.sequence - b.sequence
      );
    if (chain.length === 0) {
      return event;
    }
    return runChain(type, chain, 0, event);
  };

  const subscribedTypes = () => [
    ...new Set(subscriptions.map((subscription) => subscription.type)),
  ];

  return { on, off, dispatch, subscribedTypes };
};

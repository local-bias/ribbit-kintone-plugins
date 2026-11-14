import type { Asset, AssetScreen } from '@/schema/asset';
import type { AssetLoadError } from './asset-repository';
import { type KintoneEventObject, toScreen } from './event-bridge';

/**
 * 起動ゲート
 *
 * show系のnative handlerから呼ばれる。アセットの取得が終わっていなければPromiseを返して待ち、
 * 終わっていれば同期で処理する(取得がshowより先に終わった場合は、showの完了を1msも遅らせない)。
 *
 * - 取得完了: CSSを適用し、この画面向けの未評価JSを評価してから、showをアセットへ配信する
 * - タイムアウト: eventをそのまま返す。そのページではJSを評価しない。遅れて届いたCSSだけ適用する
 * - 取得失敗: 何も適用しない
 *
 * 同期でなければならないのはハンドラの登録であって、コードの取得ではない(ADR-33)。
 *
 * @see docs/05-runtime.md 2章
 */

export type GateLoadResult =
  | { status: 'ok'; assets: Asset[] }
  | { status: 'error'; error: AssetLoadError };

export type LaunchGateOptions = {
  load: Promise<GateLoadResult>;
  timeoutMs: number;
  /** タイマーを設定し、解除する関数を返す */
  setTimer: (callback: () => void, ms: number) => () => void;
  /** CSSを適用し、この画面向けの未評価JSを評価する */
  prepare: (assets: readonly Asset[], screen: AssetScreen) => void;
  /** CSSだけを適用する(タイムアウト後に届いた場合) */
  applyCssOnly: (assets: readonly Asset[], screen: AssetScreen) => void;
  dispatch: (type: string, event: KintoneEventObject) => unknown;
  onTimeout: () => void;
  onLoadError: (error: AssetLoadError) => void;
  /** ゲート自身の不具合(アセットの例外ではない)を記録する */
  onInternalError: (error: unknown) => void;
};

export type LaunchGate = {
  handleShow: (event: KintoneEventObject) => unknown;
};

type Phase =
  | { name: 'loading' }
  | { name: 'ready'; assets: Asset[] }
  | { name: 'failed' }
  | { name: 'timed-out' }
  | { name: 'timed-out-ready'; assets: Asset[] };

export const createLaunchGate = (options: LaunchGateOptions): LaunchGate => {
  let phase: Phase = { name: 'loading' };
  let lastScreen: AssetScreen | null = null;
  let waiting: Promise<void> | null = null;

  const settled = options.load.then(
    (result) => {
      if (result.status === 'error') {
        if (phase.name === 'loading' || phase.name === 'timed-out') {
          phase = { name: 'failed' };
          options.onLoadError(result.error);
        }
        return;
      }
      if (phase.name === 'loading') {
        phase = { name: 'ready', assets: result.assets };
      } else if (phase.name === 'timed-out') {
        phase = { name: 'timed-out-ready', assets: result.assets };
        if (lastScreen !== null) {
          options.applyCssOnly(result.assets, lastScreen);
        }
      }
    },
    (error: unknown) => {
      phase = { name: 'failed' };
      options.onInternalError(error);
    }
  );

  /** 取得完了かタイムアウトのどちらか早いほうを待ちます。タイマーはページで1つだけ */
  const waitForLoad = (): Promise<void> => {
    waiting ??= new Promise<void>((resolve) => {
      const cancel = options.setTimer(() => {
        if (phase.name === 'loading') {
          phase = { name: 'timed-out' };
          options.onTimeout();
        }
        resolve();
      }, options.timeoutMs);
      void settled.then(() => {
        // 解除の失敗で待ちを延ばさないよう、先に待ちを終わらせる
        resolve();
        cancel();
      });
    });
    return waiting;
  };

  const handleSettled = (event: KintoneEventObject, screen: AssetScreen): unknown => {
    switch (phase.name) {
      case 'ready':
        options.prepare(phase.assets, screen);
        return options.dispatch(String(event.type), event);
      case 'timed-out-ready':
        options.applyCssOnly(phase.assets, screen);
        return event;
      default:
        return event;
    }
  };

  /** ゲートの不具合で画面を止めないよう、必ずeventを返します */
  const safely = (event: KintoneEventObject, run: () => unknown): unknown => {
    try {
      const result = run();
      if (typeof (result as PromiseLike<unknown> | null)?.then === 'function') {
        return Promise.resolve(result).catch((error: unknown) => {
          options.onInternalError(error);
          return event;
        });
      }
      return result;
    } catch (error) {
      options.onInternalError(error);
      return event;
    }
  };

  const handleShow: LaunchGate['handleShow'] = (event) =>
    safely(event, () => {
      const screen = toScreen(String(event.type));
      if (screen === null) {
        return event;
      }
      lastScreen = screen;
      if (phase.name !== 'loading') {
        return handleSettled(event, screen);
      }
      return waitForLoad().then(() => safely(event, () => handleSettled(event, screen)));
    });

  return { handleShow };
};

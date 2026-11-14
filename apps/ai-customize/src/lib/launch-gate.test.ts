import { describe, expect, test, vi } from 'vitest';
import type { Asset } from '@/schema/asset';
import { createTestAsset } from '@/test/fixtures';
import type { KintoneEventObject } from './event-bridge';
import { createLaunchGate, type GateLoadResult, type LaunchGateOptions } from './launch-gate';

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const setup = (load: Promise<GateLoadResult>) => {
  const timers: (() => void)[] = [];
  const cancelTimer = vi.fn();
  const options: LaunchGateOptions = {
    load,
    timeoutMs: 3000,
    setTimer: vi.fn((callback) => {
      timers.push(callback);
      return cancelTimer;
    }),
    prepare: vi.fn(),
    applyCssOnly: vi.fn(),
    dispatch: vi.fn((_type, event) => ({ ...event, dispatched: true })),
    onTimeout: vi.fn(),
    onLoadError: vi.fn(),
    onInternalError: vi.fn(),
  };
  return {
    cancelTimer,
    gate: createLaunchGate(options),
    options,
    fireTimeout: () => {
      for (const timer of timers) timer();
    },
  };
};

const show = (type = 'app.record.detail.show'): KintoneEventObject => ({ type, record: {} });

const assets: Asset[] = [createTestAsset({ id: '1' })];

describe('createLaunchGate', () => {
  test('取得前の show は Promise を返し、取得後に準備してから配信する', async () => {
    const load = deferred<GateLoadResult>();
    const { gate, options } = setup(load.promise);
    const result = gate.handleShow(show());
    expect(result).toBeInstanceOf(Promise);
    expect(options.prepare).not.toHaveBeenCalled();

    load.resolve({ status: 'ok', assets });
    await expect(result).resolves.toMatchObject({ dispatched: true });
    expect(options.prepare).toHaveBeenCalledWith(assets, 'detail');
  });

  test('取得が show より先に終わっていれば、同期で処理する', async () => {
    const { gate, options } = setup(Promise.resolve({ status: 'ok', assets }));
    await flush();
    const result = gate.handleShow(show('app.record.edit.show'));
    expect(result).not.toBeInstanceOf(Promise);
    expect(result).toMatchObject({ dispatched: true });
    expect(options.prepare).toHaveBeenCalledWith(assets, 'edit');
  });

  test('画面が切り替わるたびに、その画面向けの準備をする', async () => {
    const { gate, options } = setup(Promise.resolve({ status: 'ok', assets }));
    await flush();
    gate.handleShow(show('app.record.detail.show'));
    gate.handleShow(show('app.record.edit.show'));
    gate.handleShow(show('app.record.detail.show'));
    expect(vi.mocked(options.prepare).mock.calls.map(([, screen]) => screen)).toEqual([
      'detail',
      'edit',
      'detail',
    ]);
  });

  test('タイムアウトしたら event をそのまま返し、以降の show も待たない', async () => {
    const load = deferred<GateLoadResult>();
    const { gate, options, fireTimeout } = setup(load.promise);
    const event = show();
    const result = gate.handleShow(event);
    fireTimeout();
    await expect(result).resolves.toBe(event);
    expect(options.onTimeout).toHaveBeenCalledTimes(1);
    expect(options.dispatch).not.toHaveBeenCalled();

    const next = show('app.record.edit.show');
    expect(gate.handleShow(next)).toBe(next);
  });

  test('タイムアウト後に届いたら、CSSだけ適用し JS は評価しない', async () => {
    const load = deferred<GateLoadResult>();
    const { gate, options, fireTimeout } = setup(load.promise);
    const pending = gate.handleShow(show('app.record.detail.show'));
    fireTimeout();
    await pending;

    load.resolve({ status: 'ok', assets });
    await flush();
    expect(options.applyCssOnly).toHaveBeenCalledWith(assets, 'detail');

    const event = show('app.record.edit.show');
    expect(gate.handleShow(event)).toBe(event);
    expect(options.applyCssOnly).toHaveBeenLastCalledWith(assets, 'edit');
    expect(options.prepare).not.toHaveBeenCalled();
    expect(options.dispatch).not.toHaveBeenCalled();
  });

  test('取得に失敗したら何も適用せずに event を返す', async () => {
    const error = { reason: 'request-failed' as const, message: 'forbidden' };
    const { gate, options } = setup(Promise.resolve({ status: 'error', error }));
    const event = show();
    await expect(gate.handleShow(event)).resolves.toBe(event);
    expect(options.onLoadError).toHaveBeenCalledWith(error);
    expect(options.prepare).not.toHaveBeenCalled();
  });

  test('準備中に例外が出ても event を返す', async () => {
    const { gate, options } = setup(Promise.resolve({ status: 'ok', assets }));
    vi.mocked(options.prepare).mockImplementation(() => {
      throw new Error('bug');
    });
    const event = show();
    await expect(gate.handleShow(event)).resolves.toBe(event);
    expect(options.onInternalError).toHaveBeenCalled();
  });

  test('配信の Promise が reject しても event を返す', async () => {
    const { gate, options } = setup(Promise.resolve({ status: 'ok', assets }));
    await flush();
    vi.mocked(options.dispatch).mockReturnValue(Promise.reject(new Error('bug')));
    const event = show();
    await expect(gate.handleShow(event)).resolves.toBe(event);
  });

  test('タイムアウトより先に取得できたらタイマーを解除する', async () => {
    const load = deferred<GateLoadResult>();
    const { gate, cancelTimer } = setup(load.promise);
    const pending = gate.handleShow(show());
    load.resolve({ status: 'ok', assets });
    await pending;
    expect(cancelTimer).toHaveBeenCalledTimes(1);
  });

  test('タイマーはページで1つだけ使う', () => {
    const { gate, options } = setup(new Promise(() => undefined));
    gate.handleShow(show());
    gate.handleShow(show('app.record.edit.show'));
    expect(options.setTimer).toHaveBeenCalledTimes(1);
  });

  test('show 以外の型は何もせず返す', () => {
    const { gate } = setup(new Promise(() => undefined));
    const event = { type: 'portal.show' };
    expect(gate.handleShow(event)).toBe(event);
  });
});

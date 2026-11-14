import { describe, expect, test, vi } from 'vitest';
import {
  createEventBridge,
  type EventBridgeOptions,
  isAllowedEventType,
  type KintoneEventObject,
  toScreen,
} from './event-bridge';

const SUBMIT_ERROR = '保存前の処理でエラーが発生しました';

const setup = (overrides: Partial<EventBridgeOptions> = {}) => {
  const natives = new Map<string, (event: KintoneEventObject) => unknown>();
  const options: EventBridgeOptions = {
    registerNative: vi.fn((type, handler) => natives.set(type, handler)),
    canDeliver: () => true,
    rankOf: (assetId) => Number(assetId),
    onHandlerError: vi.fn(),
    onRejectedType: vi.fn(),
    onIgnoredThenable: vi.fn(),
    submitErrorMessage: SUBMIT_ERROR,
    ...overrides,
  };
  return { bridge: createEventBridge(options), options, natives };
};

const event = (type: string, extra: Record<string, unknown> = {}): KintoneEventObject => ({
  type,
  record: {},
  ...extra,
});

describe('isAllowedEventType / toScreen', () => {
  test.each([
    ['app.record.detail.show', true],
    ['app.record.edit.submit', true],
    ['app.record.create.change.Amount', true],
    ['app.record.index.edit.change.金額', true],
    ['app.record.edit.change.', false],
    ['app.record.edit.change', false],
    ['app.record.print.show', false],
    ['mobile.app.record.detail.show', false],
    ['portal.show', false],
  ])('%s -> %s', (type, expected) => {
    expect(isAllowedEventType(type)).toBe(expected);
  });

  test.each([
    ['app.record.index.edit.submit', 'index'],
    ['app.record.detail.process.proceed', 'detail'],
    ['app.record.create.change.A', 'create'],
    ['portal.show', null],
  ])('%s の画面は %s', (type, screen) => {
    expect(toScreen(type)).toBe(screen);
  });
});

describe('createEventBridge', () => {
  test('購読者が0件なら event をそのまま同期で返す', () => {
    const { bridge } = setup();
    const target = event('app.record.detail.show');
    expect(bridge.dispatch('app.record.detail.show', target)).toBe(target);
  });

  test('show は native 登録しない。show 以外は type ごとに1回だけ native 登録する', () => {
    const { bridge, options } = setup();
    bridge.on('1', 'app.record.detail.show', () => undefined);
    bridge.on('1', 'app.record.edit.submit', () => undefined);
    bridge.on('2', ['app.record.edit.submit', 'app.record.edit.change.A'], () => undefined);
    expect(options.registerNative).toHaveBeenCalledTimes(2);
    expect(vi.mocked(options.registerNative).mock.calls.map(([type]) => type)).toEqual([
      'app.record.edit.submit',
      'app.record.edit.change.A',
    ]);
  });

  test('未知のイベントと関数でないハンドラは登録を拒否する', () => {
    const { bridge, options } = setup();
    bridge.on('1', 'app.record.edit.change.', () => undefined);
    bridge.on('1', 'app.record.detail.show', 'not a function');
    expect(options.onRejectedType).toHaveBeenCalledTimes(2);
    expect(bridge.subscribedTypes()).toEqual([]);
  });

  test('実行順(rank)→登録順に直列実行し、返された event を次へ渡す', () => {
    const { bridge } = setup();
    const calls: string[] = [];
    bridge.on('2', 'app.record.create.show', (e: unknown) => {
      calls.push('2');
      return { ...(e as object), second: true };
    });
    bridge.on('1', 'app.record.create.show', (e: unknown) => {
      calls.push('1');
      return { ...(e as object), first: true };
    });
    const result = bridge.dispatch('app.record.create.show', event('app.record.create.show'));
    expect(calls).toEqual(['1', '2']);
    expect(result).toMatchObject({ first: true, second: true });
  });

  test('undefined を返したら直前の event を維持する', () => {
    const { bridge } = setup();
    bridge.on('1', 'app.record.create.show', (e: unknown) => ({ ...(e as object), a: 1 }));
    bridge.on('2', 'app.record.create.show', () => undefined);
    expect(
      bridge.dispatch('app.record.create.show', event('app.record.create.show'))
    ).toMatchObject({
      a: 1,
    });
  });

  test('Promise を返したら待ってから次へ進み、Promise を返す', async () => {
    const { bridge } = setup();
    bridge.on('1', 'app.record.edit.show', async (e: unknown) => ({ ...(e as object), a: 1 }));
    bridge.on('2', 'app.record.edit.show', (e: unknown) => ({ ...(e as object), b: 2 }));
    const result = bridge.dispatch('app.record.edit.show', event('app.record.edit.show'));
    expect(result).toBeInstanceOf(Promise);
    await expect(result).resolves.toMatchObject({ a: 1, b: 2 });
  });

  test('submit で false を返したら以降を実行せず false を返す', () => {
    const { bridge } = setup();
    const after = vi.fn();
    bridge.on('1', 'app.record.edit.submit', () => false);
    bridge.on('2', 'app.record.edit.submit', after);
    expect(bridge.dispatch('app.record.edit.submit', event('app.record.edit.submit'))).toBe(false);
    expect(after).not.toHaveBeenCalled();
  });

  test('非同期の submit でも false で止まる', async () => {
    const { bridge } = setup();
    bridge.on('1', 'app.record.edit.submit', async () => false);
    await expect(
      bridge.dispatch('app.record.edit.submit', event('app.record.edit.submit'))
    ).resolves.toBe(false);
  });

  test('submit の例外は保存を止め、一般向けの文言だけを error に入れる', () => {
    const { bridge, options } = setup();
    const after = vi.fn();
    bridge.on('1', 'app.record.edit.submit', () => {
      throw new Error('secret stack');
    });
    bridge.on('2', 'app.record.edit.submit', after);
    const result = bridge.dispatch(
      'app.record.edit.submit',
      event('app.record.edit.submit')
    ) as KintoneEventObject;
    expect(result.error).toBe(SUBMIT_ERROR);
    expect(after).not.toHaveBeenCalled();
    expect(options.onHandlerError).toHaveBeenCalledWith(
      '1',
      'app.record.edit.submit',
      expect.any(Error)
    );
  });

  test('submit の非同期の例外も保存を止める', async () => {
    const { bridge } = setup();
    bridge.on('1', 'app.record.create.submit', async () => {
      throw new Error('boom');
    });
    await expect(
      bridge.dispatch('app.record.create.submit', event('app.record.create.submit'))
    ).resolves.toMatchObject({ error: SUBMIT_ERROR });
  });

  test('show の例外は記録して、後続のアセットは実行する', () => {
    const { bridge, options } = setup();
    const after = vi.fn((e: unknown) => e);
    bridge.on('1', 'app.record.detail.show', () => {
      throw new Error('boom');
    });
    bridge.on('2', 'app.record.detail.show', after);
    bridge.dispatch('app.record.detail.show', event('app.record.detail.show'));
    expect(after).toHaveBeenCalled();
    expect(options.onHandlerError).toHaveBeenCalledTimes(1);
  });

  test('change で thenable が返されたら待たずに続け、診断へ記録する', () => {
    const { bridge, options } = setup();
    bridge.on('1', 'app.record.edit.change.A', async () => ({ ignored: true }));
    bridge.on('2', 'app.record.edit.change.A', (e: unknown) => ({ ...(e as object), b: 2 }));
    const result = bridge.dispatch('app.record.edit.change.A', event('app.record.edit.change.A'));
    expect(result).not.toBeInstanceOf(Promise);
    expect(result).toMatchObject({ b: 2 });
    expect(result).not.toHaveProperty('ignored');
    expect(options.onIgnoredThenable).toHaveBeenCalledWith('1', 'app.record.edit.change.A');
  });

  test('canDeliver が false のアセットには配信しない', () => {
    const { bridge } = setup({ canDeliver: (assetId) => assetId !== '1' });
    const skipped = vi.fn();
    bridge.on('1', 'app.record.detail.show', skipped);
    const target = event('app.record.detail.show');
    expect(bridge.dispatch('app.record.detail.show', target)).toBe(target);
    expect(skipped).not.toHaveBeenCalled();
  });

  test('native handler から配信される', () => {
    const { bridge, natives } = setup();
    bridge.on('1', 'app.record.edit.change.A', (e: unknown) => ({
      ...(e as object),
      changed: true,
    }));
    expect(
      natives.get('app.record.edit.change.A')!(event('app.record.edit.change.A'))
    ).toMatchObject({ changed: true });
  });

  test('off はそのアセットのハンドラだけを外す', () => {
    const { bridge } = setup();
    const mine = vi.fn();
    const others = vi.fn();
    bridge.on('1', 'app.record.detail.show', mine);
    bridge.on('2', 'app.record.detail.show', others);
    expect(bridge.off('1', 'app.record.detail.show')).toBe(true);
    expect(bridge.off('1', 'app.record.detail.show')).toBe(false);
    bridge.dispatch('app.record.detail.show', event('app.record.detail.show'));
    expect(mine).not.toHaveBeenCalled();
    expect(others).toHaveBeenCalled();
  });
});

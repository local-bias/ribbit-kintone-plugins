import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createSharedLoadRegistry, SHARED_LOAD_TTL_MS } from './shared-load';

/** テスト側から解決タイミングを制御できるPromise */
const createDeferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

beforeEach(() => {
  vi.useRealTimers();
});

describe('実行中の共有', () => {
  it('同じキーの読み込みは1度しか実行されない', async () => {
    const registry = createSharedLoadRegistry<string[]>();
    const deferred = createDeferred<void>();
    const load = vi.fn(async () => deferred.promise);

    const first = registry.run('key', { onEmit: vi.fn(), load });
    const second = registry.run('key', { onEmit: vi.fn(), load });

    deferred.resolve();
    await Promise.all([first, second]);

    expect(load).toHaveBeenCalledTimes(1);
  });

  it('キーが異なれば個別に実行される', async () => {
    const registry = createSharedLoadRegistry<string[]>();
    const load = vi.fn(async () => undefined);

    await registry.run('key-a', { onEmit: vi.fn(), load });
    await registry.run('key-b', { onEmit: vi.fn(), load });

    expect(load).toHaveBeenCalledTimes(2);
  });

  it('途中で参加した呼び出し元にも、以降の配信が届く', async () => {
    const registry = createSharedLoadRegistry<string[]>();
    const deferred = createDeferred<void>();
    let emitToAll: ((values: string[], meta: { fromCache: boolean }) => void) | null = null;

    const first = registry.run('key', {
      onEmit: vi.fn(),
      load: async (emit) => {
        emitToAll = emit;
        await deferred.promise;
      },
    });
    await Promise.resolve();

    const lateOnEmit = vi.fn();
    const second = registry.run('key', { onEmit: lateOnEmit, load: vi.fn() });

    emitToAll?.(['アルファ'], { fromCache: false });
    deferred.resolve();
    await Promise.all([first, second]);

    expect(lateOnEmit).toHaveBeenCalledWith(['アルファ'], { fromCache: false });
  });

  it('途中で参加した呼び出し元には、配信済みの最新値が即座に再生される', async () => {
    const registry = createSharedLoadRegistry<string[]>();
    const deferred = createDeferred<void>();

    const first = registry.run('key', {
      onEmit: vi.fn(),
      load: async (emit) => {
        emit(['途中経過'], { fromCache: true });
        await deferred.promise;
      },
    });
    await Promise.resolve();

    const lateOnEmit = vi.fn();
    const second = registry.run('key', { onEmit: lateOnEmit, load: vi.fn() });

    expect(lateOnEmit).toHaveBeenCalledWith(['途中経過'], { fromCache: true });

    deferred.resolve();
    await Promise.all([first, second]);
  });
});

describe('完了後の再利用', () => {
  it('完了済みの結果は読み込みを行わずに再生される', async () => {
    const registry = createSharedLoadRegistry<string[]>();
    const load = vi.fn(async (emit: (values: string[], meta: { fromCache: boolean }) => void) => {
      emit(['アルファ'], { fromCache: false });
    });

    await registry.run('key', { onEmit: vi.fn(), load });

    const onEmit = vi.fn();
    await registry.run('key', { onEmit, load });

    expect(load).toHaveBeenCalledTimes(1);
    expect(onEmit).toHaveBeenCalledWith(['アルファ'], { fromCache: false });
  });

  it('保持期間を過ぎた結果は再利用せず、読み込みし直す', async () => {
    vi.useFakeTimers();
    const registry = createSharedLoadRegistry<string[]>();
    const load = vi.fn(async () => undefined);

    await registry.run('key', { onEmit: vi.fn(), load });
    vi.advanceTimersByTime(SHARED_LOAD_TTL_MS + 1);
    await registry.run('key', { onEmit: vi.fn(), load });

    expect(load).toHaveBeenCalledTimes(2);
  });

  it('clear()すると保持中の結果を破棄する', async () => {
    const registry = createSharedLoadRegistry<string[]>();
    const load = vi.fn(async () => undefined);

    await registry.run('key', { onEmit: vi.fn(), load });
    registry.clear();
    await registry.run('key', { onEmit: vi.fn(), load });

    expect(load).toHaveBeenCalledTimes(2);
  });
});

describe('失敗時の挙動', () => {
  it('実行中に参加した呼び出し元にもエラーが伝わる', async () => {
    const registry = createSharedLoadRegistry<string[]>();
    const deferred = createDeferred<void>();
    const load = vi.fn(async () => deferred.promise);

    const first = registry.run('key', { onEmit: vi.fn(), load });
    const second = registry.run('key', { onEmit: vi.fn(), load });

    deferred.reject(new Error('network error'));

    await expect(first).rejects.toThrow('network error');
    await expect(second).rejects.toThrow('network error');
  });

  it('失敗した結果は保持せず、次の呼び出しで再実行する', async () => {
    const registry = createSharedLoadRegistry<string[]>();
    const load = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValue(undefined);

    await expect(registry.run('key', { onEmit: vi.fn(), load })).rejects.toThrow('network error');
    await expect(registry.run('key', { onEmit: vi.fn(), load })).resolves.toBeUndefined();

    expect(load).toHaveBeenCalledTimes(2);
  });

  it('読み込みが同期的に例外を投げても、結果を保持しない', async () => {
    const registry = createSharedLoadRegistry<string[]>();
    const load = vi.fn(() => {
      throw new Error('sync error');
    });

    await expect(registry.run('key', { onEmit: vi.fn(), load })).rejects.toThrow('sync error');
    await expect(registry.run('key', { onEmit: vi.fn(), load })).rejects.toThrow('sync error');

    expect(load).toHaveBeenCalledTimes(2);
  });
});

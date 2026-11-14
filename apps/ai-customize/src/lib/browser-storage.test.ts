import { describe, expect, test } from 'vitest';
import {
  buildNormalModeUrl,
  buildSafeModeUrl,
  buildStorageKey,
  isSafeMode,
  readMutedIds,
  removeOtherUsersKeys,
  type StorageLike,
} from './browser-storage';

const target = { spaceId: '0', appId: '42' };

const createStorage = (
  initial: Record<string, string> = {}
): StorageLike & { data: Map<string, string> } => {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
    key: (index) => [...data.keys()][index] ?? null,
    get length() {
      return data.size;
    },
  };
};

const throwingStorage: StorageLike = {
  getItem: () => {
    throw new Error('denied');
  },
  setItem: () => {
    throw new Error('denied');
  },
  removeItem: () => {
    throw new Error('denied');
  },
  key: () => {
    throw new Error('denied');
  },
  length: 1,
};

describe('buildStorageKey', () => {
  test('対象座標とユーザーを含み、ユーザーを末尾に置く', () => {
    expect(buildStorageKey('muted', target, 'sato@example')).toBe(
      '🐸-ai-customize:v3:muted:0:42:sato%40example'
    );
  });
});

describe('readMutedIds', () => {
  test('保存済みのIDを読む', () => {
    const storage = createStorage({ [buildStorageKey('muted', target, 'sato')]: '["1","2",3]' });
    expect(readMutedIds(storage, target, 'sato')).toEqual(new Set(['1', '2']));
  });

  test.each([['not json'], ['{"a":1}']])('壊れた値 %s は空として扱う', (raw) => {
    const storage = createStorage({ [buildStorageKey('muted', target, 'sato')]: raw });
    expect(readMutedIds(storage, target, 'sato')).toEqual(new Set());
  });

  test('別ユーザー・別アプリのキーは読まない', () => {
    const storage = createStorage({ [buildStorageKey('muted', target, 'tanaka')]: '["1"]' });
    expect(readMutedIds(storage, target, 'sato')).toEqual(new Set());
  });

  test('localStorage が例外を投げても空として扱う', () => {
    expect(readMutedIds(throwingStorage, target, 'sato')).toEqual(new Set());
    expect(readMutedIds(null, target, 'sato')).toEqual(new Set());
  });
});

describe('isSafeMode', () => {
  test.each([
    ['?ai-customize=off', true],
    ['?view=1&ai-customize=off', true],
    ['?ai-customize=on', false],
    ['', false],
  ])('%s -> %s', (search, expected) => {
    expect(isSafeMode({ search, storage: null, target, loginUserCode: 'sato' })).toBe(expected);
  });

  test('対象座標・ユーザー別のキーでも入れる', () => {
    const storage = createStorage({ [buildStorageKey('safe-mode', target, 'sato')]: '1' });
    expect(isSafeMode({ search: '', storage, target, loginUserCode: 'sato' })).toBe(true);
    expect(isSafeMode({ search: '', storage, target, loginUserCode: 'tanaka' })).toBe(false);
  });

  test('localStorage が例外を投げてもクエリで判定できる', () => {
    expect(
      isSafeMode({
        search: '?ai-customize=off',
        storage: throwingStorage,
        target,
        loginUserCode: 'sato',
      })
    ).toBe(true);
    expect(
      isSafeMode({ search: '', storage: throwingStorage, target, loginUserCode: 'sato' })
    ).toBe(false);
  });
});

describe('セーフモードのURL', () => {
  test('既存のクエリとハッシュを保つ', () => {
    const safe = buildSafeModeUrl('https://example.cybozu.com/k/42/show?view=1#record=5');
    expect(safe).toBe('https://example.cybozu.com/k/42/show?view=1&ai-customize=off#record=5');
    expect(buildNormalModeUrl(safe)).toBe('https://example.cybozu.com/k/42/show?view=1#record=5');
  });
});

describe('removeOtherUsersKeys', () => {
  test('別ユーザーのキーだけを消し、他プラグインのキーには触らない', () => {
    const mine = buildStorageKey('muted', target, 'sato');
    const others = buildStorageKey('muted', target, 'tanaka');
    const othersSafe = buildStorageKey('safe-mode', { spaceId: '0', appId: '7' }, 'tanaka');
    const storage = createStorage({
      [mine]: '["1"]',
      [others]: '["2"]',
      [othersSafe]: '1',
      'other-plugin:key:tanaka': 'x',
    });
    removeOtherUsersKeys(storage, 'sato');
    expect([...storage.data.keys()]).toEqual([mine, 'other-plugin:key:tanaka']);
  });

  test('localStorage が例外を投げても落ちない', () => {
    expect(() => removeOtherUsersKeys(throwingStorage, 'sato')).not.toThrow();
  });
});

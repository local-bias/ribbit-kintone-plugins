import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readStoredDriveToken, writeStoredDriveToken } from './token-storage';

const STORAGE_KEY = 'gdrive-connect:token';

class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length() {
    return this.store.size;
  }
  clear(): void {
    this.store.clear();
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) ?? null) : null;
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    value: new MemoryStorage(),
    configurable: true,
    writable: true,
  });
});

afterEach(() => {
  delete (globalThis as { localStorage?: Storage }).localStorage;
});

describe('writeStoredDriveToken / readStoredDriveToken', () => {
  it('保存したトークンを復元できる', () => {
    const token = { accessToken: 'token-abc', expiresAt: Date.now() + 60_000 };
    writeStoredDriveToken(token);
    expect(readStoredDriveToken()).toEqual(token);
  });

  it('refreshTokenを含むトークンも復元できる', () => {
    const token = {
      accessToken: 'token-abc',
      expiresAt: Date.now() + 60_000,
      refreshToken: 'refresh-abc',
    };
    writeStoredDriveToken(token);
    expect(readStoredDriveToken()).toEqual(token);
  });

  it('nullを書き込むと保存済みトークンが削除される', () => {
    writeStoredDriveToken({ accessToken: 'token-abc', expiresAt: Date.now() + 60_000 });
    writeStoredDriveToken(null);
    expect(readStoredDriveToken()).toBeNull();
  });

  it('refreshTokenが無く、accessTokenが有効期限切れの場合はnullを返し、ストレージからも削除する', () => {
    writeStoredDriveToken({ accessToken: 'expired-token', expiresAt: Date.now() - 1000 });
    expect(readStoredDriveToken()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('accessTokenが有効期限切れでも、refreshTokenがあれば削除せずに返す(無音リフレッシュに使うため)', () => {
    const token = {
      accessToken: 'expired-token',
      expiresAt: Date.now() - 1000,
      refreshToken: 'refresh-abc',
    };
    writeStoredDriveToken(token);
    expect(readStoredDriveToken()).toEqual(token);
  });

  it('何も保存されていない場合はnullを返す', () => {
    expect(readStoredDriveToken()).toBeNull();
  });

  it('壊れたJSONが保存されている場合はnullを返す', () => {
    localStorage.setItem(STORAGE_KEY, '{invalid-json');
    expect(readStoredDriveToken()).toBeNull();
  });

  it('期待する形式でないオブジェクトが保存されている場合はnullを返す', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ foo: 'bar' }));
    expect(readStoredDriveToken()).toBeNull();
  });
});

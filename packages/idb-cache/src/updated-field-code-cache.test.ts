import 'fake-indexeddb/auto';
import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getAppMock, getFormFieldsMock } = vi.hoisted(() => ({
  getAppMock: vi.fn(),
  getFormFieldsMock: vi.fn(),
}));

vi.mock('@konomi-app/kintone-utilities', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@konomi-app/kintone-utilities')>();
  return {
    ...actual,
    getApp: getAppMock,
    getFormFields: getFormFieldsMock,
  };
});

const { createIdbStore } = await import('./idb');
const { createUpdatedFieldCodeCache } = await import('./updated-field-code-cache');

const PROPERTIES_WITH_UPDATED_TIME = {
  更新日時: { type: 'UPDATED_TIME', code: '更新日時', label: '', noLabel: false },
} as unknown as kintoneAPI.FieldProperties;

const PROPERTIES_WITHOUT_UPDATED_TIME = {
  文字列: {
    type: 'SINGLE_LINE_TEXT',
    code: '文字列',
    label: '',
    noLabel: false,
    required: false,
    unique: false,
    maxLength: '',
    minLength: '',
    defaultValue: '',
    expression: '',
    hideExpression: false,
  },
} as unknown as kintoneAPI.FieldProperties;

const setupCache = () => {
  const idbStore = createIdbStore({ dbName: 'test-form-properties-db', storeName: 'cache' });
  const cache = createUpdatedFieldCodeCache({ idbStore, keyPrefix: 'konomi-test-form-properties' });
  return { idbStore, cache };
};

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
  getAppMock.mockReset();
  getFormFieldsMock.mockReset();
});

describe('resolveUpdatedFieldCode', () => {
  it('初回はgetFormFieldsとgetAppの両方を呼び、解決結果を保存する', async () => {
    const { cache } = setupCache();
    getFormFieldsMock.mockResolvedValueOnce({ properties: PROPERTIES_WITH_UPDATED_TIME });
    getAppMock.mockResolvedValueOnce({ modifiedAt: '2026-01-01T00:00:00Z' });

    const result = await cache.resolveUpdatedFieldCode({ srcAppId: '1', guestSpaceId: undefined });

    expect(result).toBe('更新日時');
    expect(getFormFieldsMock).toHaveBeenCalledTimes(1);
    expect(getAppMock).toHaveBeenCalledTimes(1);
  });

  it('modifiedAtが前回と一致する場合、getFormFieldsを呼ばずキャッシュを返す', async () => {
    const { cache } = setupCache();
    getFormFieldsMock.mockResolvedValueOnce({ properties: PROPERTIES_WITH_UPDATED_TIME });
    getAppMock.mockResolvedValue({ modifiedAt: '2026-01-01T00:00:00Z' });
    await cache.resolveUpdatedFieldCode({ srcAppId: '1', guestSpaceId: undefined });

    getFormFieldsMock.mockReset();
    getAppMock.mockClear();

    const result = await cache.resolveUpdatedFieldCode({ srcAppId: '1', guestSpaceId: undefined });

    expect(result).toBe('更新日時');
    expect(getFormFieldsMock).not.toHaveBeenCalled();
    expect(getAppMock).toHaveBeenCalledTimes(1);
  });

  it('アプリのmodifiedAtが変化していた場合は、キャッシュを使わず必ず最新のフィールド定義を再取得する', async () => {
    const { cache } = setupCache();
    getFormFieldsMock.mockResolvedValueOnce({ properties: PROPERTIES_WITHOUT_UPDATED_TIME });
    getAppMock.mockResolvedValueOnce({ modifiedAt: '2026-01-01T00:00:00Z' });
    const first = await cache.resolveUpdatedFieldCode({ srcAppId: '1', guestSpaceId: undefined });
    expect(first).toBeNull();

    // アプリ設定が変更され、更新日時フィールドが新たに追加されたケースを模す。
    // フィンガープリント検証で取得済みのapp情報を再利用するため、getAppは1回のみでよい
    getAppMock.mockReset();
    getAppMock.mockResolvedValueOnce({ modifiedAt: '2026-02-01T00:00:00Z' });
    getFormFieldsMock.mockResolvedValueOnce({ properties: PROPERTIES_WITH_UPDATED_TIME });

    const second = await cache.resolveUpdatedFieldCode({ srcAppId: '1', guestSpaceId: undefined });

    expect(second).toBe('更新日時');
    expect(getFormFieldsMock).toHaveBeenCalledTimes(2);
    expect(getAppMock).toHaveBeenCalledTimes(1);
  });

  it('UPDATED_TIMEフィールドが存在しない場合はnullを解決結果としてキャッシュする', async () => {
    const { cache } = setupCache();
    getFormFieldsMock.mockResolvedValueOnce({ properties: PROPERTIES_WITHOUT_UPDATED_TIME });
    getAppMock.mockResolvedValue({ modifiedAt: '2026-01-01T00:00:00Z' });
    await cache.resolveUpdatedFieldCode({ srcAppId: '1', guestSpaceId: undefined });

    getFormFieldsMock.mockReset();
    getAppMock.mockClear();

    const result = await cache.resolveUpdatedFieldCode({ srcAppId: '1', guestSpaceId: undefined });

    expect(result).toBeNull();
    expect(getFormFieldsMock).not.toHaveBeenCalled();
  });

  it('srcAppIdが異なれば別のキャッシュエントリとして扱われる', async () => {
    const { cache } = setupCache();
    getFormFieldsMock.mockResolvedValueOnce({ properties: PROPERTIES_WITH_UPDATED_TIME });
    getAppMock.mockResolvedValueOnce({ modifiedAt: '2026-01-01T00:00:00Z' });
    await cache.resolveUpdatedFieldCode({ srcAppId: '1', guestSpaceId: undefined });

    getFormFieldsMock.mockResolvedValueOnce({ properties: PROPERTIES_WITHOUT_UPDATED_TIME });
    getAppMock.mockResolvedValueOnce({ modifiedAt: '2026-01-01T00:00:00Z' });
    const result = await cache.resolveUpdatedFieldCode({ srcAppId: '2', guestSpaceId: undefined });

    expect(result).toBeNull();
    expect(getFormFieldsMock).toHaveBeenCalledTimes(2);
  });

  it('破損したキャッシュエントリは無視して最新のフィールド定義を取得する', async () => {
    const { idbStore, cache } = setupCache();
    await idbStore.put('konomi-test-form-properties:1:', { not: 'an envelope' });
    getFormFieldsMock.mockResolvedValueOnce({ properties: PROPERTIES_WITH_UPDATED_TIME });
    getAppMock.mockResolvedValueOnce({ modifiedAt: '2026-01-01T00:00:00Z' });

    const result = await cache.resolveUpdatedFieldCode({ srcAppId: '1', guestSpaceId: undefined });

    expect(result).toBe('更新日時');
    expect(getFormFieldsMock).toHaveBeenCalledTimes(1);
  });

  it('TTLを超過したキャッシュエントリは無視して最新のフィールド定義を取得する', async () => {
    const { idbStore, cache } = setupCache();
    await idbStore.put('konomi-test-form-properties:1:', {
      version: 1,
      savedAt: Date.now() - 25 * 60 * 60 * 1000,
      appModifiedAt: '2026-01-01T00:00:00Z',
      updatedFieldCode: '更新日時',
    });
    getFormFieldsMock.mockResolvedValueOnce({ properties: PROPERTIES_WITH_UPDATED_TIME });
    getAppMock.mockResolvedValueOnce({ modifiedAt: '2026-01-01T00:00:00Z' });

    const result = await cache.resolveUpdatedFieldCode({ srcAppId: '1', guestSpaceId: undefined });

    expect(result).toBe('更新日時');
    // TTL切れのため、有効性チェック用のgetAppは呼ばれず、フル解決のgetAppのみが呼ばれる
    expect(getAppMock).toHaveBeenCalledTimes(1);
  });
});

describe('永続化が利用できない場合', () => {
  it('IndexedDBを使わず、常に最新のフィールド定義を取得する', async () => {
    const idbStore = createIdbStore({ dbName: 'test-form-properties-disabled', storeName: 'cache' });
    const cache = createUpdatedFieldCodeCache({ idbStore, keyPrefix: 'konomi-test-form-properties' });
    cache.disablePersistence();

    getFormFieldsMock.mockResolvedValueOnce({ properties: PROPERTIES_WITH_UPDATED_TIME });
    getAppMock.mockResolvedValueOnce({ modifiedAt: '2026-01-01T00:00:00Z' });

    const result = await cache.resolveUpdatedFieldCode({ srcAppId: '1', guestSpaceId: undefined });

    expect(result).toBe('更新日時');
    expect(await idbStore.get('konomi-test-form-properties:1:')).toBeUndefined();
  });
});

describe('quota超過時の挙動', () => {
  it('put失敗時は例外を投げず、エントリを削除し永続化を無効化する', async () => {
    const { idbStore, cache } = setupCache();
    const quotaError = new DOMException('quota exceeded', 'QuotaExceededError');
    const putSpy = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(() => {
      throw quotaError;
    });

    getFormFieldsMock.mockResolvedValueOnce({ properties: PROPERTIES_WITH_UPDATED_TIME });
    getAppMock.mockResolvedValueOnce({ modifiedAt: '2026-01-01T00:00:00Z' });

    const result = await cache.resolveUpdatedFieldCode({ srcAppId: '1', guestSpaceId: undefined });

    putSpy.mockRestore();
    // 解決自体はエラーにならず正常に値を返す
    expect(result).toBe('更新日時');
    expect(cache.isPersistenceAvailable()).toBe(false);
    expect(await idbStore.get('konomi-test-form-properties:1:')).toBeUndefined();
  });

  it('共有PersistenceGuardを渡していればレコードキャッシュ側の無効化状態も引き継げる', async () => {
    const { createPersistenceGuard } = await import('./record-cache');
    const guard = createPersistenceGuard();
    const idbStore = createIdbStore({ dbName: 'test-form-properties-shared', storeName: 'cache' });
    const cache = createUpdatedFieldCodeCache({
      idbStore,
      keyPrefix: 'konomi-test-form-properties',
      persistenceGuard: guard,
    });

    guard.disable();

    expect(cache.isPersistenceAvailable()).toBe(false);
  });
});

describe('scheduleCleanup', () => {
  it('期限切れエントリを削除し、有効なエントリは残す', async () => {
    const { idbStore, cache } = setupCache();
    await idbStore.put('konomi-test-form-properties:valid:', {
      version: 1,
      savedAt: Date.now(),
      appModifiedAt: '2026-01-01T00:00:00Z',
      updatedFieldCode: '更新日時',
    });
    await idbStore.put('konomi-test-form-properties:expired:', {
      version: 1,
      savedAt: Date.now() - 25 * 60 * 60 * 1000,
      appModifiedAt: '2026-01-01T00:00:00Z',
      updatedFieldCode: '更新日時',
    });

    cache.scheduleCleanup();
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(await idbStore.get('konomi-test-form-properties:valid:')).toBeDefined();
    expect(await idbStore.get('konomi-test-form-properties:expired:')).toBeUndefined();
  });
});

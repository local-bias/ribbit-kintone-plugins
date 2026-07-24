import 'fake-indexeddb/auto';
import type { kintoneAPI } from '@konomi-app/kintone-utilities';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PluginCondition } from '@/lib/plugin';

const { getAllRecordsWithIdMock } = vi.hoisted(() => ({
  getAllRecordsWithIdMock: vi.fn(),
}));

vi.mock('@konomi-app/kintone-utilities', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@konomi-app/kintone-utilities')>();
  return {
    ...actual,
    getAllRecordsWithId: getAllRecordsWithIdMock,
  };
});

const { resolveUpdatedFieldCodeMock, scheduleExpiredFormPropertiesCleanupMock } = vi.hoisted(() => ({
  resolveUpdatedFieldCodeMock: vi.fn(),
  scheduleExpiredFormPropertiesCleanupMock: vi.fn(),
}));

vi.mock('./form-properties-cache', () => ({
  resolveUpdatedFieldCode: resolveUpdatedFieldCodeMock,
  scheduleExpiredFormPropertiesCleanup: scheduleExpiredFormPropertiesCleanupMock,
}));

const { revalidateCacheMock, getMaxUpdatedTimeMock } = vi.hoisted(() => ({
  revalidateCacheMock: vi.fn(),
  getMaxUpdatedTimeMock: vi.fn(),
}));

vi.mock('./sync', () => ({
  revalidateCache: revalidateCacheMock,
  getMaxUpdatedTime: getMaxUpdatedTimeMock,
}));

const { loadAutocompleteOptions } = await import('./loader');
const { buildConfigHash, loadCacheEnvelope, saveCacheEnvelope, CACHE_ENVELOPE_VERSION } = await import(
  './persistent-cache'
);

const UPDATED_FIELD_CODE = '更新日時';

const condition: PluginCondition = {
  id: 'cond-1',
  cacheId: '',
  srcAppId: '1',
  srcFieldCode: '会社名',
  targetFieldCode: '会社名候補',
  limit: 100,
};

const buildRecord = (id: string, value: string): kintoneAPI.RecordData => ({
  $id: { type: '__ID__', value: id },
  会社名: { type: 'SINGLE_LINE_TEXT', value },
  更新日時: { type: 'UPDATED_TIME', value: '2026-01-01T00:00:00Z' },
});

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
  getAllRecordsWithIdMock.mockReset();
  resolveUpdatedFieldCodeMock.mockReset();
  scheduleExpiredFormPropertiesCleanupMock.mockReset();
  revalidateCacheMock.mockReset();
  getMaxUpdatedTimeMock.mockReset();
  getMaxUpdatedTimeMock.mockReturnValue('2026-01-01T00:00:00Z');
});

describe('永続化が使えない場合(updatedFieldCodeが解決できない)', () => {
  it('キャッシュを一切使わず、srcFieldCodeのみで全件取得する', async () => {
    resolveUpdatedFieldCodeMock.mockResolvedValue(null);
    getAllRecordsWithIdMock.mockResolvedValue([buildRecord('1', 'アルファ')]);

    const onValues = vi.fn();
    await loadAutocompleteOptions({ condition, onValues });

    expect(getAllRecordsWithIdMock).toHaveBeenCalledWith(
      expect.objectContaining({ app: '1', fields: ['会社名'] })
    );
    expect(revalidateCacheMock).not.toHaveBeenCalled();
    expect(onValues).toHaveBeenCalledWith(['アルファ'], { fromCache: false });
  });

  it('updatedFieldCodeの解決が例外を投げても、キャッシュなしの全件取得にフォールバックする', async () => {
    resolveUpdatedFieldCodeMock.mockRejectedValue(new Error('getFormFields failed'));
    getAllRecordsWithIdMock.mockResolvedValue([buildRecord('1', 'アルファ')]);

    const onValues = vi.fn();
    await expect(loadAutocompleteOptions({ condition, onValues })).resolves.toBeUndefined();

    expect(getAllRecordsWithIdMock).toHaveBeenCalledWith(
      expect.objectContaining({ app: '1', fields: ['会社名'] })
    );
    expect(revalidateCacheMock).not.toHaveBeenCalled();
    expect(onValues).toHaveBeenCalledWith(['アルファ'], { fromCache: false });
  });
});

describe('キャッシュ未ヒット(初回)', () => {
  it('全件取得し、結果をエンベロープとして保存する', async () => {
    resolveUpdatedFieldCodeMock.mockResolvedValue(UPDATED_FIELD_CODE);
    getAllRecordsWithIdMock.mockResolvedValue([buildRecord('1', 'アルファ')]);

    const onValues = vi.fn();
    await loadAutocompleteOptions({ condition, onValues });

    expect(onValues).toHaveBeenCalledWith(['アルファ'], { fromCache: false });

    const configHash = buildConfigHash({
      srcAppId: '1',
      guestSpaceId: undefined,
      fields: ['会社名', UPDATED_FIELD_CODE],
    });
    const cached = await loadCacheEnvelope({ conditionId: condition.id, expectedConfigHash: configHash });
    expect(cached?.count).toBe(1);
  });
});

describe('キャッシュヒット', () => {
  const fields = ['会社名', UPDATED_FIELD_CODE];
  const configHash = buildConfigHash({ srcAppId: '1', guestSpaceId: undefined, fields });

  beforeEach(async () => {
    resolveUpdatedFieldCodeMock.mockResolvedValue(UPDATED_FIELD_CODE);
    await saveCacheEnvelope({
      conditionId: condition.id,
      envelope: {
        version: CACHE_ENVELOPE_VERSION,
        savedAt: Date.now(),
        configHash,
        maxUpdatedTime: '2025-12-01T00:00:00Z',
        updatedFieldCode: UPDATED_FIELD_CODE,
        count: 1,
        records: [buildRecord('1', 'アルファ')],
      },
    });
  });

  it('unchangedの場合、キャッシュを即時反映するのみで全件取得も再保存もしない', async () => {
    revalidateCacheMock.mockResolvedValue({ needsFullRefetch: false, unchanged: true });

    const onValues = vi.fn();
    await loadAutocompleteOptions({ condition, onValues });

    expect(onValues).toHaveBeenCalledTimes(1);
    expect(onValues).toHaveBeenCalledWith(['アルファ'], { fromCache: true });
    expect(getAllRecordsWithIdMock).not.toHaveBeenCalled();
  });

  it('差分がある場合、キャッシュ即時反映後に最新値へ更新し、エンベロープを再保存する', async () => {
    const updatedRecords = [buildRecord('1', 'アルファ'), buildRecord('2', 'ベータ')];
    revalidateCacheMock.mockResolvedValue({
      needsFullRefetch: false,
      unchanged: false,
      records: updatedRecords,
      envelope: {
        version: CACHE_ENVELOPE_VERSION,
        savedAt: Date.now(),
        configHash,
        maxUpdatedTime: '2026-02-01T00:00:00Z',
        updatedFieldCode: UPDATED_FIELD_CODE,
        count: 2,
        records: updatedRecords,
      },
    });

    const onValues = vi.fn();
    await loadAutocompleteOptions({ condition, onValues });

    expect(onValues).toHaveBeenNthCalledWith(1, ['アルファ'], { fromCache: true });
    expect(onValues).toHaveBeenNthCalledWith(2, ['アルファ', 'ベータ'], { fromCache: false });
    expect(getAllRecordsWithIdMock).not.toHaveBeenCalled();

    const reloaded = await loadCacheEnvelope({ conditionId: condition.id, expectedConfigHash: configHash });
    expect(reloaded?.count).toBe(2);
  });

  it('needsFullRefetchの場合、キャッシュ即時反映後に全件取得へフォールバックする', async () => {
    revalidateCacheMock.mockResolvedValue({ needsFullRefetch: true });
    const freshRecords = [buildRecord('3', 'ガンマ')];
    getAllRecordsWithIdMock.mockResolvedValue(freshRecords);

    const onValues = vi.fn();
    await loadAutocompleteOptions({ condition, onValues });

    expect(onValues).toHaveBeenNthCalledWith(1, ['アルファ'], { fromCache: true });
    expect(getAllRecordsWithIdMock).toHaveBeenCalledTimes(1);
    expect(onValues).toHaveBeenLastCalledWith(['ガンマ'], { fromCache: false });
  });

  it('再検証に失敗した場合、ハイドレート済みの値のまま処理を終える', async () => {
    revalidateCacheMock.mockRejectedValue(new Error('network error'));

    const onValues = vi.fn();
    await expect(loadAutocompleteOptions({ condition, onValues })).resolves.toBeUndefined();

    expect(onValues).toHaveBeenCalledTimes(1);
    expect(onValues).toHaveBeenCalledWith(['アルファ'], { fromCache: true });
    expect(getAllRecordsWithIdMock).not.toHaveBeenCalled();
  });
});

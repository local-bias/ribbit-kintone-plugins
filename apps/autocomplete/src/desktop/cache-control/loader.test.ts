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

const { loadAutocompleteOptions, resetSharedLoads } = await import('./loader');
const {
  buildConfigHash,
  buildDatasetKey,
  loadCacheEnvelope,
  saveCacheEnvelope,
  CACHE_ENVELOPE_VERSION,
} = await import('./persistent-cache');

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
  resetSharedLoads();
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
    const cached = await loadCacheEnvelope({
      datasetKey: buildDatasetKey({
        srcAppId: '1',
        guestSpaceId: undefined,
        fields: ['会社名', UPDATED_FIELD_CODE],
      }),
      expectedConfigHash: configHash,
    });
    expect(cached?.count).toBe(1);
  });
});

describe('キャッシュヒット', () => {
  const fields = ['会社名', UPDATED_FIELD_CODE];
  const identity = { srcAppId: '1', guestSpaceId: undefined, fields };
  const configHash = buildConfigHash(identity);
  const datasetKey = buildDatasetKey(identity);

  beforeEach(async () => {
    resolveUpdatedFieldCodeMock.mockResolvedValue(UPDATED_FIELD_CODE);
    await saveCacheEnvelope({
      datasetKey,
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

    const reloaded = await loadCacheEnvelope({ datasetKey, expectedConfigHash: configHash });
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

describe('同一の参照先を持つ複数の候補設定', () => {
  const otherCondition: PluginCondition = {
    ...condition,
    id: 'cond-2',
    targetFieldCode: '会社名候補2',
  };

  beforeEach(() => {
    resolveUpdatedFieldCodeMock.mockResolvedValue(UPDATED_FIELD_CODE);
  });

  it('並行して読み込んでも、レコード取得は1回だけで両方に同じ候補が配信される', async () => {
    let resolveRecords!: (records: kintoneAPI.RecordData[]) => void;
    getAllRecordsWithIdMock.mockReturnValue(
      new Promise<kintoneAPI.RecordData[]>((resolve) => {
        resolveRecords = resolve;
      })
    );

    const onValuesA = vi.fn();
    const onValuesB = vi.fn();
    const promiseA = loadAutocompleteOptions({ condition, onValues: onValuesA });
    const promiseB = loadAutocompleteOptions({ condition: otherCondition, onValues: onValuesB });

    await vi.waitFor(() => expect(getAllRecordsWithIdMock).toHaveBeenCalled());
    resolveRecords([buildRecord('1', 'アルファ')]);
    await Promise.all([promiseA, promiseB]);

    expect(getAllRecordsWithIdMock).toHaveBeenCalledTimes(1);
    expect(resolveUpdatedFieldCodeMock).toHaveBeenCalledTimes(1);
    expect(onValuesA).toHaveBeenCalledWith(['アルファ'], { fromCache: false });
    expect(onValuesB).toHaveBeenCalledWith(['アルファ'], { fromCache: false });
  });

  it('読み込み完了後に追加された設定へは、APIを呼ばずに保持済みの候補を即座に配信する', async () => {
    getAllRecordsWithIdMock.mockResolvedValue([buildRecord('1', 'アルファ')]);

    const onValuesA = vi.fn();
    await loadAutocompleteOptions({ condition, onValues: onValuesA });

    const onValuesB = vi.fn();
    await loadAutocompleteOptions({ condition: otherCondition, onValues: onValuesB });

    expect(getAllRecordsWithIdMock).toHaveBeenCalledTimes(1);
    expect(resolveUpdatedFieldCodeMock).toHaveBeenCalledTimes(1);
    expect(onValuesB).toHaveBeenCalledWith(['アルファ'], { fromCache: false });
  });

  it('参照先フィールドが異なる場合は、共有せずそれぞれ取得する', async () => {
    getAllRecordsWithIdMock.mockResolvedValue([
      { ...buildRecord('1', 'アルファ'), 担当者名: { type: 'SINGLE_LINE_TEXT', value: '田中' } },
    ]);

    await loadAutocompleteOptions({ condition, onValues: vi.fn() });
    await loadAutocompleteOptions({
      condition: { ...otherCondition, srcFieldCode: '担当者名' },
      onValues: vi.fn(),
    });

    expect(getAllRecordsWithIdMock).toHaveBeenCalledTimes(2);
  });

  it('読み込みに失敗した場合は結果を共有せず、次の呼び出しで再取得する', async () => {
    getAllRecordsWithIdMock.mockRejectedValueOnce(new Error('network error'));

    await expect(loadAutocompleteOptions({ condition, onValues: vi.fn() })).rejects.toThrow(
      'network error'
    );

    getAllRecordsWithIdMock.mockResolvedValue([buildRecord('1', 'アルファ')]);
    const onValues = vi.fn();
    await loadAutocompleteOptions({ condition: otherCondition, onValues });

    expect(getAllRecordsWithIdMock).toHaveBeenCalledTimes(2);
    expect(onValues).toHaveBeenCalledWith(['アルファ'], { fromCache: false });
  });
});

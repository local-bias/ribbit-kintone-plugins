import { describe, expect, test, vi } from 'vitest';
import { createTestCommonConfig } from '@/test/fixtures';
import {
  type AddRecord,
  addAssetRecord,
  type DeleteRecord,
  deleteAssetRecord,
  type EvaluateAcl,
  type FetchRecords,
  loadAssetAccess,
  loadEnabledAssets,
  loadPanelAssets,
  type UpdateRecord,
  type UpdateRecords,
  updateAssetFields,
  updateAssetOrders,
} from './asset-repository';
import { MAX_ASSETS_PER_APP } from './constants';

const common = createTestCommonConfig({ assetAppSpaceId: '' });
const target = { spaceId: '0', appId: '42' };

const record = (id: string, overrides: Record<string, unknown> = {}) => {
  const values: Record<string, unknown> = {
    $id: id,
    $revision: '1',
    title: `asset ${id}`,
    targetAppId: '42',
    targetSpaceId: '0',
    kind: 'JavaScript',
    code: 'a();',
    scope: '全員',
    status: '有効',
    作成者: { code: 'sato', name: '佐藤' },
    permissions: [],
    order: '100',
    screens: [],
    ...overrides,
  };
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      key === '作成者' ? { type: 'CREATOR', value } : { value },
    ])
  );
};

describe('loadEnabledAssets', () => {
  test('管理アプリへクエリとフィールドを指定して取得し、実行順に並べる', async () => {
    const fetchRecords = vi.fn<FetchRecords>(async () => ({
      records: [record('3', { order: '200' }), record('1')],
    }));
    const result = await loadEnabledAssets({ fetchRecords, common, target, onSkipped: vi.fn() });
    expect(fetchRecords).toHaveBeenCalledWith({
      app: '99',
      query: expect.stringContaining('targetAppId = 42'),
      fields: expect.arrayContaining(['$id', 'code', 'permissions']),
      guestSpaceId: undefined,
    });
    expect(result.status === 'ok' && result.assets.map((asset) => asset.id)).toEqual(['1', '3']);
  });

  test('ゲストスペースの管理アプリには guestSpaceId を付ける', async () => {
    const fetchRecords = vi.fn<FetchRecords>(async () => ({ records: [] }));
    await loadEnabledAssets({
      fetchRecords,
      common: createTestCommonConfig({ assetAppSpaceId: '8' }),
      target,
      onSkipped: vi.fn(),
    });
    expect(fetchRecords).toHaveBeenCalledWith(expect.objectContaining({ guestSpaceId: '8' }));
  });

  test('変換できないレコードは外して知らせる', async () => {
    const onSkipped = vi.fn();
    const result = await loadEnabledAssets({
      fetchRecords: async () => ({ records: [record('1', { kind: 'Ruby' }), record('2')] }),
      common,
      target,
      onSkipped,
    });
    expect(onSkipped).toHaveBeenCalledWith('1', 'unknown-kind');
    expect(result.status === 'ok' && result.assets.map((asset) => asset.id)).toEqual(['2']);
  });

  test('上限を超えたら一部だけ返さずにエラー', async () => {
    const records = Array.from({ length: MAX_ASSETS_PER_APP + 1 }, (_, index) =>
      record(String(index + 1))
    );
    const result = await loadEnabledAssets({
      fetchRecords: async () => ({ records }),
      common,
      target,
      onSkipped: vi.fn(),
    });
    expect(result).toEqual({
      status: 'error',
      error: { reason: 'too-many', count: MAX_ASSETS_PER_APP + 1 },
    });
  });

  test('取得に失敗したらエラーを返す(例外にしない)', async () => {
    const result = await loadEnabledAssets({
      fetchRecords: async () => {
        throw { code: 'CB_NO02', message: '権限がありません。' };
      },
      common,
      target,
      onSkipped: vi.fn(),
    });
    expect(result).toEqual({
      status: 'error',
      error: { reason: 'request-failed', message: '権限がありません。' },
    });
  });
});

describe('loadPanelAssets', () => {
  test('無効なものも含めて取得し、作成者名と更新日時を添える', async () => {
    const fetchRecords = vi.fn<FetchRecords>(async () => ({
      records: [
        { ...record('1', { status: '無効' }), 更新日時: { value: '2026-09-28T01:00:00Z' } },
      ],
    }));
    const result = await loadPanelAssets({
      fetchRecords,
      common,
      target,
      updatedTimeFieldCode: '更新日時',
    });
    const query = fetchRecords.mock.calls[0]?.[0].query ?? '';
    expect(query).not.toContain('status in');
    expect(fetchRecords.mock.calls[0]?.[0].fields).toEqual(
      expect.arrayContaining(['description', '更新日時'])
    );
    expect(result).toMatchObject({
      status: 'ok',
      truncated: false,
      assets: [
        {
          asset: { id: '1', enabled: false },
          ownerName: '佐藤',
          updatedAt: '2026-09-28T01:00:00Z',
        },
      ],
    });
  });

  test('変換できないレコードは一覧から外し、理由を返す', async () => {
    const fetchRecords = vi.fn<FetchRecords>(async () => ({
      records: [record('1'), record('2', { kind: '???' })],
    }));
    const result = await loadPanelAssets({
      fetchRecords,
      common,
      target,
      updatedTimeFieldCode: '',
    });
    expect(result).toMatchObject({
      status: 'ok',
      skipped: [{ id: '2', reason: 'unknown-kind' }],
    });
  });

  test('上限を超えたら、上限までを返して超過を知らせる(パネルは整理する場所なので表示する)', async () => {
    const records = Array.from({ length: MAX_ASSETS_PER_APP + 1 }, (_, index) =>
      record(String(index + 1))
    );
    const fetchRecords = vi.fn<FetchRecords>(async () => ({ records }));
    const result = await loadPanelAssets({
      fetchRecords,
      common,
      target,
      updatedTimeFieldCode: '',
    });
    expect(result.status === 'ok' && result.assets.length).toBe(MAX_ASSETS_PER_APP);
    expect(result.status === 'ok' && result.truncated).toBe(true);
  });

  test('取得に失敗したらエラーを返す', async () => {
    const fetchRecords = vi.fn<FetchRecords>(async () => {
      throw new Error('403');
    });
    expect(
      await loadPanelAssets({ fetchRecords, common, target, updatedTimeFieldCode: '' })
    ).toEqual({ status: 'error', message: '403' });
  });
});

describe('updateAssetFields', () => {
  test('revision を付けて「状態」だけを更新し、新しい revision を返す', async () => {
    const updateRecord = vi.fn<UpdateRecord>(async () => ({ revision: '8' }));
    const result = await updateAssetFields({
      updateRecord,
      common: createTestCommonConfig({ assetAppSpaceId: '7' }),
      assetId: '3',
      revision: '7',
      patch: { enabled: false },
    });
    expect(updateRecord).toHaveBeenCalledWith({
      app: '99',
      id: '3',
      revision: '7',
      record: { status: { value: '無効' } },
      guestSpaceId: '7',
    });
    expect(result).toEqual({ status: 'ok', revision: '8' });
  });

  test('他の人が先に更新していたら conflict', async () => {
    const updateRecord = vi.fn<UpdateRecord>(async () => {
      throw { code: 'GAIA_CO02', message: 'revision mismatch' };
    });
    const result = await updateAssetFields({
      updateRecord,
      common,
      assetId: '3',
      revision: '7',
      patch: { enabled: true },
    });
    expect(result).toEqual({ status: 'error', reason: 'conflict', message: 'revision mismatch' });
  });

  test('それ以外の失敗は request-failed', async () => {
    const updateRecord = vi.fn<UpdateRecord>(async () => {
      throw new Error('権限がありません');
    });
    expect(
      await updateAssetFields({
        updateRecord,
        common,
        assetId: '3',
        revision: '7',
        patch: { enabled: true },
      })
    ).toEqual({ status: 'error', reason: 'request-failed', message: '権限がありません' });
  });

  test('対応付けていないフィールドへの書き込みは、送信せずに失敗にする', async () => {
    const updateRecord = vi.fn<UpdateRecord>(async () => ({ revision: '8' }));
    const result = await updateAssetFields({
      updateRecord,
      common: createTestCommonConfig({ orderFieldCode: '' }),
      assetId: '3',
      revision: '7',
      patch: { order: 200 },
    });
    expect(updateRecord).not.toHaveBeenCalled();
    expect(result).toMatchObject({ status: 'error', reason: 'request-failed' });
  });
});

describe('updateAssetOrders', () => {
  test('変わったレコードだけを、revisionつきでまとめて更新する', async () => {
    const updateRecords = vi.fn<UpdateRecords>(async () => ({
      records: [
        { id: '3', revision: '6' },
        { id: '5', revision: '2' },
      ],
    }));
    const result = await updateAssetOrders({
      updateRecords,
      common,
      updates: [
        { id: '3', revision: '5', order: 100 },
        { id: '5', revision: '1', order: 200 },
      ],
    });
    expect(updateRecords).toHaveBeenCalledWith({
      app: '99',
      records: [
        { id: '3', revision: '5', record: { order: { value: '100' } } },
        { id: '5', revision: '1', record: { order: { value: '200' } } },
      ],
      guestSpaceId: undefined,
    });
    expect(result).toEqual({
      status: 'ok',
      revisions: new Map([
        ['3', '6'],
        ['5', '2'],
      ]),
    });
  });

  test('変更が無ければ送信しない', async () => {
    const updateRecords = vi.fn<UpdateRecords>();
    expect(await updateAssetOrders({ updateRecords, common, updates: [] })).toEqual({
      status: 'ok',
      revisions: new Map(),
    });
    expect(updateRecords).not.toHaveBeenCalled();
  });

  test('一括リクエストの中のrevision不一致も conflict として扱う', async () => {
    const updateRecords = vi.fn<UpdateRecords>(async () => {
      throw { results: [{}, { code: 'GAIA_CO02', message: 'revision mismatch' }] };
    });
    expect(
      await updateAssetOrders({
        updateRecords,
        common,
        updates: [{ id: '3', revision: '5', order: 100 }],
      })
    ).toEqual({ status: 'error', reason: 'conflict', message: 'revision mismatch' });
  });
});

describe('deleteAssetRecord', () => {
  test('revisionつきで削除する', async () => {
    const deleteRecord = vi.fn<DeleteRecord>(async () => {});
    expect(await deleteAssetRecord({ deleteRecord, common, assetId: '3', revision: '4' })).toEqual({
      status: 'ok',
    });
    expect(deleteRecord).toHaveBeenCalledWith({
      app: '99',
      id: '3',
      revision: '4',
      guestSpaceId: undefined,
    });
  });

  test('他の人が先に更新していたら conflict', async () => {
    const deleteRecord = vi.fn<DeleteRecord>(async () => {
      throw { code: 'GAIA_CO02', message: 'revision mismatch' };
    });
    expect(
      await deleteAssetRecord({ deleteRecord, common, assetId: '3', revision: '4' })
    ).toMatchObject({
      reason: 'conflict',
    });
  });
});

describe('addAssetRecord', () => {
  test('追加したレコードのIDを返す', async () => {
    const addRecord = vi.fn<AddRecord>(async () => ({ id: '12', revision: '1' }));
    const record = { title: { value: 'a' } };
    expect(await addAssetRecord({ addRecord, common, record })).toEqual({ status: 'ok', id: '12' });
    expect(addRecord).toHaveBeenCalledWith({ app: '99', record, guestSpaceId: undefined });
  });

  test('失敗したら理由を返す', async () => {
    const addRecord = vi.fn<AddRecord>(async () => {
      throw { code: 'CB_NO02', message: '権限がありません' };
    });
    expect(await addAssetRecord({ addRecord, common, record: {} })).toEqual({
      status: 'error',
      message: '権限がありません',
    });
  });
});

describe('loadAssetAccess', () => {
  test('レコードのアクセス権をまとめて1回で取得する', async () => {
    const evaluate = vi.fn<EvaluateAcl>(async () => ({
      rights: [
        {
          id: '3',
          record: { viewable: true, editable: true, deletable: false },
          fields: { status: { viewable: true, editable: true } },
        },
      ],
    }));
    const access = await loadAssetAccess({ evaluate, common, ids: ['3', '5'] });
    expect(evaluate).toHaveBeenCalledWith({ app: '99', ids: ['3', '5'], guestSpaceId: undefined });
    expect(access.get('3')).toMatchObject({
      canToggleStatus: true,
      canDelete: false,
      unavailable: false,
    });
  });

  test('対象が無ければ呼ばない。失敗したら全て操作できない扱い(空)', async () => {
    const evaluate = vi.fn<EvaluateAcl>(async () => {
      throw new Error('x');
    });
    expect((await loadAssetAccess({ evaluate, common, ids: [] })).size).toBe(0);
    expect(evaluate).not.toHaveBeenCalled();
    expect((await loadAssetAccess({ evaluate, common, ids: ['1'] })).size).toBe(0);
  });
});

describe('revisionの検証', () => {
  test('楽観ロックに使えないrevisionでは書き込まない', async () => {
    const updateRecord = vi.fn<UpdateRecord>(async () => ({ revision: '8' }));
    const deleteRecord = vi.fn<DeleteRecord>(async () => {});
    const updateRecords = vi.fn<UpdateRecords>(async () => ({ records: [] }));
    for (const revision of ['', '-1', 'abc']) {
      expect(
        await updateAssetFields({
          updateRecord,
          common,
          assetId: '3',
          revision,
          patch: { enabled: true },
        })
      ).toMatchObject({ status: 'error' });
      expect(
        await deleteAssetRecord({ deleteRecord, common, assetId: '3', revision })
      ).toMatchObject({
        status: 'error',
      });
      expect(
        await updateAssetOrders({
          updateRecords,
          common,
          updates: [{ id: '3', revision, order: 100 }],
        })
      ).toMatchObject({ status: 'error' });
    }
    expect(updateRecord).not.toHaveBeenCalled();
    expect(deleteRecord).not.toHaveBeenCalled();
    expect(updateRecords).not.toHaveBeenCalled();
  });
});

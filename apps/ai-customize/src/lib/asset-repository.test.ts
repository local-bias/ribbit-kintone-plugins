import { describe, expect, test, vi } from 'vitest';
import { createTestCommonConfig } from '@/test/fixtures';
import { type FetchRecords, loadEnabledAssets } from './asset-repository';
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

import { describe, expect, test } from 'vitest';
import { createTestAsset } from '@/test/fixtures';
import { NO_ACCESS } from './asset-access';
import { buildAssetRows, countApplied, type PanelAsset } from './asset-panel';

const panelAsset = (overrides: Parameters<typeof createTestAsset>[0] = {}): PanelAsset => ({
  asset: createTestAsset(overrides),
  ownerName: '佐藤',
  updatedAt: null,
});

describe('buildAssetRows', () => {
  const assets = [
    panelAsset({ id: '3', kind: 'js', order: 200 }),
    panelAsset({ id: '1', kind: 'js', order: 200 }),
    panelAsset({ id: '5', kind: 'js', order: 100, enabled: false }),
    panelAsset({ id: '7', kind: 'css' }),
  ];
  const editable = { ...NO_ACCESS, canToggleStatus: true, unavailable: false };

  test('種別で絞り、実行順(order → ID)に並べる', () => {
    const rows = buildAssetRows({
      assets,
      kind: 'js',
      mutedIds: new Set(),
      appliedIds: new Set(),
      access: new Map(),
      problems: new Map(),
    });
    expect(rows.map((row) => row.asset.id)).toEqual(['5', '1', '3']);
  });

  test('スイッチの状態・適用中・権限・問題を行に載せる', () => {
    const rows = buildAssetRows({
      assets,
      kind: 'js',
      mutedIds: new Set(['3']),
      appliedIds: new Set(['1']),
      access: new Map([['1', editable]]),
      problems: new Map([['1', ['failed' as const]]]),
    });
    const byId = Object.fromEntries(rows.map((row) => [row.asset.id, row]));
    expect(byId['1']).toMatchObject({
      switchedOn: true,
      muted: false,
      applied: true,
      access: editable,
      problems: ['failed'],
    });
    expect(byId['3']).toMatchObject({ switchedOn: false, muted: true, applied: false });
    expect(byId['5']).toMatchObject({ switchedOn: false, access: NO_ACCESS, problems: [] });
  });
});

describe('countApplied', () => {
  test('このページで適用中の件数と全件数', () => {
    const rows = buildAssetRows({
      assets,
      kind: 'js',
      mutedIds: new Set(),
      appliedIds: new Set(['1', '3']),
      access: new Map(),
      problems: new Map(),
    });
    expect(countApplied(rows)).toEqual({ applied: 2, total: 3 });
  });

  const assets = [
    panelAsset({ id: '1', kind: 'js' }),
    panelAsset({ id: '3', kind: 'js' }),
    panelAsset({ id: '5', kind: 'js', enabled: false }),
  ];
});

import { describe, expect, test, vi } from 'vitest';
import { type AssetAccess, NO_ACCESS } from '@/lib/asset-access';
import { createTestAsset } from '@/test/fixtures';
import type { LauncherServices } from '../launcher/services';
import {
  mutedIdsAtom,
  panelAssetsAtom,
  panelStateAtom,
  pendingReloadIdsAtom,
  toggleAssetAtom,
} from './launcher';
import { createTestServices } from './test-services';

const editable: AssetAccess = { ...NO_ACCESS, canToggleStatus: true, unavailable: false };
const readOnly: AssetAccess = { ...NO_ACCESS, canToggleStatus: false, unavailable: false };

const setup = (overrides: Partial<LauncherServices> = {}) => {
  const css = createTestAsset({ id: '1', kind: 'css', code: '.a{}', revision: '4' });
  const js = createTestAsset({ id: '2', kind: 'js', revision: '9' });
  const { store, services } = createTestServices({
    assets: [css, js],
    access: new Map([['1', editable]]),
    overrides,
  });
  return { store, services, css, js };
};

describe('toggleAssetAtom', () => {
  test('編集できれば、revisionつきで「状態」を更新し、CSSをその場で付け直す', async () => {
    const { store, services, css } = setup();
    const outcome = await store.set(toggleAssetAtom, {
      asset: css,
      muted: false,
      access: editable,
    });

    expect(services.updateAsset).toHaveBeenCalledWith(css, { enabled: false });
    expect(outcome.variant).toBe('success');
    const assets = await store.get(panelAssetsAtom);
    expect(assets.find((item) => item.asset.id === '1')?.asset).toMatchObject({
      enabled: false,
      revision: '10',
    });
    expect(services.applyPanelChanges).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: '1', enabled: false })]),
      new Set()
    );
    expect(store.get(pendingReloadIdsAtom).size).toBe(0);
  });

  test('編集できなければ、このブラウザでだけ無効にする', async () => {
    const { store, services, css } = setup();
    const outcome = await store.set(toggleAssetAtom, {
      asset: css,
      muted: false,
      access: readOnly,
    });

    expect(services.updateAsset).not.toHaveBeenCalled();
    expect(services.writeMuted).toHaveBeenCalledWith(new Set(['1']));
    expect(store.get(mutedIdsAtom)).toEqual(new Set(['1']));
    expect(outcome).toMatchObject({ variant: 'info' });
  });

  test('ブラウザに保存できなければ、このタブだけと伝える', async () => {
    const { store, css } = setup({ writeMuted: () => false });
    const outcome = await store.set(toggleAssetAtom, {
      asset: css,
      muted: false,
      access: readOnly,
    });
    expect(outcome.message).toContain('このタブ');
  });

  test('JSも実行基盤へ伝え(取得前なら評価させない)、再読み込みが必要な一覧に入れる', async () => {
    const { store, services, js } = setup();
    await store.set(toggleAssetAtom, { asset: js, muted: false, access: editable });
    expect(services.applyPanelChanges).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: '2', enabled: false })]),
      new Set()
    );
    expect(store.get(pendingReloadIdsAtom)).toEqual(new Set(['2']));
  });

  test('他の人が先に更新していたら、一覧を取り直す', async () => {
    const { store, services, css } = setup({
      updateAsset: vi.fn(async () => ({
        status: 'error' as const,
        reason: 'conflict' as const,
        message: 'x',
      })),
    });
    await store.get(panelAssetsAtom);
    const outcome = await store.set(toggleAssetAtom, {
      asset: css,
      muted: false,
      access: editable,
    });
    await store.get(panelAssetsAtom);
    expect(outcome.variant).toBe('warning');
    expect(services.loadPanel).toHaveBeenCalledTimes(2);
  });

  test('権限が無く無効のものは、有効にできない', async () => {
    const { store, services, css } = setup();
    const outcome = await store.set(toggleAssetAtom, {
      asset: { ...css, enabled: false },
      muted: false,
      access: readOnly,
    });
    expect(outcome.variant).toBe('warning');
    expect(services.updateAsset).not.toHaveBeenCalled();
  });
});

describe('panelStateAtom', () => {
  test('変更をsessionStorageへ保存する', () => {
    const { store, services } = setup();
    store.set(panelStateAtom, { open: true, tab: 'css' });
    expect(services.writePanelState).toHaveBeenCalledWith({ open: true, tab: 'css' });
  });
});

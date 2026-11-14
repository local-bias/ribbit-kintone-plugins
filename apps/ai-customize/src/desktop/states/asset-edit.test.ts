import { describe, expect, test, vi } from 'vitest';
import { createTestAsset } from '@/test/fixtures';
import {
  codeDraftAtom,
  deleteAssetAtom,
  duplicateAssetAtom,
  reorderAssetsAtom,
  saveAssetAtom,
} from './asset-edit';
import {
  panelAssetsAtom,
  pendingReloadIdsAtom,
  reloadPanelAtom,
  selectedAssetIdAtom,
} from './launcher';
import { createTestServices } from './test-services';

const ids = async (store: ReturnType<typeof createTestServices>['store']) =>
  (await store.get(panelAssetsAtom)).map((item) => `${item.asset.id}:${item.asset.order}`);

describe('saveAssetAtom', () => {
  test('保存した内容とrevisionを一覧に重ね、CSSはその場で付け直す(再読み込み不要)', async () => {
    const css = createTestAsset({ id: '1', kind: 'css', code: '.a{}', revision: '4' });
    const { store, services } = createTestServices({ assets: [css] });
    store.set(codeDraftAtom, { assetId: '1', code: '.b{}', baseRevision: '4' });

    const outcome = await store.set(saveAssetAtom, { asset: css, patch: { code: '.b{}' } });

    expect(services.updateAsset).toHaveBeenCalledWith(css, { code: '.b{}' });
    expect(outcome.variant).toBe('success');
    const [saved] = await store.get(panelAssetsAtom);
    expect(saved?.asset).toMatchObject({ code: '.b{}', revision: '10' });
    expect(store.get(codeDraftAtom)).toBeNull();
    expect(services.applyPanelChanges).toHaveBeenCalledWith(
      [expect.objectContaining({ id: '1', code: '.b{}' })],
      new Set()
    );
    expect(store.get(pendingReloadIdsAtom).size).toBe(0);
  });

  test('JSのコードの変更と権限の付与は再読み込み待ちにし、取り消しはしない', async () => {
    const js = createTestAsset({ id: '2', kind: 'js', permissions: ['put'] });
    const { store } = createTestServices({ assets: [js] });

    await store.set(saveAssetAtom, { asset: js, patch: { permissions: [] } });
    expect(store.get(pendingReloadIdsAtom).size).toBe(0);

    await store.set(saveAssetAtom, { asset: js, patch: { permissions: ['put', 'post'] } });
    expect(store.get(pendingReloadIdsAtom)).toEqual(new Set(['2']));
  });

  test('競合したら一覧を取り直し、下書きは残す', async () => {
    const css = createTestAsset({ id: '1', kind: 'css', revision: '4' });
    const { store, services } = createTestServices({
      assets: [css],
      overrides: {
        updateAsset: vi.fn(async () => ({
          status: 'error' as const,
          reason: 'conflict' as const,
          message: 'x',
        })),
      },
    });
    await store.get(panelAssetsAtom);
    store.set(codeDraftAtom, { assetId: '1', code: '.b{}', baseRevision: '4' });

    const outcome = await store.set(saveAssetAtom, { asset: css, patch: { code: '.b{}' } });
    await store.get(panelAssetsAtom);

    expect(outcome.variant).toBe('warning');
    expect(services.loadPanel).toHaveBeenCalledTimes(2);
    expect(store.get(codeDraftAtom)).not.toBeNull();
  });
});

describe('saveAssetAtom(上書きと公開の防止)', () => {
  test('他の人の更新が入った後の古い下書きは保存しない', async () => {
    const css = createTestAsset({ id: '1', kind: 'css', revision: '7' });
    const { store, services } = createTestServices({ assets: [css] });
    store.set(codeDraftAtom, { assetId: '1', code: '.mine{}', baseRevision: '4' });

    const outcome = await store.set(saveAssetAtom, { asset: css, patch: { code: '.mine{}' } });

    expect(outcome.variant).toBe('warning');
    expect(services.updateAsset).not.toHaveBeenCalled();
  });

  test('自分の保存でrevisionが進んだときは、編集中の下書きを新しい版の上で続けられる', async () => {
    const css = createTestAsset({ id: '1', kind: 'css', revision: '4' });
    const { store } = createTestServices({ assets: [css] });
    store.set(codeDraftAtom, { assetId: '1', code: '.mine{}', baseRevision: '4' });

    await store.set(saveAssetAtom, { asset: css, patch: { permissions: ['post'] } });

    expect(store.get(codeDraftAtom)).toEqual({ assetId: '1', code: '.mine{}', baseRevision: '10' });
  });

  test('公開権限が無ければ「全員」へは保存しない', async () => {
    const css = createTestAsset({ id: '1', kind: 'css', scope: 'private' });
    const { store, services } = createTestServices({ assets: [css] });

    const outcome = await store.set(saveAssetAtom, { asset: css, patch: { scope: 'public' } });

    expect(outcome.variant).toBe('warning');
    expect(services.updateAsset).not.toHaveBeenCalled();
  });

  test('JSの通信先を外すだけなら再読み込み待ちにしない', async () => {
    const js = createTestAsset({
      id: '2',
      kind: 'js',
      externalUrls: ['https://a.example.com/', 'https://b.example.com/'],
      externalUrlsText: 'https://a.example.com/\nhttps://b.example.com/',
    });
    const { store } = createTestServices({ assets: [js] });

    await store.set(saveAssetAtom, {
      asset: js,
      patch: { externalUrlsText: 'https://a.example.com/' },
    });
    expect(store.get(pendingReloadIdsAtom).size).toBe(0);

    await store.set(saveAssetAtom, {
      asset: js,
      patch: { externalUrlsText: 'https://a.example.com/\nhttps://c.example.com/' },
    });
    expect(store.get(pendingReloadIdsAtom)).toEqual(new Set(['2']));
  });
});

describe('reorderAssetsAtom', () => {
  const setup = (overrides = {}) =>
    createTestServices({
      assets: [
        createTestAsset({ id: '1', kind: 'css', order: 100, revision: '1' }),
        createTestAsset({ id: '2', kind: 'css', order: 200, revision: '1' }),
        createTestAsset({ id: '3', kind: 'css', order: 300, revision: '1' }),
        createTestAsset({ id: '9', kind: 'js', order: 100, revision: '1' }),
      ],
      overrides,
    });

  test('種別の中で並べ替え、変わったものだけ振り直して保存する', async () => {
    const { store, services } = setup({
      updateOrders: vi.fn(async () => ({
        status: 'ok' as const,
        revisions: new Map([
          ['3', '2'],
          ['1', '2'],
          ['2', '2'],
        ]),
      })),
    });
    const outcome = await store.set(reorderAssetsAtom, { kind: 'css', from: 2, to: 0 });

    expect(services.updateOrders).toHaveBeenCalledWith([
      { id: '3', revision: '1', order: 100 },
      { id: '1', revision: '1', order: 200 },
      { id: '2', revision: '1', order: 300 },
    ]);
    expect(outcome?.variant).toBe('success');
    const assets = await store.get(panelAssetsAtom);
    expect(assets.find((item) => item.asset.id === '3')?.asset).toMatchObject({
      order: 100,
      revision: '2',
    });
    expect(services.applyPanelChanges).toHaveBeenCalled();
  });

  test('失敗したら、元へ戻すのではなく一覧を取り直す', async () => {
    const { store, services } = setup({
      updateOrders: vi.fn(async () => ({
        status: 'error' as const,
        reason: 'conflict' as const,
        message: 'x',
      })),
    });
    await store.get(panelAssetsAtom);
    const outcome = await store.set(reorderAssetsAtom, { kind: 'css', from: 0, to: 1 });

    expect(outcome?.variant).toBe('warning');
    expect(await ids(store)).toEqual(['1:100', '2:200', '3:300', '9:100']);
    expect(services.loadPanel).toHaveBeenCalledTimes(2);
  });

  test('並びが変わらなければ保存しない', async () => {
    const { store, services } = setup();
    expect(await store.set(reorderAssetsAtom, { kind: 'css', from: 1, to: 1 })).toBeNull();
    expect(services.updateOrders).not.toHaveBeenCalled();
  });
});

describe('deleteAssetAtom', () => {
  test('一覧から外し、実行基盤には無効として伝える', async () => {
    const css = createTestAsset({ id: '1', kind: 'css' });
    const other = createTestAsset({ id: '2', kind: 'css' });
    const { store, services } = createTestServices({ assets: [css, other] });
    store.set(selectedAssetIdAtom, '1');

    const outcome = await store.set(deleteAssetAtom, css);

    expect(outcome.variant).toBe('success');
    expect((await store.get(panelAssetsAtom)).map((item) => item.asset.id)).toEqual(['2']);
    expect(store.get(selectedAssetIdAtom)).toBeNull();
    expect(services.applyPanelChanges).toHaveBeenCalledWith(
      [expect.objectContaining({ id: '2' }), expect.objectContaining({ id: '1', enabled: false })],
      new Set()
    );
  });
});

describe('duplicateAssetAtom', () => {
  test('「自分だけ・無効」で末尾に複製し、強い権限は外し、一覧を取り直して複製を開く', async () => {
    const source = createTestAsset({
      id: '1',
      kind: 'css',
      title: '色',
      scope: 'public',
      enabled: true,
      order: 300,
      permissions: ['external-listed', 'unrestricted'],
    });
    const { store, services } = createTestServices({ assets: [source] });

    const outcome = await store.set(duplicateAssetAtom, source);

    expect(outcome.variant).toBe('success');
    expect(services.addAsset).toHaveBeenCalledWith(
      expect.objectContaining({
        title: { value: '色 のコピー' },
        scope: { value: '自分だけ' },
        status: { value: '無効' },
        order: { value: '400' },
        permissions: { value: ['外部通信(指定先のみ)'] },
      })
    );
    expect(store.get(selectedAssetIdAtom)).toBe('50');
    await store.get(panelAssetsAtom);
    expect(services.loadPanel).toHaveBeenCalledTimes(2);
  });
});

describe('削除後の取り直し', () => {
  test('一覧を取り直しても、削除したものは無効として実行基盤へ伝え続ける', async () => {
    const css = createTestAsset({ id: '1', kind: 'css' });
    const other = createTestAsset({ id: '2', kind: 'css', revision: '3' });
    const { store, services } = createTestServices({ assets: [css, other] });
    await store.set(deleteAssetAtom, css);
    store.set(reloadPanelAtom);

    await store.set(saveAssetAtom, { asset: other, patch: { code: '.x{}' } });

    expect(services.applyPanelChanges).toHaveBeenLastCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: '1', enabled: false })]),
      new Set()
    );
  });
});

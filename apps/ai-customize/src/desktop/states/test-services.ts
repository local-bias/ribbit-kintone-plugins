import { createStore } from '@repo/jotai';
import { vi } from 'vitest';
import type { AssetAccess } from '@/lib/asset-access';
import type { PanelAsset } from '@/lib/asset-panel';
import type { Asset } from '@/schema/asset';
import { createTestCommonConfig } from '@/test/fixtures';
import type { LauncherServices } from '../launcher/services';
import { servicesAtom } from './launcher';

/** テスト用: 入出力をモックにしたランチャーの窓口と、それを設定したストア */
export const createTestServices = (params: {
  assets: readonly Asset[];
  access?: ReadonlyMap<string, AssetAccess>;
  overrides?: Partial<LauncherServices>;
}) => {
  const items: PanelAsset[] = params.assets.map((asset) => ({
    asset,
    ownerName: '佐藤',
    updatedAt: null,
  }));
  const services: LauncherServices = {
    target: { spaceId: '0', appId: '42' },
    common: createTestCommonConfig(),
    loginUserCode: 'sato',
    safeMode: false,
    loadPanel: vi.fn(async () => ({
      assets: items,
      access: params.access ?? new Map(),
      skipped: [],
      truncated: false,
    })),
    updateAsset: vi.fn(async () => ({ status: 'ok' as const, revision: '10' })),
    updateOrders: vi.fn(async () => ({ status: 'ok' as const, revisions: new Map() })),
    deleteAsset: vi.fn(async () => ({ status: 'ok' as const })),
    addAsset: vi.fn(async () => ({ status: 'ok' as const, id: '50', revision: '1' })),
    loadCanPublish: vi.fn(async () => false),
    loadCanChat: vi.fn(async () => true),
    createChatRuntime: vi.fn(async () => {
      throw new Error('chat runtime is not mocked');
    }),
    readMuted: () => new Set(),
    writeMuted: vi.fn(() => true),
    applyPanelChanges: vi.fn(),
    readPanelState: () => ({ open: false, tab: 'js' }),
    writePanelState: vi.fn(),
    recordPath: (id) => `/k/99/show#record=${id}`,
    ...params.overrides,
  };
  const store = createStore();
  store.set(servicesAtom, services);
  return { store, services };
};

import { vi } from 'vitest';
import type { AssetAccess } from '@/lib/asset-access';
import type { Asset } from '@/schema/asset';
import type { WriteToolServices } from './write-tools';

/** テスト用: 全て操作できるアクセス権 */
export const FULL_ACCESS: AssetAccess = {
  canToggleStatus: true,
  canChangeScope: true,
  canReorder: true,
  canEditCode: true,
  canEditPermissions: true,
  canEditExternalUrls: true,
  canDelete: true,
  unavailable: false,
};

/** テスト用: 入出力をモックにした書き込みツールの窓口 */
export const createTestWriteServices = (
  params: {
    assets?: readonly Asset[];
    access?: AssetAccess | null;
    canPublish?: boolean;
    overrides?: Partial<WriteToolServices>;
  } = {}
): WriteToolServices => {
  const assets = new Map((params.assets ?? []).map((asset) => [asset.id, asset]));
  return {
    target: { spaceId: '0', appId: '42' },
    loginUserCode: 'sato',
    origin: 'https://example.cybozu.com',
    mapped: { externalUrls: true, description: true, screens: true, order: true },
    checkJsSyntax: () => null,
    loadAsset: vi.fn(async (id: string) => assets.get(id) ?? null),
    loadAccess: vi.fn(async () => (params.access === undefined ? FULL_ACCESS : params.access)),
    canPublish: vi.fn(async () => params.canPublish ?? false),
    countAssets: vi.fn(async () => assets.size),
    createAsset: vi.fn(async () => ({ status: 'ok' as const, id: '50', revision: '1' })),
    updateAsset: vi.fn(async () => ({ status: 'ok' as const, revision: '11' })),
    deleteAsset: vi.fn(async () => ({ status: 'ok' as const })),
    previewCss: vi.fn(() => true),
    recordUrl: (id) => `https://example.cybozu.com/k/99/show#record=${id}`,
    onChanged: vi.fn(),
    ...params.overrides,
  };
};

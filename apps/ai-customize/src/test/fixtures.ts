import { createCommonConfig } from '@/lib/plugin';
import type { Asset } from '@/schema/asset';
import type { PluginCommonConfig } from '@/schema/plugin-config';

/** テスト用: 全フィールドを対応付けた共通設定 */
export const createTestCommonConfig = (
  overrides: Partial<PluginCommonConfig> = {}
): PluginCommonConfig => ({
  ...createCommonConfig(),
  assetAppId: '99',
  titleFieldCode: 'title',
  targetAppIdFieldCode: 'targetAppId',
  targetSpaceIdFieldCode: 'targetSpaceId',
  kindFieldCode: 'kind',
  codeFieldCode: 'code',
  scopeFieldCode: 'scope',
  statusFieldCode: 'status',
  ownerFieldCode: '作成者',
  permissionsFieldCode: 'permissions',
  externalUrlsFieldCode: 'externalUrls',
  orderFieldCode: 'order',
  screensFieldCode: 'screens',
  descriptionFieldCode: 'description',
  ...overrides,
});

/** テスト用: アセット */
export const createTestAsset = (overrides: Partial<Asset> = {}): Asset => ({
  id: '1',
  revision: '1',
  title: 'テスト',
  targetAppId: '42',
  targetSpaceId: '0',
  kind: 'js',
  scope: 'public',
  enabled: true,
  ownerCode: 'sato',
  code: 'kintone.events.on("app.record.detail.show", (event) => event);',
  order: 100,
  screens: [],
  description: '',
  permissions: [],
  externalUrls: [],
  externalUrlsText: '',
  invalidExternalUrls: [],
  externalUrlWarnings: [],
  configurationIssues: [],
  ...overrides,
});

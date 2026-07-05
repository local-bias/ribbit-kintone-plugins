import { describe, expect, test, vi } from 'vitest';
import type { PluginCondition } from '@/schema/plugin-config';
import { createConfig, getNewCondition, isPluginConditionMet, migrateConfig } from './plugin';

vi.mock('@konomi-app/kintone-utilities', () => ({
  restorePluginConfig: vi.fn(),
}));

vi.mock('./global', () => ({
  isProd: true,
  PLUGIN_ID: 'test-plugin-id',
}));

const createBaseCondition = (overrides: Partial<PluginCondition> = {}): PluginCondition => ({
  ...getNewCondition(),
  targetSpaceId: 'space-1',
  parentFolderId: 'parent-folder-1',
  folderIdFieldCode: 'driveFolderId',
  ...overrides,
});

describe('getNewCondition', () => {
  test('必須項目が空の新規条件を生成する', () => {
    const condition = getNewCondition();
    expect(condition).toMatchObject({
      memo: '',
      targetSpaceId: '',
      parentFolderId: '',
      folderIdFieldCode: '',
      folderNameFieldCodes: [],
    });
    expect(condition.id).toEqual(expect.any(String));
  });
});

describe('createConfig', () => {
  test('共通設定と1件の初期条件を持つひな形を生成する', () => {
    const config = createConfig();
    expect(config.version).toBe(1);
    expect(config.common).toEqual({ oauthClientId: '', oauthClientSecret: '' });
    expect(config.conditions).toHaveLength(1);
  });
});

describe('isPluginConditionMet', () => {
  test('最新形式のスキーマに合致する条件はtrueを返す', () => {
    expect(isPluginConditionMet(createBaseCondition())).toBe(true);
  });

  test('必須フィールドが欠けた条件はfalseを返す', () => {
    const { targetSpaceId, ...rest } = createBaseCondition();
    expect(isPluginConditionMet(rest)).toBe(false);
  });
});

describe('migrateConfig', () => {
  test('version: 1の設定情報はそのまま返却する', () => {
    const config = createConfig();
    expect(migrateConfig(config)).toBe(config);
  });

  test('versionが未指定の設定情報をversion: 1として補正する', () => {
    const migrated = migrateConfig({
      common: { oauthClientId: 'client-id' },
      conditions: [createBaseCondition()],
    } as never);
    expect(migrated.version).toBe(1);
  });
});

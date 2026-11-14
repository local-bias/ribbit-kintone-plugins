import { describe, expect, test } from 'vitest';
import type { AnyPluginConfig } from '@/schema/plugin-config';
import { createTestCommonConfig } from '@/test/fixtures';
import { createConfig, getMissingRequiredFieldKeys, isUsableConfig, migrateConfig } from './plugin';

describe('migrateConfig', () => {
  test('欠けた項目と型の壊れた値を既定値で補完する', () => {
    const saved = {
      version: 1,
      common: { assetAppId: '5', titleFieldCode: 42, statusEnabledValue: 'ON' },
      conditions: [{ id: 'x' }],
    } as unknown as AnyPluginConfig;
    const migrated = migrateConfig(saved);
    expect(migrated.common.assetAppId).toBe('5');
    expect(migrated.common.titleFieldCode).toBe('');
    expect(migrated.common.statusEnabledValue).toBe('ON');
    expect(migrated.common.permissionPutValue).toBe('更新(PUT)');
    expect(migrated.conditions).toEqual([]);
  });

  test('未知のバージョンでも落ちない', () => {
    const migrated = migrateConfig({ version: 99, common: {} } as unknown as AnyPluginConfig);
    expect(migrated).toEqual(createConfig());
  });
});

describe('isUsableConfig', () => {
  test('全ての必須フィールドが対応付けられていれば使える', () => {
    expect(isUsableConfig(createTestCommonConfig())).toBe(true);
  });

  test('任意フィールドが未設定でも使える', () => {
    expect(
      isUsableConfig(
        createTestCommonConfig({
          externalUrlsFieldCode: '',
          orderFieldCode: '',
          screensFieldCode: '',
          descriptionFieldCode: '',
        })
      )
    ).toBe(true);
  });

  test.each([
    ['titleFieldCode'],
    ['targetAppIdFieldCode'],
    ['targetSpaceIdFieldCode'],
    ['kindFieldCode'],
    ['codeFieldCode'],
    ['scopeFieldCode'],
    ['statusFieldCode'],
    ['ownerFieldCode'],
    ['permissionsFieldCode'],
  ] as const)('%s が未設定なら使えない', (key) => {
    const common = createTestCommonConfig({ [key]: '' });
    expect(isUsableConfig(common)).toBe(false);
    expect(getMissingRequiredFieldKeys(common)).toEqual([key]);
  });

  test.each([[''], ['abc'], ['1 or 1']])('管理アプリID %j は使えない', (assetAppId) => {
    expect(isUsableConfig(createTestCommonConfig({ assetAppId }))).toBe(false);
  });
});

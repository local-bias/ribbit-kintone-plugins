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

  test('配列の項目は文字列の要素だけを残し、配列でなければ既定値(空)にする', () => {
    const saved = {
      version: 1,
      common: { publishAllowedUsers: ['sato', 1, null], publishAllowedGroups: 'admins' },
    } as unknown as AnyPluginConfig;
    const { common } = migrateConfig(saved);
    expect(common.publishAllowedUsers).toEqual(['sato']);
    expect(common.publishAllowedGroups).toEqual([]);
    expect(common.publishAllowedOrganizations).toEqual([]);
  });

  test('数値・真偽値・選択肢の項目は、型とスキーマの制約に合わなければ既定値にする', () => {
    const saved = {
      version: 1,
      common: {
        providerType: 'unknown-ai',
        maxToolSteps: 100,
        maxOutputTokens: 2048,
        temperature: 'hot',
        sendsRecordToAi: 'true',
        savesConversation: true,
      },
    } as unknown as AnyPluginConfig;
    const { common } = migrateConfig(saved);
    expect(common).toMatchObject({
      providerType: 'openai',
      maxToolSteps: 8,
      maxOutputTokens: 2048,
      temperature: null,
      sendsRecordToAi: false,
      savesConversation: true,
    });
    expect(
      migrateConfig({ version: 1, common: { temperature: 0.2 } } as unknown as AnyPluginConfig)
        .common.temperature
    ).toBe(0.2);
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

describe('createCommonConfig と スキーマ', () => {
  test('既定値はスキーマを満たす(手書きの検証とスキーマがずれていない)', async () => {
    const { PluginCommonConfigSchema } = await import('@/schema/plugin-config');
    expect(PluginCommonConfigSchema.safeParse(createConfig().common).success).toBe(true);
  });

  test('補完した設定は、どんな保存値からでもスキーマを満たす', async () => {
    const { PluginCommonConfigSchema } = await import('@/schema/plugin-config');
    const broken = {
      version: 1,
      common: {
        temperature: 5,
        maxOutputTokens: 1.5,
        maxToolSteps: Number.NaN,
        providerType: 3,
        chatAllowedUsers: [1, 'a'],
      },
    } as unknown as AnyPluginConfig;
    expect(PluginCommonConfigSchema.safeParse(migrateConfig(broken).common).success).toBe(true);
  });
});

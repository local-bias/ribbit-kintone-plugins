import { describe, expect, test } from 'vitest';
import type { AnyPluginConfig } from '@/schema/plugin-config';
import { createConfig, getNewCommonConfig, migrateConfig } from './plugin';

describe('getNewCommonConfig - 共通設定の初期値', () => {
  test('ラベル・見出しは空文字列で、操作画面側の既定文言にフォールバックさせる', () => {
    expect(getNewCommonConfig()).toEqual({
      csvImport: { enabled: false, buttonLabel: '' },
      recordErrorHeading: '',
    });
  });
});

describe('createConfig - 設定のひな形', () => {
  test('最新バージョンの設定を返す', () => {
    const config = createConfig();
    expect(config.version).toBe(3);
    expect(config.common.recordErrorHeading).toBe('');
  });
});

describe('migrateConfig - 設定情報のマイグレーション', () => {
  test('V1 の設定を最新バージョンへ変換する', () => {
    const v1 = {
      version: 1,
      common: { csvImport: { enabled: true, buttonLabel: '取込' } },
      conditions: [
        {
          id: 'c1',
          fieldCode: 'name',
          targetEvents: ['create'],
          showErrorOnChange: true,
          rules: [],
        },
      ],
    } as unknown as AnyPluginConfig;

    const migrated = migrateConfig(v1);

    expect(migrated.version).toBe(3);
    // V1 -> V2 で適用条件が補完される
    expect(migrated.conditions[0]?.applyConditions).toEqual([]);
    // V2 -> V3 で見出しが補完され、既存の共通設定は保持される
    expect(migrated.common.recordErrorHeading).toBe('');
    expect(migrated.common.csvImport).toEqual({ enabled: true, buttonLabel: '取込' });
  });

  test('V2 の設定に保存エラーの見出しを補完する', () => {
    const v2 = {
      version: 2,
      common: { csvImport: { enabled: false, buttonLabel: '' } },
      conditions: [
        {
          id: 'c1',
          fieldCode: 'name',
          targetEvents: ['create', 'edit'],
          showErrorOnChange: false,
          applyConditions: [{ fieldCode: 'status', conditionType: 'equal' }],
          rules: [{ id: 'r1', type: 'required', value: '', errorMessage: 'NG' }],
        },
      ],
    } as unknown as AnyPluginConfig;

    const migrated = migrateConfig(v2);

    expect(migrated.version).toBe(3);
    expect(migrated.common.recordErrorHeading).toBe('');
    // 条件は V2 から変更しないため、そのまま引き継がれる
    expect(migrated.conditions[0]?.applyConditions).toEqual([
      { fieldCode: 'status', conditionType: 'equal' },
    ]);
  });

  test('V3 で設定済みの見出しは上書きしない', () => {
    const v3 = {
      version: 3,
      common: {
        csvImport: { enabled: false, buttonLabel: '' },
        recordErrorHeading: 'カスタム見出し',
      },
      conditions: [],
    } as unknown as AnyPluginConfig;

    expect(migrateConfig(v3).common.recordErrorHeading).toBe('カスタム見出し');
  });

  test('バージョンが無い設定は V1 とみなして変換する', () => {
    const legacy = { conditions: [] } as unknown as AnyPluginConfig;

    const migrated = migrateConfig(legacy);

    expect(migrated.version).toBe(3);
    expect(migrated.common).toEqual(getNewCommonConfig());
  });
});

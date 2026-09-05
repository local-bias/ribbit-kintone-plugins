import { describe, expect, test, vi } from 'vitest';
import { AnyPluginConfigSchema, LatestPluginConditionSchema } from '@/schema/plugin-config';
import { DEFAULT_TAB_WIDTH, MAX_TAB_WIDTH, MIN_TAB_WIDTH } from './constants';
import {
  createConfig,
  getNewCondition,
  isPluginConditionMet,
  migrateConfig,
  normalizeTabWidth,
} from './plugin';

vi.mock('@konomi-app/kintone-utilities', () => ({
  restorePluginConfig: vi.fn(),
}));

vi.mock('./global', () => ({
  isProd: true,
  PLUGIN_ID: 'test-plugin-id',
}));

describe('createConfig', () => {
  test('最新バージョンの設定情報を生成する', () => {
    const config = createConfig();

    expect(config.version).toBe(5);
    expect(config.common).toEqual({
      tabWidth: DEFAULT_TAB_WIDTH,
      remembersSelectedTab: true,
      notifiesMissingRequiredFields: true,
      newElementPolicy: 'show',
      collapsesEmptyRows: true,
    });
    expect(config.conditions).toHaveLength(1);
  });

  test('生成した設定情報は最新のスキーマを満たす', () => {
    expect(AnyPluginConfigSchema.safeParse(createConfig()).success).toBe(true);
  });
});

describe('getNewCondition', () => {
  test('条件ごとに一意なIDが払い出される', () => {
    expect(getNewCondition().id).not.toBe(getNewCondition().id);
  });

  test('生成した条件は最新のスキーマを満たす', () => {
    expect(LatestPluginConditionSchema.safeParse(getNewCondition()).success).toBe(true);
  });
});

describe('isPluginConditionMet', () => {
  test('最新の形式の条件を受け入れる', () => {
    expect(isPluginConditionMet(getNewCondition())).toBe(true);
  });

  test('IDを持たない古い形式の条件を拒否する', () => {
    const { id: _id, ...conditionWithoutId } = getNewCondition();
    expect(isPluginConditionMet(conditionWithoutId)).toBe(false);
  });

  test('条件ではない値を拒否する', () => {
    expect(isPluginConditionMet(null)).toBe(false);
    expect(isPluginConditionMet('condition')).toBe(false);
  });
});

describe('migrateConfig', () => {
  const v1Condition = {
    tabName: 'すべて',
    tabIcon: '',
    displayMode: 'add' as const,
    fields: ['field1', ''],
    labelDisplayMode: 'sub' as const,
    labels: ['ラベル', ''],
    groupDisplayMode: 'add' as const,
    groups: ['group1', ''],
    spaceDisplayMode: 'sub' as const,
    spaceIds: ['space1', ''],
    hidesHR: true,
  };

  test('v1の設定情報を最新バージョンへ変換する', () => {
    const migrated = migrateConfig({ version: 1, conditions: [v1Condition] });

    expect(migrated.version).toBe(5);
    expect(migrated.common.tabWidth).toBe(DEFAULT_TAB_WIDTH);
    expect(migrated.conditions).toHaveLength(1);
    expect(migrated.conditions[0]).toMatchObject({ id: expect.any(String) });
  });

  test('v1の`displayMode`を`fieldDisplayMode`へ引き継ぎ、空文字を除去する', () => {
    const migrated = migrateConfig({ version: 1, conditions: [v1Condition] });

    expect(migrated.conditions[0]).toMatchObject({
      tabName: 'すべて',
      fieldDisplayMode: 'add',
      fields: ['field1'],
      labelDisplayMode: 'sub',
      labels: ['ラベル'],
      groupDisplayMode: 'add',
      groups: ['group1'],
      spaceDisplayMode: 'sub',
      spaceIds: ['space1'],
    });
  });

  test('v4で追加された項目は既定値で補完される', () => {
    const [condition] = migrateConfig({ version: 1, conditions: [v1Condition] }).conditions;

    expect(condition).toMatchObject({
      targetScreens: ['create', 'edit', 'detail'],
      displayConditions: [],
      displayConditionLogic: 'and',
      viewerUsers: [],
      viewerGroups: [],
      viewerOrganizations: [],
      statuses: [],
    });
  });

  test('v3の設定情報はタブの幅を維持したままv4へ変換される', () => {
    const migrated = migrateConfig({
      version: 3,
      common: { tabWidth: 240 },
      conditions: [
        {
          id: 'stable-id',
          tabName: 'すべて',
          fieldDisplayMode: 'sub',
          fields: [],
          labelDisplayMode: 'sub',
          labels: [],
          groupDisplayMode: 'sub',
          groups: [],
          spaceDisplayMode: 'sub',
          spaceIds: [],
          hidesHR: false,
        },
      ],
    });

    expect(migrated.version).toBe(5);
    expect(migrated.common.tabWidth).toBe(240);
    expect(migrated.conditions[0]).toMatchObject({
      id: 'stable-id',
      targetScreens: ['create', 'edit', 'detail'],
    });
  });

  test('v5では`hidesHR`を廃止し、罫線の表示方法へ引き継ぐ', () => {
    const hidden = migrateConfig({ version: 1, conditions: [v1Condition] });
    // 「罫線を全て非表示」は、「指定した罫線だけ表示」+ 対象なしと同じ意味になる
    expect(hidden.conditions[0]).toMatchObject({ hrDisplayMode: 'add', hrs: [] });
    expect(hidden.conditions[0]).not.toHaveProperty('hidesHR');

    const shown = migrateConfig({
      version: 1,
      conditions: [{ ...v1Condition, hidesHR: false }],
    });
    expect(shown.conditions[0]).toMatchObject({ hrDisplayMode: 'sub', hrs: [] });
  });

  test('v3では削除された`tabIcon`を引き継がない', () => {
    const migrated = migrateConfig({ version: 1, conditions: [v1Condition] });

    expect(migrated.conditions[0]).not.toHaveProperty('tabIcon');
  });

  test('v2の設定情報はIDを維持したまま変換される', () => {
    const migrated = migrateConfig({
      version: 2,
      conditions: [{ ...v1Condition, id: 'stable-id' }],
    });

    expect(migrated.conditions[0]).toMatchObject({ id: 'stable-id' });
  });

  test('省略されていた表示方法は`sub`で補完される', () => {
    const migrated = migrateConfig({
      version: 2,
      conditions: [
        {
          ...v1Condition,
          id: 'stable-id',
          labelDisplayMode: undefined,
          groupDisplayMode: undefined,
          spaceDisplayMode: undefined,
        },
      ],
    });

    expect(migrated.conditions[0]).toMatchObject({
      labelDisplayMode: 'sub',
      groupDisplayMode: 'sub',
      spaceDisplayMode: 'sub',
    });
  });

  test('変換後の設定情報は最新のスキーマを満たす', () => {
    const migrated = migrateConfig({ version: 1, conditions: [v1Condition] });

    expect(AnyPluginConfigSchema.safeParse(migrated).success).toBe(true);
  });

  test('最新バージョンの設定情報は内容を保ったまま返却される', () => {
    const config = createConfig();

    expect(migrateConfig(config)).toEqual(config);
  });

  test('共通設定が欠けている最新バージョンの設定情報は、既定値で補完される', () => {
    const config = createConfig();
    const { common: _common, ...withoutCommon } = config;

    const migrated = migrateConfig(withoutCommon as typeof config);

    expect(migrated.common).toEqual({
      tabWidth: DEFAULT_TAB_WIDTH,
      remembersSelectedTab: true,
      notifiesMissingRequiredFields: true,
      newElementPolicy: 'show',
      collapsesEmptyRows: true,
    });
    expect(migrated.conditions).toEqual(config.conditions);
  });

  test('タブ設定に欠けている項目も既定値で補完される', () => {
    const config = createConfig();
    const [first] = config.conditions;
    const {
      targetScreens: _screens,
      statuses: _statuses,
      hrDisplayMode: _hrDisplayMode,
      hrs: _hrs,
      ...partial
    } = { ...first };
    const migrated = migrateConfig({
      ...config,
      conditions: [partial as (typeof config.conditions)[number]],
    });

    expect(migrated.conditions[0]).toMatchObject({
      targetScreens: ['create', 'edit', 'detail'],
      statuses: [],
      hrDisplayMode: 'sub',
      hrs: [],
    });
  });

  test('範囲外のタブの幅は設定可能な範囲へ収められる', () => {
    const config = createConfig();

    expect(
      migrateConfig({ ...config, common: { ...config.common, tabWidth: 10000 } }).common.tabWidth
    ).toBe(MAX_TAB_WIDTH);
  });
});

describe('normalizeTabWidth', () => {
  test('設定可能な範囲の値はそのまま使用する', () => {
    expect(normalizeTabWidth(200)).toBe(200);
    expect(normalizeTabWidth(MIN_TAB_WIDTH)).toBe(MIN_TAB_WIDTH);
    expect(normalizeTabWidth(MAX_TAB_WIDTH)).toBe(MAX_TAB_WIDTH);
  });

  test('範囲外の値は下限・上限へ丸める', () => {
    expect(normalizeTabWidth(MIN_TAB_WIDTH - 1)).toBe(MIN_TAB_WIDTH);
    expect(normalizeTabWidth(MAX_TAB_WIDTH + 1)).toBe(MAX_TAB_WIDTH);
    expect(normalizeTabWidth(-100)).toBe(MIN_TAB_WIDTH);
  });

  test('小数は整数へ丸める', () => {
    expect(normalizeTabWidth(190.4)).toBe(190);
    expect(normalizeTabWidth(190.6)).toBe(191);
  });

  test('数値以外・数値として扱えない値は既定値を返す', () => {
    expect(normalizeTabWidth(undefined)).toBe(DEFAULT_TAB_WIDTH);
    expect(normalizeTabWidth(null)).toBe(DEFAULT_TAB_WIDTH);
    expect(normalizeTabWidth('190')).toBe(DEFAULT_TAB_WIDTH);
    expect(normalizeTabWidth(Number.NaN)).toBe(DEFAULT_TAB_WIDTH);
    expect(normalizeTabWidth(Number.POSITIVE_INFINITY)).toBe(DEFAULT_TAB_WIDTH);
  });
});

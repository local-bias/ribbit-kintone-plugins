import { describe, expect, test, vi } from 'vitest';
import {
  DEFAULT_AGGREGATION_DECIMAL_DIGITS,
  DEFAULT_AGGREGATION_ROUNDING_MODE,
  DEFAULT_RECORDS_PER_PAGE,
  MAX_RECORDS_PER_PAGE,
  MIN_AGGREGATION_DECIMAL_DIGITS,
  type PluginCondition,
} from '../schema/plugin-config';
import { getNewCondition, isUsagePluginConditionMet, migrateConfig } from './plugin';

vi.mock('@konomi-app/kintone-utilities', () => ({
  restorePluginConfig: vi.fn(),
}));

vi.mock('./global', () => ({
  isProd: true,
  PLUGIN_ID: 'test-plugin-id',
}));

const createBaseCondition = (overrides: Partial<PluginCondition> = {}): PluginCondition => ({
  ...getNewCondition(),
  targetSpaceId: 'space',
  relatedAppId: '10',
  currentAppFieldCode: 'currentKey',
  relatedAppFieldCode: 'relatedKey',
  relatedQueryConditions: [
    {
      id: 'query-condition-1',
      type: 'equal',
      currentAppFieldCode: 'currentKey',
      relatedAppFieldCode: 'relatedKey',
    },
  ],
  relatedRecordFieldCodes: ['customer'],
  ...overrides,
});

describe('reference table plugin config helpers', () => {
  test('サブテーブル未設定でも関連レコードフィールドがあれば利用条件を満たす', () => {
    expect(
      isUsagePluginConditionMet(
        createBaseCondition({
          relatedSubtableCode: '',
          subtableFieldCodes: [],
        })
      )
    ).toBe(true);
  });

  test('関連レコードフィールドがなくてもサブテーブル列があれば利用条件を満たす', () => {
    expect(
      isUsagePluginConditionMet(
        createBaseCondition({
          relatedRecordFieldCodes: [],
          relatedSubtableCode: 'items',
          subtableFieldCodes: ['amount'],
        })
      )
    ).toBe(true);
  });

  test('表示するフィールドが1つもない場合は利用条件を満たさない', () => {
    expect(
      isUsagePluginConditionMet(
        createBaseCondition({
          relatedRecordFieldCodes: [],
          relatedSubtableCode: '',
          subtableFieldCodes: [],
        })
      )
    ).toBe(false);
  });

  test('取得条件が1つもない場合は利用条件を満たさない', () => {
    expect(
      isUsagePluginConditionMet(
        createBaseCondition({
          currentAppFieldCode: '',
          relatedAppFieldCode: '',
          relatedQueryConditions: [],
        })
      )
    ).toBe(false);
  });

  test('既存設定に新しい表示件数と集計設定の既定値を補完する', () => {
    const migrated = migrateConfig({
      version: 1,
      common: { memo: 'memo' },
      conditions: [
        {
          id: 'condition-1',
          memo: '',
          targetSpaceId: 'space',
          relatedAppId: '10',
          currentAppFieldCode: 'currentKey',
          relatedAppFieldCode: 'relatedKey',
          relatedSubtableCode: '',
          relatedRecordFieldCodes: ['customer'],
          subtableFieldCodes: [],
          mergeRelatedRecordFields: true,
          filterSubtableRowsByMatchingField: false,
          showFieldAggregations: false,
          sortFieldCode: '$id',
          sortOrder: 'asc',
        },
      ],
    });

    expect(migrated.conditions[0]).toMatchObject({
      relatedAppGuestSpaceId: '',
      relatedQueryConditions: [
        {
          id: expect.any(String),
          type: 'equal',
          currentAppFieldCode: 'currentKey',
          relatedAppFieldCode: 'relatedKey',
        },
      ],
      recordsPerPage: DEFAULT_RECORDS_PER_PAGE,
      aggregationRoundingMode: DEFAULT_AGGREGATION_ROUNDING_MODE,
      aggregationDecimalDigits: DEFAULT_AGGREGATION_DECIMAL_DIGITS,
    });
  });

  test('片方だけ残った旧照合フィールドからは不完全な取得条件を作らない', () => {
    const migrated = migrateConfig({
      version: 1,
      common: { memo: 'memo' },
      conditions: [
        {
          id: 'condition-1',
          memo: '',
          targetSpaceId: 'space',
          relatedAppId: '10',
          currentAppFieldCode: 'currentKey',
          relatedAppFieldCode: '',
          relatedSubtableCode: '',
          relatedRecordFieldCodes: ['customer'],
          subtableFieldCodes: [],
          mergeRelatedRecordFields: true,
          filterSubtableRowsByMatchingField: false,
          showFieldAggregations: false,
          sortFieldCode: '$id',
          sortOrder: 'asc',
        },
      ],
    });

    expect(migrated.conditions[0]?.relatedQueryConditions).toEqual([
      {
        id: expect.any(String),
        type: 'equal',
        currentAppFieldCode: '',
        relatedAppFieldCode: '',
      },
    ]);
    const migratedCondition = migrated.conditions[0];
    expect(migratedCondition).toBeDefined();
    if (!migratedCondition) {
      throw new Error('Migrated condition was not created.');
    }
    expect(isUsagePluginConditionMet(migratedCondition)).toBe(false);
  });

  test('version未指定の設定と範囲外の新設定を最新形式に補正する', () => {
    const migrated = migrateConfig({
      common: { memo: 'memo' },
      conditions: [
        {
          id: 'condition-1',
          memo: '',
          targetSpaceId: 'space',
          relatedAppId: '10',
          currentAppFieldCode: 'currentKey',
          relatedAppFieldCode: 'relatedKey',
          relatedSubtableCode: '',
          relatedRecordFieldCodes: ['customer'],
          subtableFieldCodes: [],
          mergeRelatedRecordFields: true,
          filterSubtableRowsByMatchingField: false,
          showFieldAggregations: false,
          recordsPerPage: 9999,
          aggregationRoundingMode: 'unsupported',
          aggregationDecimalDigits: -10,
          sortFieldCode: '$id',
          sortOrder: 'asc',
        },
      ],
    });

    expect(migrated).toMatchObject({ version: 1, common: { memo: 'memo' } });
    expect(migrated.conditions[0]).toMatchObject({
      relatedQueryConditions: [
        {
          id: expect.any(String),
          type: 'equal',
          currentAppFieldCode: 'currentKey',
          relatedAppFieldCode: 'relatedKey',
        },
      ],
      recordsPerPage: MAX_RECORDS_PER_PAGE,
      aggregationRoundingMode: DEFAULT_AGGREGATION_ROUNDING_MODE,
      aggregationDecimalDigits: MIN_AGGREGATION_DECIMAL_DIGITS,
    });
  });

  test('保存済みの複数取得条件を最新形式として復元する', () => {
    const migrated = migrateConfig({
      common: { memo: 'memo' },
      conditions: [
        {
          id: 'condition-1',
          memo: '',
          targetSpaceId: 'space',
          relatedAppId: '10',
          currentAppFieldCode: 'legacyCurrent',
          relatedAppFieldCode: 'legacyRelated',
          relatedQueryConditions: [
            {
              id: 'query-condition-1',
              type: 'include',
              currentAppFieldCode: 'keyword',
              relatedAppFieldCode: 'description',
            },
            {
              id: 'query-condition-2',
              type: 'greaterOrEqual',
              currentAppFieldCode: 'minAmount',
              relatedAppFieldCode: 'amount',
            },
          ],
          relatedSubtableCode: '',
          relatedRecordFieldCodes: ['customer'],
          subtableFieldCodes: [],
          mergeRelatedRecordFields: true,
          filterSubtableRowsByMatchingField: false,
          showFieldAggregations: false,
          recordsPerPage: 20,
          aggregationRoundingMode: 'round',
          aggregationDecimalDigits: 10,
          sortFieldCode: '$id',
          sortOrder: 'asc',
        },
      ],
    });

    expect(migrated.conditions[0]?.relatedQueryConditions).toEqual([
      {
        id: 'query-condition-1',
        type: 'include',
        currentAppFieldCode: 'keyword',
        relatedAppFieldCode: 'description',
      },
      {
        id: 'query-condition-2',
        type: 'greaterOrEqual',
        currentAppFieldCode: 'minAmount',
        relatedAppFieldCode: 'amount',
      },
    ]);
  });
});

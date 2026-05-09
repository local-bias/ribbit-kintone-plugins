import { restorePluginConfig as primitiveRestore } from '@konomi-app/kintone-utilities';
import { nanoid } from 'nanoid';
import {
  AggregationRoundingModeSchema,
  DEFAULT_AGGREGATION_DECIMAL_DIGITS,
  DEFAULT_AGGREGATION_ROUNDING_MODE,
  DEFAULT_RECORDS_PER_PAGE,
  LatestPluginConditionSchema,
  MAX_AGGREGATION_DECIMAL_DIGITS,
  MAX_RECORDS_PER_PAGE,
  MIN_AGGREGATION_DECIMAL_DIGITS,
  MIN_RECORDS_PER_PAGE,
  type PluginCondition,
  type PluginConfig,
  type RelatedQueryCondition,
  RelatedQueryConditionSchema,
  RelatedQueryConditionTypeSchema,
} from '../schema/plugin-config';
import { isProd, PLUGIN_ID } from './global';

/**
 * プラグインの設定情報が、最新の設定情報の形式に準拠しているか検証します
 *
 * @param condition - 検証する条件オブジェクト
 * @returns プラグインの設定情報が最新の形式に準拠している場合は`true`、そうでない場合は`false`
 */
export const isPluginConditionMet = (condition: unknown): boolean => {
  return LatestPluginConditionSchema.safeParse(condition).success;
};

/**
 * 操作画面でプラグインを有効にするための最小要件を満たしているか検証します
 *
 * この条件を満たさない場合、設定情報は無効となり、操作画面では対象としません
 *
 * @param condition - 検証する条件オブジェクト
 * @returns プラグインの設定情報が利用条件を満たしている場合は`true`、そうでない場合は`false`
 */
export const isUsagePluginConditionMet = (condition: PluginCondition) => {
  const hasRelatedRecordFields = condition.relatedRecordFieldCodes.some(Boolean);
  const hasSubtableFields =
    !!condition.relatedSubtableCode && condition.subtableFieldCodes.some(Boolean);
  const hasRelatedQueryConditions = condition.relatedQueryConditions.some(
    (queryCondition) => !!queryCondition.currentAppFieldCode && !!queryCondition.relatedAppFieldCode
  );

  return (
    !!condition.targetSpaceId &&
    !!condition.relatedAppId &&
    hasRelatedQueryConditions &&
    (hasRelatedRecordFields || hasSubtableFields)
  );
};

export const getNewRelatedQueryCondition = (): RelatedQueryCondition => ({
  id: nanoid(),
  type: 'equal',
  currentAppFieldCode: '',
  relatedAppFieldCode: '',
});

export const getNewCondition = (): PluginCondition => ({
  id: nanoid(),
  memo: '',
  targetSpaceId: '',
  relatedAppId: '',
  currentAppFieldCode: '',
  relatedAppFieldCode: '',
  relatedQueryConditions: [getNewRelatedQueryCondition()],
  relatedSubtableCode: '',
  relatedRecordFieldCodes: [],
  subtableFieldCodes: [],
  mergeRelatedRecordFields: true,
  filterSubtableRowsByMatchingField: false,
  showFieldAggregations: false,
  recordsPerPage: DEFAULT_RECORDS_PER_PAGE,
  aggregationRoundingMode: DEFAULT_AGGREGATION_ROUNDING_MODE,
  aggregationDecimalDigits: DEFAULT_AGGREGATION_DECIMAL_DIGITS,
  sortFieldCode: '$id',
  sortOrder: 'asc',
});

/**
 * プラグインの設定情報のひな形を返却します
 */
export const createConfig = (): PluginConfig => ({
  version: 1,
  common: {
    memo: '',
  },
  conditions: [getNewCondition()],
});

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string');
};

const toRelatedQueryConditionType = (value: unknown) => {
  const parsed = RelatedQueryConditionTypeSchema.safeParse(value);
  return parsed.success ? parsed.data : 'equal';
};

const toRelatedQueryConditions = (params: {
  value: unknown;
  currentAppFieldCode: unknown;
  relatedAppFieldCode: unknown;
}): RelatedQueryCondition[] => {
  if (Array.isArray(params.value)) {
    const conditions = params.value.map((condition) => {
      const parsed = RelatedQueryConditionSchema.safeParse(condition);
      if (parsed.success) {
        return parsed.data;
      }

      const source =
        condition && typeof condition === 'object' ? (condition as Record<string, unknown>) : {};
      return {
        id: typeof source.id === 'string' ? source.id : nanoid(),
        type: toRelatedQueryConditionType(source.type),
        currentAppFieldCode:
          typeof source.currentAppFieldCode === 'string' ? source.currentAppFieldCode : '',
        relatedAppFieldCode:
          typeof source.relatedAppFieldCode === 'string' ? source.relatedAppFieldCode : '',
      };
    });
    return conditions.length ? conditions : [getNewRelatedQueryCondition()];
  }

  if (
    typeof params.currentAppFieldCode === 'string' &&
    typeof params.relatedAppFieldCode === 'string' &&
    params.currentAppFieldCode &&
    params.relatedAppFieldCode
  ) {
    return [
      {
        id: nanoid(),
        type: 'equal',
        currentAppFieldCode: params.currentAppFieldCode,
        relatedAppFieldCode: params.relatedAppFieldCode,
      },
    ];
  }

  return [getNewRelatedQueryCondition()];
};

const toBoundedInteger = (params: {
  value: unknown;
  defaultValue: number;
  min: number;
  max: number;
}) => {
  if (typeof params.value !== 'number' || !Number.isFinite(params.value)) {
    return params.defaultValue;
  }
  return Math.min(params.max, Math.max(params.min, Math.trunc(params.value)));
};

const toAggregationRoundingMode = (value: unknown) => {
  const parsed = AggregationRoundingModeSchema.safeParse(value);
  return parsed.success ? parsed.data : DEFAULT_AGGREGATION_ROUNDING_MODE;
};

const normalizeCondition = (condition: unknown): PluginCondition => {
  const parsed = LatestPluginConditionSchema.safeParse(condition);
  if (parsed.success) {
    return parsed.data;
  }

  const source =
    condition && typeof condition === 'object' ? (condition as Record<string, unknown>) : {};
  const base = getNewCondition();

  return {
    ...base,
    id: typeof source.id === 'string' ? source.id : base.id,
    memo: typeof source.memo === 'string' ? source.memo : '',
    targetSpaceId: typeof source.targetSpaceId === 'string' ? source.targetSpaceId : '',
    relatedAppId: typeof source.relatedAppId === 'string' ? source.relatedAppId : '',
    currentAppFieldCode:
      typeof source.currentAppFieldCode === 'string' ? source.currentAppFieldCode : '',
    relatedAppFieldCode:
      typeof source.relatedAppFieldCode === 'string' ? source.relatedAppFieldCode : '',
    relatedQueryConditions: toRelatedQueryConditions({
      value: source.relatedQueryConditions,
      currentAppFieldCode: source.currentAppFieldCode,
      relatedAppFieldCode: source.relatedAppFieldCode,
    }),
    relatedSubtableCode:
      typeof source.relatedSubtableCode === 'string' ? source.relatedSubtableCode : '',
    relatedRecordFieldCodes: toStringArray(source.relatedRecordFieldCodes),
    subtableFieldCodes: toStringArray(source.subtableFieldCodes),
    mergeRelatedRecordFields:
      typeof source.mergeRelatedRecordFields === 'boolean' ? source.mergeRelatedRecordFields : true,
    filterSubtableRowsByMatchingField:
      typeof source.filterSubtableRowsByMatchingField === 'boolean'
        ? source.filterSubtableRowsByMatchingField
        : false,
    showFieldAggregations:
      typeof source.showFieldAggregations === 'boolean' ? source.showFieldAggregations : false,
    recordsPerPage: toBoundedInteger({
      value: source.recordsPerPage,
      defaultValue: DEFAULT_RECORDS_PER_PAGE,
      min: MIN_RECORDS_PER_PAGE,
      max: MAX_RECORDS_PER_PAGE,
    }),
    aggregationRoundingMode: toAggregationRoundingMode(source.aggregationRoundingMode),
    aggregationDecimalDigits: toBoundedInteger({
      value: source.aggregationDecimalDigits,
      defaultValue: DEFAULT_AGGREGATION_DECIMAL_DIGITS,
      min: MIN_AGGREGATION_DECIMAL_DIGITS,
      max: MAX_AGGREGATION_DECIMAL_DIGITS,
    }),
    sortFieldCode: typeof source.sortFieldCode === 'string' ? source.sortFieldCode : '$id',
    sortOrder: source.sortOrder === 'desc' ? 'desc' : 'asc',
  };
};

/**
 * 古いバージョンの設定情報を新しいバージョンに変換します
 * 各バージョンは次のバージョンへの変換処理を持ち、再帰的なアクセスによって最新のバージョンに変換されます
 *
 * @param anyConfig 保存されている設定情報
 * @returns 新しいバージョンの設定情報
 */
export const migrateConfig = (anyConfig: unknown): PluginConfig => {
  const source =
    anyConfig && typeof anyConfig === 'object' ? (anyConfig as Record<string, unknown>) : {};
  const common = source.common && typeof source.common === 'object' ? source.common : {};
  const storedConditions = Array.isArray(source.conditions) ? source.conditions : [];

  return {
    version: 1,
    common: {
      memo: common && 'memo' in common && typeof common.memo === 'string' ? common.memo : '',
    },
    conditions: storedConditions.length
      ? storedConditions.map(normalizeCondition)
      : [getNewCondition()],
  };
};

/**
 * プラグイン設定を復元します
 * エラーが発生した場合は、エラー情報と共にデフォルト設定を返却します
 * @returns {config: PluginConfig, error?: Error} プラグイン設定とエラー情報
 */
export function restorePluginConfig(): { config: PluginConfig; error?: Error } {
  try {
    const storedConfig = primitiveRestore<unknown>(PLUGIN_ID, { debug: !isProd });

    if (!storedConfig) {
      console.warn('⚠️ 保存された設定が見つかりません。デフォルト設定を使用します。');
      return { config: createConfig() };
    }

    const migratedConfig = migrateConfig(storedConfig);
    return { config: migratedConfig };
  } catch (error) {
    console.error('❌ プラグイン設定の復元中にエラーが発生しました', error);
    const configError =
      error instanceof Error
        ? error
        : new Error(`プラグイン設定の復元に失敗しました: ${String(error)}`);

    // エラーが発生してもデフォルト設定を返すことでアプリケーションは起動する
    return {
      config: createConfig(),
      error: configError,
    };
  }
}

import { restorePluginConfig as primitiveRestore } from '@konomi-app/kintone-utilities';
import { produce } from 'immer';
import { nanoid } from 'nanoid';
import type {
  AnyPluginConfig,
  Binding,
  BindingType,
  PluginCondition,
  PluginConfig,
} from '@/schema/plugin-config';
import { PLUGIN_ID } from './global';

/**
 * 操作画面でプラグインを有効にするための最小要件を満たしているか検証します
 *
 * この条件を満たさない場合、設定情報は無効となり、操作画面では対象としません
 *
 * @param condition - 検証する条件オブジェクト
 * @returns プラグインの設定情報が利用条件を満たしている場合は`true`、そうでない場合は`false`
 */
export const isUsagePluginConditionMet = (condition: PluginCondition) => {
  return !!condition.dstAppId && !!condition.dstKeyFieldCode && !!condition.srcKeyFieldCode;
};

export const getNewBinding = (type: BindingType = 'field'): Binding => {
  const base = { id: nanoid(), dstFieldCode: '' };
  switch (type) {
    case 'field':
      return { ...base, type: 'field', srcFieldCode: '' };
    case 'fixed':
      return { ...base, type: 'fixed', fixedValue: '' };
    case 'concat':
      return { ...base, type: 'concat', concatExpression: '' };
    case 'calc':
      return { ...base, type: 'calc', calcExpression: '' };
    case 'date_offset':
      return {
        ...base,
        type: 'date_offset',
        dateOffsetSrcFieldCode: '',
        dateOffsetValue: 0,
        dateOffsetUnit: 'day',
      };
  }
};

export const getNewCondition = (): PluginCondition => ({
  id: nanoid(),
  dstAppId: '',
  dstSpaceId: null,
  isDstAppGuestSpace: false,
  srcKeyFieldCode: '',
  dstKeyFieldCode: '',
  bindings: [getNewBinding()],
  srcQuery: '',
  dstQuery: '',
  createIfNotExists: false,
  srcConditions: [],
  triggerEvents: ['create', 'update'],
  processActions: [],
  processStatuses: [],
  deleteRelatedRecords: false,
});

/**
 * プラグインの設定情報のひな形を返却します
 */
export const createConfig = (): PluginConfig => ({
  version: 3,
  common: {
    showResult: false,
  },
  conditions: [getNewCondition()],
});

/**
 * 古いバージョンの設定情報を新しいバージョンに変換します
 * 各バージョンは次のバージョンへの変換処理を持ち、再帰的なアクセスによって最新のバージョンに変換されます
 *
 * @param anyConfig 保存されている設定情報
 * @returns 新しいバージョンの設定情報
 */
export const migrateConfig = (anyConfig: AnyPluginConfig): PluginConfig => {
  const { version } = anyConfig;
  switch (version) {
    case undefined:
    case 1:
      return migrateConfig({
        version: 2,
        common: {
          showResult: false,
        },
        conditions: anyConfig.conditions.map((condition) => ({
          ...condition,
          createIfNotExists: false,
          showResult: false,
        })),
      });
    case 2:
      return migrateConfig({
        version: 3,
        common: anyConfig.common,
        conditions: anyConfig.conditions.map((condition) => ({
          ...condition,
          triggerEvents: ['create', 'update'],
          processActions: [],
          processStatuses: [],
          deleteRelatedRecords: false,
          srcConditions: [],
        })),
      });
    case 3:
    default:
      return {
        ...anyConfig,
        conditions: anyConfig.conditions.map((condition) => ({
          ...condition,
          bindings: condition.bindings.map((binding) => ({
            ...binding,
            type: binding.type ?? 'field',
            srcFieldCode: binding.srcFieldCode ?? '',
          })),
        })),
      } as PluginConfig;
  }
};

/**
 * プラグイン設定を復元します
 * エラーが発生した場合は、エラー情報と共にデフォルト設定を返却します
 * @returns {config: PluginConfig, error?: Error} プラグイン設定とエラー情報
 */
export function restorePluginConfig(): { config: PluginConfig; error?: Error } {
  try {
    const savedConfig = primitiveRestore<AnyPluginConfig>(PLUGIN_ID);

    if (!savedConfig) {
      console.warn('⚠️ 保存された設定が見つかりません。デフォルト設定を使用します。');
      return { config: createConfig() };
    }

    const migratedConfig = migrateConfig(savedConfig);
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

export const getUpdatedStorage = <T extends keyof PluginCondition>(
  storage: PluginConfig,
  props: {
    conditionIndex: number;
    key: T;
    value: PluginCondition[T];
  }
) => {
  const { conditionIndex, key, value } = props;
  return produce(storage, (draft) => {
    draft.conditions[conditionIndex][key] = value;
  });
};

export const getConditionField = <T extends keyof PluginCondition>(
  storage: PluginConfig,
  props: {
    conditionIndex: number;
    key: T;
    defaultValue: NonNullable<PluginCondition[T]>;
  }
): NonNullable<PluginCondition[T]> => {
  const { conditionIndex, key, defaultValue } = props;
  if (!storage.conditions[conditionIndex]) {
    return defaultValue;
  }
  return storage.conditions[conditionIndex][key] ?? defaultValue;
};

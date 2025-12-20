import { restoreStorage } from '@konomi-app/kintone-utilities';
import { produce } from 'immer';
import { PLUGIN_ID } from './global';
import {
  createConfig,
  getNewCondition,
  migrateConfig,
  type AnyPluginConfig,
  type PluginConfig,
  type PluginCondition,
} from '@/schema/plugin-config';

export { createConfig, getNewCondition, migrateConfig };

/**
 * プラグインの設定情報を復元します
 */
export const restorePluginConfig = (): PluginConfig => {
  const config = restoreStorage<AnyPluginConfig>(PLUGIN_ID) ?? createConfig();
  return migrateConfig(config);
};

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
    if (draft.conditions[conditionIndex]) {
      draft.conditions[conditionIndex][key] = value;
    }
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

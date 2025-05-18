import {
  AnyPluginConfig,
  LatestPluginConditionSchema,
  PluginCondition,
  PluginConfig,
} from '@/schema/plugin-config';
import { restoreStorage } from '@konomi-app/kintone-utilities';
import { produce } from 'immer';
import { nanoid } from 'nanoid';
import { PLUGIN_ID } from './global';

export const getNewCondition = (): PluginCondition => ({
  id: nanoid(),
});

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
 * プラグインの設定情報のひな形を返却します
 */
export const createConfig = (): PluginConfig => ({
  version: 2,
  common: {},
  conditions: [getNewCondition()],
});

/**
 * 古いバージョンの設定情報を新しいバージョンに変換します
 * @param anyConfig 保存されている設定情報
 * @returns 新しいバージョンの設定情報
 */
export const migrateConfig = (anyConfig: AnyPluginConfig): PluginConfig => {
  const { version } = anyConfig;
  switch (version) {
    case undefined:
    case 1: {
      return migrateConfig({
        ...anyConfig,
        conditions: anyConfig.conditions.map((condition) => ({
          id: nanoid(),
          common: {},
          ...condition,
        })),
      });
    }
    case 2:
    default: {
      return anyConfig;
    }
  }
};

/**
 * プラグインの設定情報を復元します
 */
export const restorePluginConfig = (): PluginConfig => {
  const config = restoreStorage<AnyPluginConfig>(PLUGIN_ID) ?? createConfig();
  return migrateConfig(config);
};

export const getUpdatedStorage = <T extends keyof Plugin.Condition>(
  storage: Plugin.Config,
  props: {
    conditionIndex: number;
    key: T;
    value: Plugin.Condition[T];
  }
) => {
  const { conditionIndex, key, value } = props;
  return produce(storage, (draft) => {
    draft.conditions[conditionIndex]![key] = value;
  });
};

export const getConditionField = <T extends keyof Plugin.Condition>(
  storage: Plugin.Config,
  props: {
    conditionIndex: number;
    key: T;
    defaultValue: NonNullable<Plugin.Condition[T]>;
  }
): NonNullable<Plugin.Condition[T]> => {
  const { conditionIndex, key, defaultValue } = props;
  if (!storage.conditions[conditionIndex]) {
    return defaultValue;
  }
  return storage.conditions[conditionIndex][key] ?? defaultValue;
};

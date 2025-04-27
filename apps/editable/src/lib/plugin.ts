import {
  AnyPluginConfig,
  LatestPluginConditionSchema,
  PluginCondition,
  PluginConfig,
} from '@/schema/plugin-config';
import { restorePluginConfig as restore } from '@konomi-app/kintone-utilities';
import { isProd, PLUGIN_ID } from './global';
import { nanoid } from 'nanoid';

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
 * プラグインの設定情報が、プラグインの利用条件を満たしているか検証します
 *
 * この条件を満たさない場合、設定情報は無効となります。
 *
 * @param condition - 検証する条件オブジェクト
 * @returns プラグインの設定情報が利用条件を満たしている場合は`true`、そうでない場合は`false`
 */
export const isUsagePluginConditionMet = (condition: PluginCondition) => {
  return !!condition.targetField && !!condition.rules.length;
};

export const getNewRule = (): kintone.plugin.Condition['rules'][number] => ({
  type: 'equal',
  field: '',
  value: '',
  editable: false,
  connector: 'and',
});

export const getNewCondition = (): PluginCondition => ({
  id: nanoid(),
  targetField: '',
  rules: [getNewRule()],
});

/**
 * プラグインの設定情報のひな形を返却します
 */
export const createConfig = (): PluginConfig => ({
  version: 2,
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
    case undefined: {
      if (!('conditions' in anyConfig)) {
        return createConfig();
      }
      const { conditions } = anyConfig;
      if (!Array.isArray(conditions) || !(conditions as unknown[]).length) {
        return createConfig();
      }

      const validConditions = (conditions as unknown[]).filter((condition) =>
        isPluginConditionMet(condition)
      ) as PluginCondition[];

      return migrateConfig({
        version: 1,
        conditions: validConditions,
      });
    }
    case 1:
      return migrateConfig({
        ...anyConfig,
        version: 2,
        conditions: anyConfig.conditions.map((condition) => ({
          ...condition,
          id: nanoid(),
        })),
      });
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
  const config = restore<AnyPluginConfig>(PLUGIN_ID, { debug: !isProd }) ?? createConfig();
  return migrateConfig(config);
};

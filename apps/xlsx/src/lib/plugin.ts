import { restorePluginConfig as restore } from '@konomi-app/kintone-utilities';
import { nanoid } from 'nanoid';
import {
  type AnyPluginConfig,
  LatestPluginConditionSchema,
  type PluginCondition,
  type PluginConfig,
  type PluginConfigV0,
} from '@/schema/plugin-config';
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
 * プラグインの設定情報が、プラグインの利用条件を満たしているか検証します
 *
 * この条件を満たさない場合、設定情報は無効となります。
 *
 * @param condition - 検証する条件オブジェクト
 * @returns プラグインの設定情報が利用条件を満たしている場合は`true`、そうでない場合は`false`
 */
export const isUsagePluginConditionMet = () => {
  return true; // ここに条件を追加する
};

export const getNewCondition = (): PluginCondition => ({
  id: nanoid(),
  allFields: false,
  allRecords: false,
  union: false,
  fileNameTemplate: '{appName}_{date}_{time}',
  sheetName: '{appName}',
  dateAsExcel: false,
  targetViewsEnabled: false,
  targetViews: [],
  targetFieldsEnabled: false,
  targetFields: [],
});

/**
 * プラグインの設定情報のひな形を返却します
 */
export const createConfig = (): PluginConfig => ({
  version: 1,
  common: {},
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
      // v0 (バージョンなし) から v1 へのマイグレーション
      const v0 = anyConfig as unknown as PluginConfigV0;
      return migrateConfig({
        version: 1,
        common: {},
        conditions: [
          {
            ...getNewCondition(),
            allRecords: v0.allRecords ?? false,
            allFields: v0.allFields ?? false,
            union: v0.union ?? false,
            fileNameTemplate: v0.fileNameTemplate ?? '{appName}_{date}_{time}',
            sheetName: v0.sheetName ?? '{appName}',
            dateAsExcel: v0.dateAsExcel ?? false,
          },
        ],
      });
    }
    case 1:
    default: {
      // `default` -> `config.js`と`desktop.js`のバージョンが一致していない場合に通る可能性があるため必要
      // もし新しいバージョンを追加したらここに追加する
      // return migrateConfig({ version: 2, ...anyConfig });
      const config = anyConfig as PluginConfig;
      return {
        ...config,
        conditions: config.conditions.map((condition) => ({
          ...condition,
          // targetFields が旧フォーマット (string[]) の場合、新フォーマット ({ id, fieldCode }[]) に変換する
          targetFields: (
            condition.targetFields as unknown as (string | { id: string; fieldCode: string })[]
          ).map((field) =>
            typeof field === 'string' ? { id: nanoid(), fieldCode: field } : field
          ),
        })),
      };
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

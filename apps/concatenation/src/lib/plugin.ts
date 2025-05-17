import { kintoneAPI, restorePluginConfig as primitiveRestore } from '@konomi-app/kintone-utilities';
import { nanoid } from 'nanoid';
import { PLUGIN_ID } from './global';

export const FORMATTABLE_FIELD_TYPES: kintoneAPI.FieldPropertyType[] = [
  'DATE',
  'DATETIME',
  'TIME',
  'CREATED_TIME',
  'UPDATED_TIME',
];

export const CONCATENATION_ITEM_TYPES = [
  { label: '任意の文字列', value: 'string' },
  { label: 'フィールド', value: 'field' },
  // { label: 'アプリID', value: 'appId' },
  // { label: 'アプリ名', value: 'appName' },
] as const;

export const isPluginConditionMet = (): boolean => {
  return true;
};

export const getNewCondition = (): Plugin.Condition => ({
  id: nanoid(),
  targetField: '',
  concatenationItems: [
    { type: 'string', value: '', isOmittedIfPreviousEmpty: false, isOmittedIfNextEmpty: false },
  ],
});

/**
 * プラグインの設定情報のひな形を返却します
 */
export const createConfig = (): Plugin.Config => ({
  version: 2,
  conditions: [getNewCondition()],
});

/**
 * 古いバージョンの設定情報を新しいバージョンに変換します
 * @param anyConfig 保存されている設定情報
 * @returns 新しいバージョンの設定情報
 */
export const migrateConfig = (anyConfig: Plugin.AnyConfig): Plugin.Config => {
  const { version } = anyConfig;
  switch (version) {
    case undefined:
    case 1: {
      return migrateConfig({
        ...anyConfig,
        conditions: anyConfig.conditions.map((condition) => ({
          ...condition,
          id: nanoid(),
        })),
        version: 2,
      });
    }
    case 2:
    default:
      return anyConfig;
  }
};

/**
 * プラグインの設定情報を復元します
 */
export const restorePluginConfig = (): Plugin.Config => {
  const config = primitiveRestore<Plugin.AnyConfig>(PLUGIN_ID) ?? createConfig();
  return migrateConfig(config);
};

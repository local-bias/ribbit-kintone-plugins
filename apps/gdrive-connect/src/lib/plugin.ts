import { restorePluginConfig as restore } from '@konomi-app/kintone-utilities';
import { nanoid } from 'nanoid';
import {
  type AnyPluginConfig,
  type FolderCreationTrigger,
  LatestPluginConditionSchema,
  type PluginCondition,
  type PluginConfig,
} from '@/schema/plugin-config';
import { isProd, PLUGIN_ID } from './global';

export const FOLDER_CREATION_TRIGGER_OPTIONS = [
  { label: '自動作成しない(手動でIDが指定されたレコードのみ対象)', value: 'manual' },
  { label: 'レコード保存時に作成', value: 'onSave' },
  { label: '表示スペースでユーザーが操作したときに作成', value: 'onDemand' },
] as const satisfies { label: string; value: FolderCreationTrigger }[];

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
  return !!(condition.targetSpaceId && condition.parentFolderId && condition.folderIdFieldCode);
};

export const getNewCondition = (): PluginCondition => ({
  id: nanoid(),
  memo: '',
  targetSpaceId: '',
  parentFolderId: '',
  folderIdFieldCode: '',
  folderNameFieldCodes: [],
  folderCreationTrigger: 'onSave',
});

/**
 * プラグインの設定情報のひな形を返却します
 */
export const createConfig = (): PluginConfig => ({
  version: 1,
  common: {
    oauthClientId: '',
    oauthClientSecret: '',
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
    case undefined: {
      return migrateConfig({ ...anyConfig, version: 1 });
    }
    case 1:
    default: {
      // `default` -> `config.js`と`desktop.js`のバージョンが一致していない場合に通る可能性があるため必要
      // もし新しいバージョンを追加したらここに追加する
      // return migrateConfig({ version: 2, ...anyConfig });
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

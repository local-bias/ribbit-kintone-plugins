import { restorePluginConfig as primitiveRestore } from '@konomi-app/kintone-utilities';
import { nanoid } from 'nanoid';
import {
  type AnyPluginConfig,
  LatestPluginConditionSchema,
  type PluginCondition,
  type PluginConfig,
} from '@/schema/plugin-config';
import { PLUGIN_ID } from './global';
import { t } from './i18n';

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
  return condition.fieldCodes.some((code) => code !== '');
};

export const getNewCondition = (): PluginCondition => ({
  id: nanoid(),
  buttonLabel: t('desktop.defaultButtonLabel'),
  fieldCodes: [''],
  buttonLocation: 'detail-header',
  spaceFieldId: '',
  zipFileName: 'attachments',
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
 * プラグイン設定を復元します
 * エラーが発生した場合は、エラー情報と共にデフォルト設定を返却します
 * @returns {config: PluginConfig, error?: Error} プラグイン設定とエラー情報
 */
export function restorePluginConfig(): { config: PluginConfig; error?: Error } {
  try {
    const storedConfig = primitiveRestore<AnyPluginConfig>(PLUGIN_ID);

    if (!storedConfig) {
      console.warn(`⚠️ ${t('warning.configNotFound')}`);
      return { config: createConfig() };
    }

    const migratedConfig = migrateConfig(storedConfig);
    return { config: migratedConfig };
  } catch (error) {
    console.error(`❌ ${t('error.configRestoreError')}`, error);
    const configError =
      error instanceof Error
        ? error
        : new Error(`${t('error.configRestoreFailed')}: ${String(error)}`);

    // エラーが発生してもデフォルト設定を返すことでアプリケーションは起動する
    return {
      config: createConfig(),
      error: configError,
    };
  }
}

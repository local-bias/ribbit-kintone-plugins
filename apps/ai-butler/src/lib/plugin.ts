import { restorePluginConfig as primitiveRestore } from '@konomi-app/kintone-utilities';
import { nanoid } from 'nanoid';
import {
  type AnyPluginConfig,
  LatestPluginConditionSchema,
  type PluginCondition,
  type PluginConfig,
} from '@/schema/plugin-config';
import { PLUGIN_ID } from './global';

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
  return !!condition.name;
};

export const getNewCondition = (): PluginCondition => ({
  id: nanoid(),
  name: '新しいプロンプト',
  description: '',
  systemPrompt: '',
  trigger: 'manual',
  autocompleteRules: [],
  targetFieldCodes: [],
});

/**
 * プラグインの設定情報のひな形を返却します
 */
export const createConfig = (): PluginConfig => ({
  version: 1,
  common: {
    providerType: 'openai',
    apiKey: '',
    baseUrl: '',
    model: 'gpt-4o-mini',
    systemPrompt:
      'あなたはkintoneアプリ上で動作する優秀なAIアシスタントです。ユーザーの依頼に対して的確かつ簡潔に応答してください。',
    temperature: 0.7,
    maxTokens: 2048,
    chatEnabled: true,
    fileAttachmentEnabled: true,
    autoFillOnFileDrop: false,
    autocompleteEnabled: true,
    displayOnIndex: true,
    displayOnDetail: true,
    displayOnCreate: true,
    displayOnEdit: true,
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
    default: {
      // `default` -> `config.js`と`desktop.js`のバージョンが一致していない場合に通る可能性があるため必要
      // もし新しいバージョンを追加したらここに追加する
      // return migrateConfig({ version: 2, ...anyConfig });
      return fillConfigDefaults(anyConfig);
    }
  }
};

/**
 * 古い設定ファイルにフィールドが欠落している場合にデフォルト値で補填します
 */
function fillConfigDefaults(config: PluginConfig): PluginConfig {
  const fallback = createConfig();
  return {
    ...config,
    common: { ...fallback.common, ...config.common },
  };
}

/**
 * プラグイン設定を復元します
 * エラーが発生した場合は、エラー情報と共にデフォルト設定を返却します
 * @returns {config: PluginConfig, error?: Error} プラグイン設定とエラー情報
 */
export function restorePluginConfig(): { config: PluginConfig; error?: Error } {
  try {
    const storedConfig = primitiveRestore<AnyPluginConfig>(PLUGIN_ID);

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

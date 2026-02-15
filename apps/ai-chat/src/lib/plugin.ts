import { AnyPluginConfig, PluginCondition, PluginConfig } from '@/schema/plugin-config';
import { restorePluginConfig as primitiveRestore } from '@konomi-app/kintone-utilities';
import { nanoid } from 'nanoid';
import { isDev, PLUGIN_ID } from './global';
import { OPENAI_MODELS } from './static';

/**
 * プラグインの設定情報が、最新の設定情報の形式に準拠しているか検証します
 *
 * @param condition - 検証する条件オブジェクト
 * @returns プラグインの設定情報が最新の形式に準拠している場合は`true`、そうでない場合は`false`
 */
export const isPluginConditionMet = (condition: PluginCondition): boolean => {
  return !!condition.id;
};

/**
 * プラグインの設定情報のひな形を返却します
 */
export const createConfig = (): PluginConfig => ({
  version: 13,
  common: {
    providerType: 'openrouter',
    viewId: '',
    outputAppId: '',
    outputKeyFieldCode: '',
    outputContentFieldCode: '',
    logAppId: '',
    logKeyFieldCode: '',
    logContentFieldCode: '',
    logAppVersion: 'v1',
    logAppV2SessionIdFieldCode: '',
    logAppV2AssistantIdFieldCode: '',
    logAppV2RoleFieldCode: '',
    logAppV2ContentFieldCode: '',
    enablesAnimation: false,
    enablesEnter: false,
    enablesShiftEnter: false,
  },
  conditions: [getNewCondition()],
});

/**
 * 古いバージョンの設定情報を新しいバージョンに変換します
 * @param storage 保存されている設定情報
 * @returns 新しいバージョンの設定情報
 */
export const migrateConfig = (storage: AnyPluginConfig): PluginConfig => {
  const { version } = storage;
  switch (version) {
    case undefined:
    case 1: {
      return migrateConfig({
        ...storage,
        version: 4,
        enablesAnimation: false,
        enablesEnter: false,
        enablesShiftEnter: false,
        assistants: [getNewCondition()],
      });
    }
    case 2: {
      return migrateConfig({
        ...storage,
        version: 4,
        enablesAnimation: false,
        enablesEnter: false,
        enablesShiftEnter: false,
        assistants: storage.assistants.map((assistant) => ({
          //@ts-ignore
          maxTokens: 0,
          ...assistant,
          examples: [''],
        })),
      });
    }
    case 3: {
      return migrateConfig({
        ...storage,
        version: 4,
        assistants: storage.assistants.map((assistant) => ({ ...assistant, examples: [''] })),
      });
    }
    case 4: {
      const { version, assistants, ...rest } = storage;
      return migrateConfig({
        version: 5,
        common: rest,
        conditions: assistants.map((assistant) => ({
          ...assistant,
          id: nanoid(),
        })),
      });
    }
    case 5: {
      return migrateConfig({
        ...storage,
        conditions: storage.conditions.map((condition) => ({
          allowImageUpload: true,
          ...condition,
        })),
        version: 6,
      });
    }
    case 6: {
      return migrateConfig({
        ...storage,
        common: {
          ...storage.common,
          providerType: 'openai',
        },
        version: 7,
      });
    }
    case 7: {
      return migrateConfig({
        ...storage,
        conditions: storage.conditions.map((condition) => ({
          ...condition,
          reasoningEffort: 'model-default',
          verbosity: 'model-default',
          allowWebSearch: false,
          promptId: '',
        })),
        version: 8,
      });
    }
    case 8: {
      return migrateConfig({
        ...storage,
        common: {
          ...storage.common,
          logAppVersion: 'v1',
          logAppV2SessionIdFieldCode: '',
          logAppV2AssistantIdFieldCode: '',
          logAppV2RoleFieldCode: '',
          logAppV2ContentFieldCode: '',
        },
        version: 9,
      });
    }
    case 9: {
      return migrateConfig({
        ...storage,
        conditions: storage.conditions.map((condition) => ({
          ...condition,
          allowImageGeneration: false,
        })),
        version: 10,
      });
    }
    case 10: {
      return migrateConfig({
        ...storage,
        conditions: storage.conditions.map((condition) => ({
          ...condition,
          enableFactCheck: false,
          enableFactCheckLog: false,
        })),
        version: 11,
      });
    }
    case 11: {
      return migrateConfig({
        ...storage,
        conditions: storage.conditions.map((condition) => ({
          ...condition,
          allowHtmlOutput: false,
        })),
        version: 12,
      });
    }
    case 12: {
      return migrateConfig({
        ...storage,
        conditions: storage.conditions.map((condition) => ({
          ...condition,
          allowQuickReplies: true,
        })),
        version: 13,
      });
    }
    case 13:
    default: {
      return storage;
    }
  }
};

/**
 * プラグイン設定を復元します
 * エラーが発生した場合は、エラー情報と共にデフォルト設定を返却します
 * @returns {config: PluginConfig, error?: Error} プラグイン設定とエラー情報
 */
export const restorePluginConfig = (): { config: PluginConfig; error?: Error } => {
  try {
    isDev && console.log('🔄 プラグイン設定を復元しています...');
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
};

export const getNewCondition = (): PluginCondition => ({
  id: nanoid(),
  name: '',
  description: '',
  aiModel: OPENAI_MODELS[0],
  aiIcon: '',
  temperature: 1,
  systemPrompt: '',
  maxTokens: 0,
  examples: [''],
  allowImageUpload: true,
  reasoningEffort: 'model-default',
  verbosity: 'model-default',
  allowWebSearch: false,
  promptId: '',
  allowImageGeneration: false,
  enableFactCheck: false,
  enableFactCheckLog: false,
  allowHtmlOutput: false,
  allowQuickReplies: true,
});

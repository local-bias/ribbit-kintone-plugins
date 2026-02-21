import { restorePluginConfig as primitiveRestore } from '@konomi-app/kintone-utilities';
import { PLUGIN_ID } from './global';
import {
  createConfig,
  getNewCondition,
  migrateConfig,
  type AnyPluginConfig,
  type PluginCondition,
  type PluginConfig,
} from '@/schema/plugin-config';

export { createConfig, getNewCondition, migrateConfig };

export const restorePluginConfig = (): PluginConfig => {
  const config = primitiveRestore<AnyPluginConfig>(PLUGIN_ID) ?? createConfig();
  return migrateConfig(config);
};

/**
 * プラグイン設定が有効かどうかを判定する（設定画面でのペースト検証等に使用）
 */
export const isPluginConditionMet = (condition: PluginCondition): boolean => {
  return !!(
    condition.viewId &&
    condition.titleFieldCode &&
    condition.startDateFieldCode &&
    condition.endDateFieldCode
  );
};

/**
 * デスクトップ側でプラグイン条件が使用可能かどうかを判定する
 */
export const isUsagePluginConditionMet = (condition: PluginCondition): boolean => {
  return isPluginConditionMet(condition);
};

/** ガントチャートのカスタムビューに埋め込むルート要素ID */
export const VIEW_ROOT_ID = 'ribbit-gantt-root';

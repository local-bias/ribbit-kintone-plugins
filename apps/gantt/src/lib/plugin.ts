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

/**
 * プラグイン設定を復元します
 * エラーが発生した場合は、エラー情報と共にデフォルト設定を返却します
 * @returns {config: PluginConfig, error?: Error} プラグイン設定とエラー情報
 */
export const restorePluginConfig = (): { config: PluginConfig; error?: Error } => {
  try {
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

/** 条件からカテゴリのフィールドコード一覧を取得 */
export function getCategoryFieldCodes(condition: PluginCondition): string[] {
  return condition.categories.map((c) => c.fieldCode).filter(Boolean);
}

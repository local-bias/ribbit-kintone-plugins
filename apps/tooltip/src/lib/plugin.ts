import { restorePluginConfig as primitiveRestore } from '@konomi-app/kintone-utilities';
import { nanoid } from 'nanoid';
import type { AnyPluginConfig, PluginCondition, PluginConfig } from '@/schema/plugin-config';
import { PLUGIN_ID } from './global';

export const getNewCondition = (): PluginCondition => ({
  id: nanoid(),
  fieldCode: '',
  label: '',
  type: 'icon',
  iconType: 'info',
  iconColor: '#9ca3af',
  emoji: '😀',
  targetEvents: ['create', 'edit', 'index', 'detail'],
  backgroundColor: '#4b5563',
  foregroundColor: '#f9fafb',
});

/**
 * プラグインの設定情報のひな形を返却します
 */
export const createConfig = (): PluginConfig => ({
  version: 4,
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
    case 1:
      return migrateConfig({
        version: 2,
        conditions: anyConfig.conditions.map((condition) => ({
          fieldCode: condition.field,
          label: condition.label,
          type: 'icon',
          iconType: 'info',
          iconColor: '#9ca3af',
          emoji: '😀',
        })),
      });
    case 2:
      return migrateConfig({
        version: 3,
        conditions: anyConfig.conditions.map((condition) => ({
          ...condition,
          id: nanoid(),
        })),
      });
    case 3:
      return migrateConfig({
        version: 4,
        conditions: anyConfig.conditions.map((condition) => ({
          ...condition,
          label: condition.label.split(/\n/).join('<br>'),
          targetEvents: ['create', 'edit', 'index', 'detail'],
          backgroundColor: '#4b5563',
          foregroundColor: '#f9fafb',
        })),
      });
    case 4:
    default:
      return anyConfig;
  }
};

/**
 * プラグインの設定情報を復元します
 */
export const restorePluginConfig = (): PluginConfig => {
  const config = primitiveRestore(PLUGIN_ID) ?? createConfig();
  return migrateConfig(config);
};

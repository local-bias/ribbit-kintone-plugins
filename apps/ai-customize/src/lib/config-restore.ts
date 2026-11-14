import { restorePluginConfig as restore } from '@konomi-app/kintone-utilities';
import type { AnyPluginConfig, PluginConfig } from '@/schema/plugin-config';
import { isProd, PLUGIN_ID } from './global';
import { createConfig, migrateConfig } from './plugin';

/**
 * 保存されている設定情報を復元します
 *
 * 保存済みJSONはスキーマ検証を通していないため、必ず`migrateConfig`を通してから使う
 */
export const restorePluginConfig = (): PluginConfig => {
  const config = restore<AnyPluginConfig>(PLUGIN_ID, { debug: !isProd }) ?? createConfig();
  return migrateConfig(config);
};

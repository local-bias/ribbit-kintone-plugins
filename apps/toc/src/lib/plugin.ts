import { restoreStorage } from '@konomi-app/kintone-utilities';
import { PLUGIN_ID } from './global';
import type { AnyPluginConfig, PluginConfig } from '@/schema/plugin-config';
import { DEFAULT_COLOR } from './static';

/**
 * プラグインの設定情報のひな形を返却します
 */
export const createConfig = (): PluginConfig => ({
  version: 2,
  common: {
    type: 'sticky-left',
    tocTitle: '目次',
    maxWidth: 250,
  },
  conditions: [{ spaceId: '', label: '', color: DEFAULT_COLOR }],
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
      return {
        version: 2,
        common: {
          type: 'sticky-left',
          tocTitle: anyConfig.tocTitle ?? '目次',
          maxWidth: anyConfig.maxWidth ?? 250,
        },
        conditions: anyConfig.headings.map((heading) => ({
          spaceId: heading.spaceId,
          label: heading.label,
          color: heading.color ?? DEFAULT_COLOR,
        })),
      };
    case 2:
      return anyConfig;
    default:
      return anyConfig;
  }
};

/**
 * プラグインの設定情報を復元します
 */
export const restorePluginConfig = (): PluginConfig => {
  const config = restoreStorage<AnyPluginConfig>(PLUGIN_ID) ?? createConfig();
  return migrateConfig(config);
};

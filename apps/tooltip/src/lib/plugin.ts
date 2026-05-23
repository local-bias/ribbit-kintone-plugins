import { restorePluginConfig as primitiveRestore } from '@konomi-app/kintone-utilities';
import { nanoid } from 'nanoid';
import type { AnyPluginConfig, PluginCondition, PluginConfig } from '@/schema/plugin-config';
import { PLUGIN_ID } from './global';
import { sanitizeTooltipHtml } from './tooltip-html';

const DEFAULT_ICON_COLOR = '#9ca3af';
const DEFAULT_BACKGROUND_COLOR = '#4b5563';
const DEFAULT_FOREGROUND_COLOR = '#f9fafb';
const HEX_COLOR_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

function sanitizeColor(value: string, fallback: string): string {
  const trimmed = value.trim();
  return HEX_COLOR_PATTERN.test(trimmed) ? trimmed : fallback;
}

export const getNewCondition = (): PluginCondition => ({
  id: nanoid(),
  fieldCode: '',
  label: '',
  type: 'icon',
  iconType: 'info',
  iconColor: DEFAULT_ICON_COLOR,
  emoji: '😀',
  targetEvents: ['create', 'edit', 'index', 'detail'],
  backgroundColor: DEFAULT_BACKGROUND_COLOR,
  foregroundColor: DEFAULT_FOREGROUND_COLOR,
  contentMode: 'richText',
  html: '',
});

export const sanitizePluginConfig = (config: PluginConfig): PluginConfig => ({
  ...config,
  conditions: config.conditions.map((condition) => ({
    ...condition,
    label: sanitizeTooltipHtml(condition.label),
    html: sanitizeTooltipHtml(condition.html),
    iconColor: sanitizeColor(condition.iconColor, DEFAULT_ICON_COLOR),
    backgroundColor: sanitizeColor(condition.backgroundColor, DEFAULT_BACKGROUND_COLOR),
    foregroundColor: sanitizeColor(condition.foregroundColor, DEFAULT_FOREGROUND_COLOR),
  })),
});

/**
 * プラグインの設定情報のひな形を返却します
 */
export const createConfig = (): PluginConfig => ({
  version: 5,
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
          iconColor: DEFAULT_ICON_COLOR,
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
          backgroundColor: DEFAULT_BACKGROUND_COLOR,
          foregroundColor: DEFAULT_FOREGROUND_COLOR,
        })),
      });
    case 4:
      return migrateConfig({
        version: 5,
        conditions: anyConfig.conditions.map((condition) => ({
          ...condition,
          contentMode: 'richText',
          html: '',
        })),
      });
    default:
      return anyConfig;
  }
};

/**
 * プラグインの設定情報を復元します
 */
export const restorePluginConfig = (): PluginConfig => {
  const config = primitiveRestore(PLUGIN_ID) ?? createConfig();
  return sanitizePluginConfig(migrateConfig(config));
};

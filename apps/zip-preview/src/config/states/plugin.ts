import { createPluginConfigStore } from '@repo/plugin/react';
import { PLUGIN_NAME } from '@/lib/constants';
import { t } from '@/lib/i18n';
import { createConfig, migrateConfig, restorePluginConfig } from '@/lib/plugin';
import type { AnyPluginConfig, PluginConfig } from '@/schema/plugin-config';

export const {
  pluginConfigAtom,
  handlePluginConfigResetAtom,
  handlePluginConditionDeleteAtom,
  updatePluginConfig,
  importPluginConfigAtom,
  exportPluginConfigAtom,
  pluginConditionsAtom,
  hasMultipleConditionsAtom,
  conditionsLengthAtom,
  selectedConditionIdAtom,
  selectedConditionAtom,
  getConditionPropertyAtom,
  commonConfigAtom,
  isConditionIdUnselectedAtom,
  getCommonPropertyAtom,
} = createPluginConfigStore<PluginConfig, AnyPluginConfig>({
  restorePluginConfig,
  createConfig,
  migrateConfig,
  t,
  pluginName: PLUGIN_NAME,
});

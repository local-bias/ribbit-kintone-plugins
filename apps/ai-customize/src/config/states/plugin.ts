import { createPluginConfigStore } from '@repo/plugin/react';
import { restorePluginConfig } from '@/lib/config-restore';
import { PLUGIN_NAME } from '@/lib/constants';
import { t } from '@/lib/i18n';
import { createCommonConfig, createConfig, migrateConfig } from '@/lib/plugin';
import type { AnyPluginConfig, PluginCommonConfig, PluginConfig } from '@/schema/plugin-config';

export const {
  pluginConfigAtom,
  handlePluginConfigResetAtom,
  updatePluginConfig,
  importPluginConfigAtom,
  exportPluginConfigAtom,
  commonConfigAtom,
  getCommonPropertyAtom,
} = createPluginConfigStore<PluginConfig, AnyPluginConfig>({
  restorePluginConfig,
  createConfig,
  migrateConfig,
  t,
  pluginName: PLUGIN_NAME,
});

type CommonPropertyAtoms = {
  [K in keyof PluginCommonConfig]: ReturnType<typeof getCommonPropertyAtom<K>>;
};

/**
 * 共通設定の各項目のatom
 *
 * コンポーネントの中で`getCommonPropertyAtom`を呼ぶと描画のたびに別のatomになるため、
 * 読み込み時に一度だけ作る
 */
export const commonPropertyAtoms = Object.fromEntries(
  (Object.keys(createCommonConfig()) as (keyof PluginCommonConfig)[]).map((key) => [
    key,
    getCommonPropertyAtom(key),
  ])
) as CommonPropertyAtoms;

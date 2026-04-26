import { storePluginConfig } from '@konomi-app/kintone-utilities';
import { toast } from '@konomi-app/ui';
import { usePluginAtoms } from '@repo/jotai';
import { atom } from 'jotai';
import type { ChangeEvent } from 'react';
import { loadingAtom, loadingEndAtom, loadingStartAtom } from '@/common/global-state';
import { t } from '@/lib/i18n';
import { createConfig, migrateConfig, restorePluginConfig } from '@/lib/plugin';
import type { PluginConfig } from '@/schema/plugin-config';

export const pluginConfigAtom = atom<PluginConfig>(restorePluginConfig());

export const {
  pluginConditionsAtom,
  hasMultipleConditionsAtom,
  conditionsLengthAtom,
  selectedConditionIdAtom,
  selectedConditionAtom,
  getConditionPropertyAtom,
} = usePluginAtoms(pluginConfigAtom, {
  enableCommonCondition: false,
});

export const handlePluginConfigResetAtom = atom(null, (_, set) => {
  set(pluginConfigAtom, createConfig());
  toast.success(t('common.config.toast.reset'));
});

export const handlePluginConfigSaveAtom = atom(null, (get, set) => {
  set(loadingStartAtom);
  try {
    const config = get(pluginConfigAtom);
    storePluginConfig(config, {
      callback: () => true,
      flatProperties: ['conditions'],
      debug: true,
    });
    toast.success(t('common.config.toast.save'), {
      description: t('common.config.toast.save.description'),
      action: {
        label: t('common.config.button.return'),
        onClick: () => history.back(),
      },
      duration: 6000,
    });
  } finally {
    set(loadingEndAtom);
  }
});

export const handlePluginConfigImportAtom = atom(
  null,
  async (_, set, event: ChangeEvent<HTMLInputElement>) => {
    try {
      const { files } = event.target;
      if (!files?.length) return;
      const [file] = Array.from(files);
      const reader = new FileReader();
      const text = await new Promise<string>((resolve, reject) => {
        reader.onload = (e) => resolve((e.target?.result ?? '') as string);
        reader.onerror = reject;
        reader.readAsText(file!);
      });
      set(pluginConfigAtom, migrateConfig(JSON.parse(text)));
      toast.success(t('common.config.toast.import'));
    } catch (error) {
      toast.error(t('common.config.error.import'));
      throw error;
    }
  }
);

export const handlePluginConfigExportAtom = atom(null, async (get, set) => {
  try {
    set(loadingStartAtom);
    const config = get(pluginConfigAtom);
    const blob = new Blob([JSON.stringify(config, null)], { type: 'application/json' });
    const url = (window.URL || window.webkitURL).createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'xlsx-plugin-config.json';
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(t('common.config.toast.export'));
  } catch (error) {
    toast.error(t('common.config.error.export'));
    throw error;
  } finally {
    set(loadingEndAtom);
  }
});

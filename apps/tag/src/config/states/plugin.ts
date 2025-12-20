import { t } from '@/lib/i18n';
import { createConfig, restorePluginConfig } from '@/lib/plugin';
import { PluginConfig } from '@/schema/plugin-config';
import { handleLoadingEndAtom, handleLoadingStartAtom, usePluginAtoms } from '@repo/jotai';
import { atom } from 'jotai';
import { enqueueSnackbar } from 'notistack';

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

export const tabIndexAtom = atom<number>(0);

export const handlePluginConfigResetAtom = atom(null, (_, set) => {
  set(pluginConfigAtom, createConfig());
  enqueueSnackbar(t('config.toast.reset'), { variant: 'success' });
});

export const importPluginConfigAtom = atom(
  null,
  async (_, set, event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      set(handleLoadingStartAtom);
      const { files } = event.target;
      if (!files?.length) {
        return;
      }
      const file = files[0];
      if (!file) {
        return;
      }
      // @ts-ignore
      const fileEvent = await new Promise<ProgressEvent<FileReader>>((resolve) => {
        const reader = new FileReader();
        reader.onload = resolve;
        reader.readAsText(file);
      });
      const text = (fileEvent.target?.result ?? '') as string;
      set(pluginConfigAtom, JSON.parse(text));
      enqueueSnackbar(t('config.toast.import'), { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(t('config.error.import'), { variant: 'error' });
      throw error;
    } finally {
      set(handleLoadingEndAtom);
    }
  }
);

export const exportPluginConfigAtom = atom(null, (get, set) => {
  try {
    set(handleLoadingStartAtom);
    const pluginConfig = get(pluginConfigAtom);
    const blob = new Blob([JSON.stringify(pluginConfig, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plugin-config.json';
    a.click();
    URL.revokeObjectURL(url);
    enqueueSnackbar(t('config.toast.export'), { variant: 'success' });
  } catch (error) {
    enqueueSnackbar(t('config.error.export'), { variant: 'error' });
    throw error;
  } finally {
    set(handleLoadingEndAtom);
  }
});

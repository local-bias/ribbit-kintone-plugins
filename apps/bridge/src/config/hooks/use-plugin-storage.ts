import { t } from '@/lib/i18n';
import { migrateConfig } from '@/lib/plugin';
import { PLUGIN_NAME } from '@/lib/static';
import { onFileLoad } from '@konomi-app/kintone-utilities';
import { toast } from '@konomi-app/ui';
import { useAtomValue, useSetAtom } from 'jotai';
import { ChangeEventHandler, useCallback } from 'react';
import { loadingState, pluginConfigAtom } from '../states/plugin';

export const usePluginStorage = () => {
  const storage = useAtomValue(pluginConfigAtom);
  const setStorage = useSetAtom(pluginConfigAtom);
  const setLoading = useSetAtom(loadingState);

  const importStorage: ChangeEventHandler<HTMLInputElement> = useCallback(
    async (event) => {
      try {
        const { files } = event.target;
        if (!files?.length) {
          return;
        }
        const [file] = Array.from(files);
        const fileEvent = await onFileLoad(file);
        const text = (fileEvent.target?.result ?? '') as string;
        setStorage(migrateConfig(JSON.parse(text)));
        toast.success(t('config.toast.import'));
      } catch (error) {
        toast.error(t('config.error.import'));
        throw error;
      }
    },
    [setStorage]
  );

  const exportStorage = useCallback(async () => {
    try {
      setLoading(true);
      const blob = new Blob([JSON.stringify(storage, null)], {
        type: 'application/json',
      });
      const url = (window.URL || window.webkitURL).createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${PLUGIN_NAME}-config.json`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(t('config.toast.export'));
    } catch (error) {
      toast.error(t('config.error.export'));
      throw error;
    } finally {
      setLoading(false);
    }
  }, [storage, setLoading]);

  return { importStorage, exportStorage };
};

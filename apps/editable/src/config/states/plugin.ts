import { restoreStorage, storeStorage } from '@/common/plugin';
import { PLUGIN_NAME } from '@/lib/constants';
import { PLUGIN_ID } from '@/lib/global';
import { t } from '@/lib/i18n';
import { migrateConfig } from '@/lib/plugin';
import { onFileLoad } from '@konomi-app/kintone-utilities';
import { loadingEndAtom, loadingStartAtom } from '@repo/jotai';
import { atom } from 'jotai';
import { enqueueSnackbar } from 'notistack';
import { ChangeEvent } from 'react';
import invariant from 'tiny-invariant';

export const pluginConfigAtom = atom(restoreStorage(PLUGIN_ID));

/**
 * jsonファイルを読み込み、プラグインの設定情報をインポートします
 */
export const importPluginConfigAtom = atom(
  null,
  async (_, set, event: ChangeEvent<HTMLInputElement>) => {
    try {
      set(loadingStartAtom);
      const { files } = event.target;
      invariant(files?.length, 'ファイルが見つかりませんでした');
      const [file] = Array.from(files);
      const fileEvent = await onFileLoad(file!);
      const text = (fileEvent.target?.result ?? '') as string;
      set(pluginConfigAtom, migrateConfig(JSON.parse(text)));
      enqueueSnackbar(t('common.config.toast.import'), { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(t('common.config.error.import'), { variant: 'error' });
      throw error;
    } finally {
      set(loadingEndAtom);
    }
  }
);

/**
 * プラグインの設定情報をjsonファイルとしてエクスポートします
 */
export const exportPluginConfigAtom = atom(null, (get, set) => {
  try {
    set(loadingStartAtom);
    const pluginConfig = get(pluginConfigAtom);
    const blob = new Blob([JSON.stringify(pluginConfig, null)], {
      type: 'application/json',
    });
    const url = (window.URL || window.webkitURL).createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${PLUGIN_NAME}-config.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    enqueueSnackbar(t('common.config.toast.export'), { variant: 'success' });
  } catch (error) {
    enqueueSnackbar(t('common.config.error.export'), { variant: 'error' });
    throw error;
  } finally {
    set(loadingEndAtom);
  }
});

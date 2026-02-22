import { PLUGIN_NAME } from '@/lib/constants';
import { GUEST_SPACE_ID } from '@/lib/global';
import { t } from '@/lib/i18n';
import { createConfig, migrateConfig, restorePluginConfig, VIEW_ROOT_ID } from '@/lib/plugin';
import { PluginConfig } from '@/schema/plugin-config';
import {
  getAppId,
  getViews,
  onFileLoad,
  storePluginConfig,
  updateViews,
} from '@konomi-app/kintone-utilities';
import { handleLoadingEndAtom, handleLoadingStartAtom, usePluginAtoms } from '@repo/jotai';
import { saveAsJson } from '@repo/utils';
import { produce } from 'immer';
import { atom } from 'jotai';
import { toast } from 'sonner';
import { ChangeEvent, ReactNode } from 'react';
import invariant from 'tiny-invariant';

const { config: initialConfig, error: configError } = restorePluginConfig();

export const pluginConfigAtom = atom<PluginConfig>(initialConfig);

/**
 * プラグイン設定の読み込み時に発生したエラーを保持するatom
 * エラーがない場合はnull
 */
export const configErrorAtom = atom<Error | null>(configError ?? null);

export const handlePluginConfigResetAtom = atom(null, (_, set) => {
  set(pluginConfigAtom, createConfig());
  toast.success(t('common.config.toast.reset'));
});

export const {
  pluginConditionsAtom,
  hasMultipleConditionsAtom,
  conditionsLengthAtom,
  selectedConditionIdAtom,
  selectedConditionAtom,
  getConditionPropertyAtom,
  isConditionIdUnselectedAtom,
  // commonConfigAtom,
  // getCommonPropertyAtom,
} = usePluginAtoms(pluginConfigAtom, {
  enableCommonCondition: false,
});

export const handlePluginConditionDeleteAtom = atom(null, (get, set) => {
  const selectedConditionId = get(selectedConditionIdAtom);
  set(pluginConditionsAtom, (prev) =>
    prev.filter((condition) => condition.id !== selectedConditionId)
  );
  set(selectedConditionIdAtom, null);
  toast.success(t('common.config.toast.onConditionDelete'));
});

export const updatePluginConfig = atom(null, async (get, set, actionComponent: ReactNode) => {
  try {
    set(handleLoadingStartAtom);
    const pluginConfig = get(pluginConfigAtom);

    const app = getAppId();
    if (app) {
      try {
        const { views } = await getViews({
          app,
          preview: true,
          guestSpaceId: GUEST_SPACE_ID,
        });

        const newViews = produce(views, (draft) => {
          for (const condition of pluginConfig.conditions) {
            for (const view of Object.values(draft)) {
              if (view.id === condition.viewId && view.type === 'CUSTOM') {
                view.html = `<div id='${VIEW_ROOT_ID}'></div>`;
                view.pager = false;
              }
            }
          }
        });

        await updateViews({ app, views: newViews, guestSpaceId: GUEST_SPACE_ID });
      } catch (error: unknown) {
        const errorObj = error as { code?: string };
        // 'CB_NO02' is kintone's error code for insufficient system administrator permissions.
        if (errorObj?.code === 'CB_NO02') {
          toast.warning(
            '設定を更新しましたが、システム管理権限がないため、一覧の更新がスキップされました。'
          );
        } else {
          console.error('ビューの更新に失敗しました:', error);
        }
      }
    }

    storePluginConfig(pluginConfig, {
      flatProperties: ['conditions'],
      debug: true,
    });
    toast.success(t('common.config.toast.save'), {
      action: actionComponent,
    });
  } finally {
    set(handleLoadingEndAtom);
  }
});

/**
 * jsonファイルを読み込み、プラグインの設定情報をインポートします
 */
export const importPluginConfigAtom = atom(
  null,
  async (_, set, event: ChangeEvent<HTMLInputElement>) => {
    try {
      set(handleLoadingStartAtom);
      const { files } = event.target;
      invariant(files?.length, 'ファイルが見つかりませんでした');
      const [file] = Array.from(files);
      const fileEvent = await onFileLoad(file!);
      const text = (fileEvent.target?.result ?? '') as string;
      set(pluginConfigAtom, migrateConfig(JSON.parse(text)));
      toast.success(t('common.config.toast.import'));
    } catch (error) {
      toast.error(t('common.config.error.import'));
      throw error;
    } finally {
      set(handleLoadingEndAtom);
    }
  }
);

/**
 * プラグインの設定情報をjsonファイルとしてエクスポートします
 */
export const exportPluginConfigAtom = atom(null, (get, set) => {
  try {
    set(handleLoadingStartAtom);
    const pluginConfig = get(pluginConfigAtom);
    saveAsJson(pluginConfig, `${PLUGIN_NAME}-config.json`);
    toast.success(t('common.config.toast.export'));
  } catch (error) {
    toast.error(t('common.config.error.export'));
    throw error;
  } finally {
    set(handleLoadingEndAtom);
  }
});

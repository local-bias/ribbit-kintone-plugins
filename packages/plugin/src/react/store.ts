import { onFileLoad, storePluginConfig } from '@konomi-app/kintone-utilities';
import { atom, handleLoadingEndAtom, handleLoadingStartAtom, usePluginAtoms } from '@repo/jotai';
import { saveAsJson, type TranslationFunction } from '@repo/utils';
import { enqueueSnackbar } from 'notistack';
import type { ChangeEvent, ReactNode } from 'react';
import invariant from 'tiny-invariant';

/**
 * 共通設定(`common`)を持つプラグイン設定情報の最小形です。
 */
type CommonPluginConfigBase = {
  version: number;
  common: Record<string, unknown>;
  conditions: ({ id: string } & Record<string, unknown>)[];
};

/**
 * プラグイン設定情報を操作するためのjotai atom群をまとめて生成します。
 *
 * 各プラグインの`config/states/plugin.ts`に存在していた、設定情報の
 * 復元・リセット・保存・インポート・エクスポートに関する共通ロジックを集約したファクトリです。
 *
 * 通知には`notistack`を使用します。
 *
 * @example
 * ```ts
 * import { createPluginConfigStore } from '@repo/plugin/react';
 * import { PLUGIN_NAME } from '@/lib/constants';
 * import { t } from '@/lib/i18n';
 * import { createConfig, migrateConfig, restorePluginConfig } from '@/lib/plugin';
 * import type { PluginConfig } from '@/schema/plugin-config';
 *
 * export const {
 *   pluginConfigAtom,
 *   pluginConditionsAtom,
 *   selectedConditionIdAtom,
 *   // ...
 * } = createPluginConfigStore<PluginConfig>({
 *   restorePluginConfig,
 *   createConfig,
 *   migrateConfig,
 *   t,
 *   pluginName: PLUGIN_NAME,
 * });
 * ```
 */
export const createPluginConfigStore = <
  Config extends CommonPluginConfigBase,
  AnyConfig = unknown,
>(params: {
  /** 保存されている設定情報を復元する関数 */
  restorePluginConfig: () => Config;
  /** 設定情報のひな形を生成する関数 */
  createConfig: () => Config;
  /** 任意のバージョンの設定情報を最新バージョンへ変換する関数 */
  migrateConfig: (anyConfig: AnyConfig) => Config;
  /** 翻訳関数 */
  t: TranslationFunction;
  /** エクスポート時のファイル名に使用するプラグイン名 */
  pluginName: string;
  /** `storePluginConfig`で展開するプロパティ。既定値は`['conditions']` */
  flatProperties?: (keyof Config)[];
}) => {
  const {
    restorePluginConfig,
    createConfig,
    migrateConfig,
    t,
    pluginName,
    flatProperties = ['conditions'] as (keyof Config)[],
  } = params;

  const pluginConfigAtom = atom<Config>(restorePluginConfig());

  const handlePluginConfigResetAtom = atom(null, (_, set) => {
    set(pluginConfigAtom, createConfig());
    enqueueSnackbar(t('common.config.toast.reset'), { variant: 'success' });
  });

  const pluginAtoms = usePluginAtoms(pluginConfigAtom, { enableCommonCondition: true });
  const { pluginConditionsAtom, selectedConditionIdAtom } = pluginAtoms;

  const handlePluginConditionDeleteAtom = atom(null, (get, set) => {
    const selectedConditionId = get(selectedConditionIdAtom);
    set(pluginConditionsAtom, (prev) =>
      prev.filter((condition) => condition.id !== selectedConditionId)
    );
    set(selectedConditionIdAtom, null);
    enqueueSnackbar(t('common.config.toast.onConditionDelete'), { variant: 'success' });
  });

  const updatePluginConfig = atom(null, (get, set, actionComponent: ReactNode) => {
    try {
      set(handleLoadingStartAtom);
      const pluginConfig = get(pluginConfigAtom);
      storePluginConfig(pluginConfig, {
        flatProperties,
        debug: true,
      });
      enqueueSnackbar(t('common.config.toast.save'), {
        variant: 'success',
        action: actionComponent,
      });
    } finally {
      set(handleLoadingEndAtom);
    }
  });

  /**
   * jsonファイルを読み込み、プラグインの設定情報をインポートします
   */
  const importPluginConfigAtom = atom(
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
        enqueueSnackbar(t('common.config.toast.import'), { variant: 'success' });
      } catch (error) {
        enqueueSnackbar(t('common.config.error.import'), { variant: 'error' });
        throw error;
      } finally {
        set(handleLoadingEndAtom);
      }
    }
  );

  /**
   * プラグインの設定情報をjsonファイルとしてエクスポートします
   */
  const exportPluginConfigAtom = atom(null, (get, set) => {
    try {
      set(handleLoadingStartAtom);
      const pluginConfig = get(pluginConfigAtom);
      saveAsJson(pluginConfig, `${pluginName}-config.json`);
      enqueueSnackbar(t('common.config.toast.export'), { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(t('common.config.error.export'), { variant: 'error' });
      throw error;
    } finally {
      set(handleLoadingEndAtom);
    }
  });

  return {
    pluginConfigAtom,
    handlePluginConfigResetAtom,
    handlePluginConditionDeleteAtom,
    updatePluginConfig,
    importPluginConfigAtom,
    exportPluginConfigAtom,
    ...pluginAtoms,
  };
};

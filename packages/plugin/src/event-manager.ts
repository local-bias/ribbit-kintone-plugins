import { KintoneEventManager } from '@konomi-app/kintone-utilities';

/**
 * プラグイン共通の{@link KintoneEventManager}を生成します。
 *
 * 各プラグインでイベントハンドラを登録する際の共通設定(エラーハンドリング・ログ出力)を
 * まとめたファクトリです。
 *
 * @example
 * ```ts
 * import { createPluginEventManager } from '@repo/plugin';
 * import { PLUGIN_NAME } from './constants';
 * import { isProd } from './global';
 *
 * export const manager = createPluginEventManager({ pluginName: PLUGIN_NAME, isProd });
 * ```
 */
export const createPluginEventManager = (params: { pluginName: string; isProd: boolean }) => {
  const { pluginName, isProd } = params;
  return new KintoneEventManager({
    errorHandler: (error, props) => {
      const { event } = props;
      event.error = `プラグイン「${pluginName}」の処理内でエラーが発生しました。`;
      console.error('エラー', error);
      return event;
    },
    logPrefix: `[${pluginName}] `,
    logDisabled: isProd,
  });
};

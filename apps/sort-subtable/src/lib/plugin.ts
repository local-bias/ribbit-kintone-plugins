import { restorePluginConfig as primitiveRestore } from '@konomi-app/kintone-utilities';
import { PLUGIN_ID } from './global';

/**
 * プラグインの設定情報のひな形を返却します
 */
export const createConfig = (): kintone.plugin.Storage => ({
  ignoreFields: [''],
});

export function restorePluginConfig(): kintone.plugin.Storage {
  return primitiveRestore(PLUGIN_ID) ?? createConfig();
}

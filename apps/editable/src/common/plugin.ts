import { mapValues } from 'remeda';
/**
 * プラグインがアプリ単位で保存している設定情報を返却します
 */
export const restoreStorage = (id: string): kintone.plugin.Storage => {
  const config: Record<string, string> = kintone.plugin.app.getConfig(id);

  if (!Object.keys(config).length) {
    return createConfig();
  }
  return mapValues(config, (value) => JSON.parse(value)) as kintone.plugin.Storage;
};

/**
 * アプリにプラグインの設定情報を保存します
 */
export const storeStorage = (target: Record<string, any>, callback?: () => void): void => {
  const converted = mapValues(target, (value) => JSON.stringify(value));
  kintone.plugin.app.setConfig(converted, callback);
};

/**
 * プラグインの設定情報のひな形を返却します
 */
export const createConfig = (): kintone.plugin.Storage => ({
  conditions: [getNewCondition()],
});

export const getNewCondition = (): kintone.plugin.Condition => ({
  targetField: '',
  rules: [getNewRule()],
});

export const getNewRule = (): kintone.plugin.Condition['rules'][number] => ({
  type: 'equal',
  field: '',
  value: '',
  editable: false,
  connector: 'and',
});

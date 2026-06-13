import { restorePluginConfig as restore } from '@konomi-app/kintone-utilities';
import { nanoid } from 'nanoid';
import {
  type AnyPluginConfig,
  LatestPluginConditionSchema,
  type PluginCommonConfig,
  type PluginCondition,
  type PluginConfig,
  type ValidationRule,
} from '@/schema/plugin-config';
import { isProd, PLUGIN_ID } from './global';

/**
 * プラグインの設定情報が、最新の設定情報の形式に準拠しているか検証します
 *
 * @param condition - 検証する条件オブジェクト
 * @returns プラグインの設定情報が最新の形式に準拠している場合は`true`、そうでない場合は`false`
 */
export const isPluginConditionMet = (condition: unknown): boolean => {
  return LatestPluginConditionSchema.safeParse(condition).success;
};

/**
 * プラグインの設定情報が、プラグインの利用条件を満たしているか検証します
 *
 * この条件を満たさない場合、設定情報は無効となります。
 *
 * @param condition - 検証する条件オブジェクト
 * @returns プラグインの設定情報が利用条件を満たしている場合は`true`、そうでない場合は`false`
 */
export const isUsagePluginConditionMet = (condition: PluginCondition) => {
  return !!condition.fieldCode && condition.rules.length > 0;
};

/**
 * 新しいバリデーションルールを作成します
 */
export const getNewRule = (): ValidationRule => ({
  id: nanoid(),
  type: 'required',
  value: '',
  errorMessage: 'この項目は必須です',
});

/**
 * 新しい条件設定を作成します
 */
export const getNewCondition = (): PluginCondition => ({
  id: nanoid(),
  fieldCode: '',
  targetEvents: ['create', 'edit'],
  showErrorOnChange: true,
  applyConditions: [],
  rules: [getNewRule()],
});

/**
 * プラグインの共通設定の初期値を返却します
 */
export const getNewCommonConfig = (): PluginCommonConfig => ({
  csvImport: {
    enabled: false,
    buttonLabel: 'CSVインポート（入力チェック付き）',
  },
});

/**
 * プラグインの設定情報のひな形を返却します
 */
export const createConfig = (): PluginConfig => ({
  version: 2,
  common: getNewCommonConfig(),
  conditions: [getNewCondition()],
});

/**
 * 古いバージョンの設定情報を新しいバージョンに変換します
 * 各バージョンは次のバージョンへの変換処理を持ち、再帰的なアクセスによって最新のバージョンに変換されます
 *
 * @param anyConfig 保存されている設定情報
 * @returns 新しいバージョンの設定情報
 */
export const migrateConfig = (anyConfig: AnyPluginConfig): PluginConfig => {
  const { version } = anyConfig;
  switch (version) {
    case undefined: {
      return migrateConfig({ ...anyConfig, version: 1 });
    }
    case 1: {
      // V1 -> V2: 各条件に適用条件 `applyConditions` を追加する。
      // 旧バージョンには `common` が存在しない場合があるため、初期値で補完する。
      return migrateConfig({
        version: 2,
        common: { ...getNewCommonConfig(), ...anyConfig.common },
        conditions: anyConfig.conditions.map((condition) => ({
          ...condition,
          applyConditions: [],
        })),
      });
    }
    case 2:
    default: {
      // `default` -> `config.js`と`desktop.js`のバージョンが一致していない場合に通る可能性があるため必要
      // もし新しいバージョンを追加したらここに追加する
      // 後方互換のため、`applyConditions` が欠落している場合は初期値で補完する。
      return {
        ...anyConfig,
        common: { ...getNewCommonConfig(), ...anyConfig.common },
        conditions: anyConfig.conditions.map((condition) => ({
          ...condition,
          applyConditions: condition.applyConditions ?? [],
        })),
      };
    }
  }
};

/**
 * プラグインの設定情報を復元します
 */
export const restorePluginConfig = (): PluginConfig => {
  const config = restore<AnyPluginConfig>(PLUGIN_ID, { debug: !isProd }) ?? createConfig();
  return migrateConfig(config);
};

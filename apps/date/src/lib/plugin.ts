import {
  Adjustment,
  AnyPluginConfig,
  LatestPluginConditionSchema,
  PluginCondition,
  PluginConfig,
} from '@/schema/plugin-config';
import { restorePluginConfig as primitiveRestore } from '@konomi-app/kintone-utilities';
import { DateTimeUnit } from 'luxon';
import { PLUGIN_ID } from './global';
import { nanoid } from 'nanoid';

export const BASIS_TYPES = [
  { label: '入力時の日付', value: 'currentDate' },
  { label: 'フィールドの値', value: 'field' },
] as const satisfies {
  label: string;
  value: PluginCondition['basisType'];
}[];

export const ADJUSTMENT_TARGETS = [
  { label: '年', value: 'year' },
  { label: '月', value: 'month' },
  { label: '日', value: 'day' },
  { label: '時', value: 'hour' },
  { label: '分', value: 'minute' },
  { label: '秒', value: 'second' },
] as const satisfies { label: string; value: Adjustment['target'] }[] satisfies {
  label: string;
  value: DateTimeUnit;
}[];

export const ADJUSTMENT_TYPES = [
  { label: '加算', value: 'add' },
  { label: '減算', value: 'subtract' },
  { label: '最初の値', value: 'start' },
  { label: '最後の値', value: 'end' },
] as const satisfies { label: string; value: Adjustment['type'] }[];

export const ADJUSTMENT_BASIS_TYPES = [
  { label: '固定値', value: 'static' },
  { label: 'フィールドの値', value: 'field' },
] as const satisfies { label: string; value: Adjustment['basisType'] }[];

/**
 * プラグインの設定情報が、最新の設定情報の形式に準拠しているか検証します
 *
 * @param condition - 検証する条件オブジェクト
 * @returns プラグインの設定情報が最新の形式に準拠している場合は`true`、そうでない場合は`false`
 */
export const isPluginConditionMet = (condition: unknown): boolean => {
  return LatestPluginConditionSchema.safeParse(condition).success;
};

export const getNewAdjustment = (): Adjustment => ({
  target: 'year',
  type: 'add',
  basisType: 'static',
  basisFieldCode: '',
  staticValue: 0,
});

export const getNewCondition = (): PluginCondition => ({
  id: nanoid(),
  targetFieldCode: '',
  isTargetFieldDisabled: false,
  basisType: 'currentDate',
  basisFieldCode: '',
  isBulkUpdateButtonVisible: false,
  isBulkUpdateButtonVisibleForSpecificEntities: false,
  visibleFor: [
    {
      type: 'user',
      code: '',
    },
  ],
  adjustments: [getNewAdjustment()],
});

/**
 * プラグインの設定情報のひな形を返却します
 */
export const createConfig = (): PluginConfig => ({
  version: 3,
  common: {},
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
    case undefined:
      //@ts-expect-error
      return migrateConfig({ version: 1, ...anyConfig });
    case 1:
      return migrateConfig({
        version: 2,
        conditions: anyConfig.conditions.map((condition) => ({
          ...condition,
          isBulkUpdateButtonVisible: false,
          isBulkUpdateButtonVisibleForSpecificEntities: false,
          visibleFor: [
            {
              type: 'user',
              code: '',
            },
          ],
        })),
      });
    case 2: {
      return migrateConfig({
        version: 3,
        common: {},
        conditions: anyConfig.conditions.map((condition) => ({
          ...condition,
          id: nanoid(),
        })),
      });
    }
    case 3:
    default:
      // もし新しいバージョンを追加したらここに追加する
      // return migrateConfig({ version: 2, ...anyConfig });
      return anyConfig;
  }
};

/**
 * プラグインの設定情報を復元します
 */
export const restorePluginConfig = (): PluginConfig => {
  const config = primitiveRestore<AnyPluginConfig>(PLUGIN_ID) ?? createConfig();
  return migrateConfig(config);
};

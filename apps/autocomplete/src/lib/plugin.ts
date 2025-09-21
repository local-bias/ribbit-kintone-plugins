import {
  getFieldValueAsString,
  getYuruChara,
  kintoneAPI,
  restoreStorage,
} from '@konomi-app/kintone-utilities';
import { produce } from 'immer';
import { PLUGIN_ID } from './global';
import { z } from 'zod';
import { nanoid } from 'nanoid';

/**
 * プラグインの設定情報のスキーマ定義(バージョン1)
 */
const PluginConditionV1Schema = z.object({
  /** キャッシュID */
  cacheId: z.string(),
  /** プラグインの機能を表示するフィールドのフィールドコード */
  targetFieldCode: z.string(),
  /** 参照先アプリID */
  srcAppId: z.string(),
  /** 参照先フィールドのフィールドコード */
  srcFieldCode: z.string(),
  /** 候補として表示する件数 */
  limit: z.number(),
});
const PluginConfigV1Schema = z.object({
  version: z.literal(1),
  conditions: z.array(PluginConditionV1Schema),
});
type PluginConfigV1 = z.infer<typeof PluginConfigV1Schema>;

const PluginConditionV2Schema = PluginConditionV1Schema.merge(
  z.object({
    /**
     * プラグイン設定を一意に識別するID
     *
     * プラグイン設定の判定の他、設定の並び替えや削除時に使用します
     */
    id: z.string(),
  })
);
const PluginConfigV2Schema = z.object({
  version: z.literal(2),
  common: z.object({}),
  conditions: z.array(PluginConditionV2Schema),
});
type PluginConfigV2 = z.infer<typeof PluginConfigV2Schema>;

type AnyPluginConfig = PluginConfigV1 | PluginConfigV2;
export type PluginConfig = PluginConfigV2;
export type PluginCondition = PluginConfig['conditions'][number];

export const validateCondition = (condition: unknown) => {
  try {
    PluginConditionV2Schema.parse(condition);
    return true;
  } catch {
    return false;
  }
};

export const getNewCondition = (): PluginCondition => ({
  id: nanoid(),
  cacheId: '',
  srcAppId: '',
  srcFieldCode: '',
  targetFieldCode: '',
  limit: 100,
});

/**
 * プラグインの設定情報のひな形を返却します
 */
export const createConfig = (): PluginConfig => ({
  version: 2,
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
      const parsed = PluginConfigV1Schema.parse(anyConfig);
      return migrateConfig({
        version: 2,
        common: {},
        conditions: parsed.conditions.map((condition) => ({ ...condition, id: nanoid() })),
      });
    case 2:
    default:
      return anyConfig;
  }
};

/**
 * プラグインの設定情報を復元します
 */
export const restorePluginConfig = (): PluginConfig => {
  const config = restoreStorage<AnyPluginConfig>(PLUGIN_ID) ?? createConfig();
  return migrateConfig(config);
};

export const getUpdatedStorage = <T extends keyof PluginCondition>(
  storage: PluginConfig,
  props: {
    conditionIndex: number;
    key: T;
    value: PluginCondition[T];
  }
) => {
  const { conditionIndex, key, value } = props;
  return produce(storage, (draft) => {
    draft.conditions[conditionIndex][key] = value;
  });
};

export const getConditionField = <T extends keyof PluginCondition>(
  storage: PluginConfig,
  props: {
    conditionIndex: number;
    key: T;
    defaultValue: NonNullable<PluginCondition[T]>;
  }
): NonNullable<PluginCondition[T]> => {
  const { conditionIndex, key, defaultValue } = props;
  if (!storage.conditions[conditionIndex]) {
    return defaultValue;
  }
  return storage.conditions[conditionIndex][key] ?? defaultValue;
};

export const getAutocompleteValues = (params: {
  records: kintoneAPI.RecordData[];
  srcFieldCode: string;
}) => {
  const { records, srcFieldCode } = params;
  return [...new Set(records.map((record) => getFieldValueAsString(record[srcFieldCode])))].filter(
    (v) => v
  );
};

export const getAutocompleteOptions = (values: string[]) =>
  values.map((v) => ({ label: v, value: v, quickSearch: getYuruChara(v) }));

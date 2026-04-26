import { nanoid } from 'nanoid';
import { z } from 'zod';

/**
 * プラグイン設定の各条件（1つの設定に対する設定）- V1
 */
export const PluginConditionV1Schema = z.object({
  /** 対象ビューID */
  targetViewId: z.string(),
  /** 対象フィールドコード */
  targetField: z.string(),
  /** 設定フィールドコード */
  configField: z.string(),
  /** 設定フィールドを非表示にするか */
  hideConfigField: z.boolean(),
  /** ワードクラウドビューID */
  wordCloudViewId: z.string(),
});

/**
 * プラグイン設定V1
 */
export const PluginConfigV1Schema = z.object({
  version: z.literal(1),
  conditions: z.array(PluginConditionV1Schema),
});

/**
 * プラグイン設定の各条件（1つの設定に対する設定）- V2
 * V1からの変更点: idプロパティを追加
 */
export const PluginConditionV2Schema = z.object({
  /**
   * プラグイン設定を一意に識別するためのID
   * 設定の並び替えに使用されます
   */
  id: z.string(),
  /** 対象ビューID */
  targetViewId: z.string(),
  /** 対象フィールドコード */
  targetField: z.string(),
  /** 設定フィールドコード */
  configField: z.string(),
  /** 設定フィールドを非表示にするか */
  hideConfigField: z.boolean(),
  /** ワードクラウドビューID */
  wordCloudViewId: z.string(),
});

/**
 * プラグイン設定V2
 */
export const PluginConfigV2Schema = z.object({
  version: z.literal(2),
  conditions: z.array(PluginConditionV2Schema),
});

/**
 * プラグイン設定の各条件（1つの設定に対する設定）- V3
 * V2からの変更点: enableSuggestionプロパティを追加
 */
export const PluginConditionV3Schema = z.object({
  /**
   * プラグイン設定を一意に識別するためのID
   * 設定の並び替えに使用されます
   */
  id: z.string(),
  /** 対象ビューID */
  targetViewId: z.string(),
  /** 対象フィールドコード */
  targetField: z.string(),
  /** 設定フィールドコード */
  configField: z.string(),
  /** 設定フィールドを非表示にするか */
  hideConfigField: z.boolean(),
  /** ワードクラウドビューID */
  wordCloudViewId: z.string(),
  /** タグサジェスト機能を有効にするか */
  enableSuggestion: z.boolean(),
});

/**
 * プラグイン設定V3
 */
export const PluginConfigV3Schema = z.object({
  version: z.literal(3),
  conditions: z.array(PluginConditionV3Schema),
});
type PluginConfigV3 = z.infer<typeof PluginConfigV3Schema>;

/** 🔌 過去全てのバージョンを含むプラグインの設定情報 */
export const AnyPluginConfigSchema = z.discriminatedUnion('version', [
  PluginConfigV1Schema,
  PluginConfigV2Schema,
  PluginConfigV3Schema,
]);

export const LatestPluginConditionSchema = PluginConditionV3Schema;

/** 🔌 プラグインがアプリ単位で保存する設定情報 */
export type PluginConfig = PluginConfigV3;

/** 🔌 プラグインの詳細設定 */
export type PluginCondition = PluginConfig['conditions'][number];

/** 🔌 過去全てのバージョンを含むプラグインの設定情報 */
export type AnyPluginConfig = z.infer<typeof AnyPluginConfigSchema>;

/**
 * 新しい条件を作成します
 */
export const getNewCondition = (): PluginCondition => ({
  id: nanoid(),
  targetField: '',
  configField: '',
  targetViewId: '',
  hideConfigField: true,
  wordCloudViewId: '',
  enableSuggestion: true,
});

/**
 * プラグインの設定情報のひな形を返却します
 */
export const createConfig = (): PluginConfig => ({
  version: 3,
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
    case 1: {
      // V1 → V2: conditionsにidを追加
      const { conditions, ...rest } = anyConfig;
      return migrateConfig({
        ...rest,
        version: 2,
        conditions: conditions.map((condition) => ({
          ...condition,
          id: nanoid(),
        })),
      });
    }
    case 2: {
      // V2 → V3: conditionsにenableSuggestionを追加
      const { conditions, ...rest } = anyConfig;
      return migrateConfig({
        ...rest,
        version: 3,
        conditions: conditions.map((condition) => ({
          ...condition,
          enableSuggestion: true,
        })),
      });
    }
    case 3:
    default: {
      return anyConfig;
    }
  }
};

import { z } from 'zod';

const PluginConditionV1Schema = z.object({
  targetFieldCode: z.string(),
  isTargetFieldDisabled: z.boolean(),
  basisType: z.enum(['currentDate', 'field']),
  basisFieldCode: z.string(),
  adjustments: z.array(
    z.object({
      target: z.enum(['year', 'month', 'day', 'hour', 'minute', 'second']),
      type: z.enum(['add', 'subtract', 'start', 'end']),
      basisType: z.enum(['static', 'field']),
      basisFieldCode: z.string(),
      staticValue: z.number(),
    })
  ),
});
const PluginConfigV1Schema = z.object({
  version: z.literal(1),
  conditions: z.array(PluginConditionV1Schema),
});

const PluginConditionV2Schema = z.object({
  // - 追加のプロパティ -----------------------------------------------
  /**
   * `true`の場合、一覧のレコードを一括更新するボタンを表示する
   * @defaultValue `false`
   */
  isBulkUpdateButtonVisible: z.boolean(),
  /**
   * `true`の場合、一括更新ボタンを使用できるユーザーを制御する
   *
   * @defaultValue `false`
   */
  isBulkUpdateButtonVisibleForSpecificEntities: z.boolean(),
  /**
   * 一括更新ボタンを表示するエンティティ(ユーザー、グループ、組織)のタイプとコードの配列
   */
  visibleFor: z.array(
    z.object({
      /**
       * エンティティのタイプ
       *
       * - `user`: ユーザー
       * - `group`: グループ
       * - `organization`: 組織
       */
      type: z.enum(['user', 'group', 'organization']),
      /**
       * エンティティのコード
       */
      code: z.string(),
    })
  ),
  // - 引き続きのプロパティ -----------------------------------------------
  targetFieldCode: z.string(),
  isTargetFieldDisabled: z.boolean(),
  basisType: z.enum(['currentDate', 'field']),
  basisFieldCode: z.string(),
  adjustments: z.array(
    z.object({
      target: z.enum(['year', 'month', 'day', 'hour', 'minute', 'second']),
      type: z.enum(['add', 'subtract', 'start', 'end']),
      basisType: z.enum(['static', 'field']),
      basisFieldCode: z.string(),
      staticValue: z.number(),
    })
  ),
});
const PluginConfigV2Schema = z.object({
  version: z.literal(2),
  conditions: z.array(PluginConditionV2Schema),
});

const PluginConditionV3Schema = z.object({
  // - 追加のプロパティ -----------------------------------------------
  id: z.string(),

  // - 引き続きのプロパティ -------------------------------------------
  targetFieldCode: z.string(),
  isTargetFieldDisabled: z.boolean(),
  basisType: z.enum(['currentDate', 'field']),
  basisFieldCode: z.string(),
  adjustments: z.array(
    z.object({
      target: z.enum(['year', 'month', 'day', 'hour', 'minute', 'second']),
      type: z.enum(['add', 'subtract', 'start', 'end']),
      basisType: z.enum(['static', 'field']),
      basisFieldCode: z.string(),
      staticValue: z.number(),
    })
  ),
  /**
   * `true`の場合、一覧のレコードを一括更新するボタンを表示する
   * @defaultValue `false`
   */
  isBulkUpdateButtonVisible: z.boolean(),
  /**
   * `true`の場合、一括更新ボタンを使用できるユーザーを制御する
   *
   * @defaultValue `false`
   */
  isBulkUpdateButtonVisibleForSpecificEntities: z.boolean(),
  /**
   * 一括更新ボタンを表示するエンティティ(ユーザー、グループ、組織)のタイプとコードの配列
   */
  visibleFor: z.array(
    z.object({
      /**
       * エンティティのタイプ
       *
       * - `user`: ユーザー
       * - `group`: グループ
       * - `organization`: 組織
       */
      type: z.enum(['user', 'group', 'organization']),
      /**
       * エンティティのコード
       */
      code: z.string(),
    })
  ),
});
const PluginConfigV3Schema = z.object({
  version: z.literal(3),
  common: z.object({}),
  conditions: z.array(PluginConditionV3Schema),
});
type PluginConfigV3 = z.infer<typeof PluginConfigV3Schema>;

export type PluginConfig = PluginConfigV3;
export type PluginCondition = PluginConfig['conditions'][number];

export const LatestPluginConditionSchema = PluginConditionV3Schema;

export const AnyPluginConfigSchema = z.discriminatedUnion('version', [
  PluginConfigV1Schema,
  PluginConfigV2Schema,
  PluginConfigV3Schema,
]);

/**
 * 🔌 過去全てのバージョンを含むプラグインの設定情報
 *
 * 設定情報は各ユーザーのkintoneに格納されるため、必ずしも最新バージョンの設定情報が格納されているとは限りません。
 * そのため、設定情報を復元する際には、全てのバージョンに対応した型を使用する必要があります。
 */
export type AnyPluginConfig = z.infer<typeof AnyPluginConfigSchema>;

export type Adjustment = PluginCondition['adjustments'][number];

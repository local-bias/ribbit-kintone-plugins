import { z } from 'zod';

/**
 * 更新タイプの一覧
 * - field: フィールドコピー（デフォルト）
 * - fixed: 固定値
 * - concat: 文字列結合
 * - calc: 計算
 * - date_offset: 日付オフセット（日付フィールドに日数/月数/年数を加減算）
 */
export const BindingTypeEnum = z.enum(['field', 'fixed', 'concat', 'calc', 'date_offset']);
export type BindingType = z.infer<typeof BindingTypeEnum>;

/**
 * 紐づけ設定のスキーマ。
 * type フィールドは V3 途中追加のため optional（未設定は 'field' として扱う）。
 * 各タイプ固有のフィールドも optional で、該当タイプ以外では未使用。
 *
 * concat / calc の式は EmbeddableInput のシリアライズ形式を使用する。
 * フィールドコードは "{{fieldCode:フィールドコード}}" の形式で埋め込まれる。
 */
export const BindingSchema = z.object({
  id: z.string(),
  dstFieldCode: z.string(),
  /** 更新タイプ. 未設定の場合は 'field' として扱う */
  type: BindingTypeEnum.optional(),
  /** type='field': コピー元フィールドコード */
  srcFieldCode: z.string().optional(),
  /** type='fixed': 固定値 */
  fixedValue: z.string().optional(),
  /**
   * type='concat': 文字列結合式（EmbeddableInput 形式）
   * 例: "{{fieldCode:lastName}} {{fieldCode:firstName}}"
   */
  concatExpression: z.string().optional(),
  /**
   * type='calc': 計算式（EmbeddableInput 形式）
   * 例: "{{fieldCode:単価}} * {{fieldCode:数量}} * 1.1"
   */
  calcExpression: z.string().optional(),
  /**
   * type='date_offset': オフセット元の日付フィールドコード
   * DATE / DATETIME / CREATED_TIME / UPDATED_TIME フィールドを指定する
   */
  dateOffsetSrcFieldCode: z.string().optional(),
  /**
   * type='date_offset': オフセット量（正の値で加算、負の値で減算）
   */
  dateOffsetValue: z.number().optional(),
  /**
   * type='date_offset': オフセット単位
   * - 'day': 日単位
   * - 'month': 月単位
   * - 'year': 年単位
   */
  dateOffsetUnit: z.enum(['day', 'month', 'year']).optional(),
});

export type Binding = z.infer<typeof BindingSchema>;

export const PluginConditionV1Schema = z.object({
  /**
   * プラグイン設定を一意に識別するためのID
   * 設定の並び替えに使用されます
   */
  id: z.string(),
  /** 更新先のアプリID */
  dstAppId: z.string(),
  /** 更新先のスペースID */
  dstSpaceId: z.string().nullable(),
  /** 更新先のアプリがゲストスペースであれば`true` */
  isDstAppGuestSpace: z.boolean(),
  /** 更新元アプリのキーとなるフィールド */
  srcKeyFieldCode: z.string(),
  /** 更新先アプリのキーとなるフィールド */
  dstKeyFieldCode: z.string(),
  /** 紐づけ設定 */
  bindings: z.array(
    z.object({
      id: z.string(),
      srcFieldCode: z.string(),
      dstFieldCode: z.string(),
    })
  ),
  /** 更新元のレコードを特定するクエリ */
  srcQuery: z.string(),
  /** キーとなるフィールドに加え、更新先のレコードを特定するクエリ */
  dstQuery: z.string(),
});
export const PluginConfigV1Schema = z.object({
  version: z.literal(1),
  conditions: z.array(PluginConditionV1Schema),
});

export const PluginConditionV2Schema = z.object({
  /**
   * プラグイン設定を一意に識別するためのID
   * 設定の並び替えに使用されます
   */
  id: z.string(),
  /** 更新先のアプリID */
  dstAppId: z.string(),
  /** 更新先のスペースID */
  dstSpaceId: z.string().nullable(),
  /** 更新先のアプリがゲストスペースであれば`true` */
  isDstAppGuestSpace: z.boolean(),
  /** 更新元アプリのキーとなるフィールド */
  srcKeyFieldCode: z.string(),
  /** 更新先アプリのキーとなるフィールド */
  dstKeyFieldCode: z.string(),
  /** 紐づけ設定 */
  bindings: z.array(
    z.object({
      id: z.string(),
      srcFieldCode: z.string(),
      dstFieldCode: z.string(),
    })
  ),
  /** 更新元のレコードを特定するクエリ */
  srcQuery: z.string(),
  /** キーとなるフィールドに加え、更新先のレコードを特定するクエリ */
  dstQuery: z.string(),

  // ─── 追加 ──────────────────────────

  /** 更新先のアプリにレコードが存在しない場合は作成するかどうか. `true`の場合は作成 */
  createIfNotExists: z.boolean(),
});
export const PluginConfigV2Schema = z.object({
  version: z.literal(2),
  common: z.object({
    /** 更新結果を表示するかどうか */
    showResult: z.boolean(),
  }),
  conditions: z.array(PluginConditionV2Schema),
});

/**
 * FieldConditionValue の Zod スキーマ。
 * 外部ライブラリ (@konomi-app/kintone-utilities-react) の型と対応する。
 * passthrough により conditionType ごとの追加フィールドを保持する。
 */
export const FieldConditionValueSchema = z
  .object({
    fieldCode: z.string(),
    conditionType: z.string(),
  })
  .loose();

export const PluginConditionV3Schema = z.object({
  /**
   * プラグイン設定を一意に識別するためのID
   * 設定の並び替えに使用されます
   */
  id: z.string(),
  /** 更新先のアプリID */
  dstAppId: z.string(),
  /** 更新先のスペースID */
  dstSpaceId: z.string().nullable(),
  /** 更新先のアプリがゲストスペースであれば`true` */
  isDstAppGuestSpace: z.boolean(),
  /** 更新元アプリのキーとなるフィールド */
  srcKeyFieldCode: z.string(),
  /** 更新先アプリのキーとなるフィールド */
  dstKeyFieldCode: z.string(),
  /** 紐づけ設定 */
  bindings: z.array(BindingSchema),
  /** 更新元のレコードを特定するクエリ（レガシー形式） */
  srcQuery: z.string(),
  /** キーとなるフィールドに加え、更新先のレコードを特定するクエリ */
  dstQuery: z.string(),
  /** 更新先のアプリにレコードが存在しない場合は作成するかどうか. `true`の場合は作成 */
  createIfNotExists: z.boolean(),

  // ─── 追加 ──────────────────────────

  /**
   * 更新元レコードの実行条件（モダン形式）。
   * event.record を直接評価する。空配列の場合はレガシー形式 (srcQuery) にフォールバックする。
   */
  srcConditions: z.array(FieldConditionValueSchema),

  /** この設定が実行されるトリガーイベント ('create' | 'update' | 'delete' | 'process') */
  triggerEvents: z.array(z.string()),
  /** プロセス変更時に対象とするアクション名。空配列の場合はすべてのアクションが対象 */
  processActions: z.array(z.string()),
  /** プロセス変更時に対象とする変更後のステータス名。空配列の場合はすべてのステータスが対象 */
  processStatuses: z.array(z.string()),
  /** `true`の場合、条件を満たすとき連携先の対象レコードを削除する */
  deleteRelatedRecords: z.boolean(),
});
export const PluginConfigV3Schema = z.object({
  version: z.literal(3),
  common: z.object({
    /** 更新結果を表示するかどうか */
    showResult: z.boolean(),
  }),
  conditions: z.array(PluginConditionV3Schema),
});
type PluginConfigV3 = z.infer<typeof PluginConfigV3Schema>;

export const AnyPluginConfigSchema = z.discriminatedUnion('version', [
  PluginConfigV1Schema,
  PluginConfigV2Schema,
  PluginConfigV3Schema,
]);

export const LatestPluginConditionSchema = PluginConditionV3Schema;

/** 🔌 プラグインがアプリ単位で保存する設定情報 */
export type PluginConfig = PluginConfigV3;

/** 🔌 プラグインの共通設定 */
export type PluginCommonConfig = PluginConfig['common'];

/** 🔌 プラグインの詳細設定 */
export type PluginCondition = PluginConfig['conditions'][number];

/** 🔌 過去全てのバージョンを含むプラグインの設定情報 */
export type AnyPluginConfig = z.infer<typeof AnyPluginConfigSchema>;

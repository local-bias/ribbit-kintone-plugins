import type { FieldConditionValue } from '@konomi-app/kintone-utilities-react';
import { z } from 'zod';
import { MAX_TAB_WIDTH, MIN_TAB_WIDTH } from '@/lib/constants';

export type { FieldConditionValue };

/**
 * 表示方法
 * - `add`: 指定した対象**だけ**を表示する
 * - `sub`: 指定した対象を**非表示**にする
 */
export const DisplayModeSchema = z.enum(['add', 'sub']);

/**
 * タブを表示する画面
 * - `create`: レコード追加画面
 * - `edit`: レコード編集画面
 * - `detail`: レコード詳細画面
 */
export const TargetScreenSchema = z.enum(['create', 'edit', 'detail']);

/**
 * 複数条件の結合方法
 * - `and`: すべての条件を満たす場合に表示
 * - `or`: いずれかの条件を満たす場合に表示
 */
export const ConditionLogicSchema = z.enum(['and', 'or']);

/**
 * フォームへ後から追加された要素の扱い
 *
 * 一括編集で割り当てを保存するときに、各タブへ`add`(指定したものだけ表示)と
 * `sub`(指定したものを非表示)のどちらで書き出すかを決めます。
 * - `show`: 全てのタブで表示する(`sub`で保存する)
 * - `hide`: 全てのタブで非表示にする(`add`で保存する)
 */
export const NewElementPolicySchema = z.enum(['show', 'hide']);

/** `FieldConditionValue`をZodスキーマとして扱うためのラッパー */
const FieldConditionValueSchema = z.unknown() as z.ZodType<FieldConditionValue>;

/** 🔌 v1: 設定を識別するIDを持たない、最も古い形式 */
const PluginConditionV1Schema = z.object({
  tabName: z.string(),
  tabIcon: z.string(),
  displayMode: DisplayModeSchema,
  fields: z.array(z.string()),
  labelDisplayMode: DisplayModeSchema.optional(),
  labels: z.array(z.string()),
  groupDisplayMode: DisplayModeSchema.optional(),
  groups: z.array(z.string()),
  spaceDisplayMode: DisplayModeSchema.optional(),
  spaceIds: z.array(z.string()),
  hidesHR: z.boolean(),
});
const PluginConfigV1Schema = z.object({
  version: z.literal(1),
  conditions: z.array(PluginConditionV1Schema),
});

/** 🔌 v2: 設定の並び替えに使用するIDを追加した形式 */
const PluginConditionV2Schema = PluginConditionV1Schema.extend({ id: z.string() });
const PluginConfigV2Schema = z.object({
  version: z.literal(2),
  conditions: z.array(PluginConditionV2Schema),
});

/**
 * 🔌 v3: 共通設定(`common`)の追加と、フィールド指定のマルチセレクト化に伴う形式
 *
 * - `displayMode`を、他のプロパティと命名を揃えた`fieldDisplayMode`へ変更
 * - 未使用だった`tabIcon`を削除
 * - 表示・非表示の対象を保持する配列から、UIの都合で挿入されていた空文字を除去
 * - 省略可能だった各`displayMode`を必須化(既定値は`sub`)
 */
const PluginConditionV3Schema = z.object({
  id: z.string(),
  tabName: z.string(),
  fieldDisplayMode: DisplayModeSchema,
  fields: z.array(z.string()),
  labelDisplayMode: DisplayModeSchema,
  labels: z.array(z.string()),
  groupDisplayMode: DisplayModeSchema,
  groups: z.array(z.string()),
  spaceDisplayMode: DisplayModeSchema,
  spaceIds: z.array(z.string()),
  hidesHR: z.boolean(),
});
const PluginConfigV3Schema = z.object({
  version: z.literal(3),
  common: z.object({ tabWidth: z.number() }),
  conditions: z.array(PluginConditionV3Schema),
});

/**
 * 🔌 v4: タブの表示条件と、共通設定の項目を追加した形式
 *
 * - `targetScreens`: タブを表示する画面(追加・編集・詳細)
 * - `displayConditions` / `displayConditionLogic`: レコードの値による表示条件
 * - `viewerUsers` / `viewerGroups` / `viewerOrganizations`: 閲覧者による表示条件
 * - `statuses`: プロセス管理のステータスによる表示条件
 */
const PluginConditionV4Schema = PluginConditionV3Schema.extend({
  /**
   * タブを表示する画面
   *
   * 空配列の場合、そのタブはどの画面にも表示されません
   */
  targetScreens: z.array(TargetScreenSchema),
  /**
   * レコードの値による表示条件
   *
   * 空配列の場合は、値による絞り込みを行いません
   */
  displayConditions: z.array(FieldConditionValueSchema),
  /** 複数の表示条件の結合方法 */
  displayConditionLogic: ConditionLogicSchema,
  /**
   * タブを表示するユーザーのログイン名
   *
   * ユーザー・グループ・組織のいずれも空の場合は、全員に表示されます
   */
  viewerUsers: z.array(z.string()),
  /** タブを表示するグループのコード */
  viewerGroups: z.array(z.string()),
  /** タブを表示する組織のコード */
  viewerOrganizations: z.array(z.string()),
  /**
   * タブを表示するプロセス管理のステータス名
   *
   * 空配列の場合は、ステータスによる絞り込みを行いません
   */
  statuses: z.array(z.string()),
});
const PluginCommonConfigV4Schema = z.object({
  /**
   * レコード画面に表示するタブの幅(px)
   *
   * 全てのタブに共通で適用されます
   */
  tabWidth: z.number().int().min(MIN_TAB_WIDTH).max(MAX_TAB_WIDTH),
  /** 最後に選択していたタブを記憶し、次回以降その状態で開くかどうか */
  remembersSelectedTab: z.boolean(),
  /**
   * 未入力の必須フィールドを含むタブに印を付け、保存時にそのタブへ切り替えるかどうか
   *
   * 非表示のフィールドもkintoneの必須チェックの対象になるため、
   * 有効にしておくと「原因の見えない保存エラー」を防げます
   */
  notifiesMissingRequiredFields: z.boolean(),
  /**
   * フォームへ後から追加された要素を、既存のタブでどう扱うか
   *
   * 一括編集から割り当てを保存する際の書き出し方を決める設定で、
   * 保存済みの設定情報の見え方そのものは変わりません
   */
  newElementPolicy: NewElementPolicySchema,
});
const PluginConfigV4Schema = z.object({
  version: z.literal(4),
  common: PluginCommonConfigV4Schema,
  conditions: z.array(PluginConditionV4Schema),
});

/**
 * 🔌 v5: 罫線を要素IDで個別に切り替えられるようにした形式
 *
 * kintoneの2026年2月8日のアップデートで、ラベル・罫線にも要素IDを設定できるようになり、
 * `setFieldShown`が要素IDを受け付けるようになりました。これに合わせて、
 * タブ単位で全ての罫線をまとめて切り替える`hidesHR`を廃止し、
 * 他の要素と同じ「表示方法 + 対象の一覧」の形式へ統一しています。
 *
 * - `hidesHR: true`  -> `hrDisplayMode: 'add'` (指定した罫線だけ表示) + 対象なし = 全て非表示
 * - `hidesHR: false` -> `hrDisplayMode: 'sub'` (指定した罫線を非表示) + 対象なし = 全て表示
 *
 * 要素IDを持たない罫線は空文字をキーとして判定するため、
 * 要素IDを設定していないアプリでは移行後も従来とまったく同じ見え方になります。
 */
const PluginConditionV5Schema = PluginConditionV4Schema.omit({ hidesHR: true }).extend({
  /** 罫線の表示方法 */
  hrDisplayMode: DisplayModeSchema,
  /**
   * 表示・非表示を切り替える罫線の要素ID
   *
   * 要素IDが設定されていない罫線は個別に指定できないため、
   * `add`では全て非表示に、`sub`では全て表示になります
   */
  hrs: z.array(z.string()),
});
const PluginCommonConfigV5Schema = PluginCommonConfigV4Schema.extend({
  /**
   * 表示できる要素が1つも無くなった行を、行ごと畳むかどうか
   *
   * kintoneは行内の要素を全て非表示にしても行そのものを残すため、
   * 非表示にした分の余白が残ることがあります。既定値は`true`です。
   */
  collapsesEmptyRows: z.boolean(),
});
const PluginConfigV5Schema = z.object({
  version: z.literal(5),
  common: PluginCommonConfigV5Schema,
  conditions: z.array(PluginConditionV5Schema),
});
type PluginConfigV5 = z.infer<typeof PluginConfigV5Schema>;

/** 🔌 過去全てのバージョンを含むプラグインの設定情報 */
export const AnyPluginConfigSchema = z.discriminatedUnion('version', [
  PluginConfigV1Schema,
  PluginConfigV2Schema,
  PluginConfigV3Schema,
  PluginConfigV4Schema,
  PluginConfigV5Schema,
]);

export const LatestPluginConditionSchema = PluginConditionV5Schema;

/** 🔌 プラグインがアプリ単位で保存する設定情報 */
export type PluginConfig = PluginConfigV5;

/** 🔌 プラグインの共通設定 */
export type PluginCommonConfig = PluginConfig['common'];

/** 🔌 プラグインの詳細設定 */
export type PluginCondition = PluginConfig['conditions'][number];

/** 🔌 表示・非表示の切り替え方法 */
export type DisplayMode = z.infer<typeof DisplayModeSchema>;

/** 🔌 タブを表示する画面 */
export type TargetScreen = z.infer<typeof TargetScreenSchema>;

/** 🔌 複数条件の結合方法 */
export type ConditionLogic = z.infer<typeof ConditionLogicSchema>;

/** 🔌 フォームへ後から追加された要素の扱い */
export type NewElementPolicy = z.infer<typeof NewElementPolicySchema>;

/** 🔌 過去全てのバージョンを含むプラグインの設定情報 */
export type AnyPluginConfig = z.infer<typeof AnyPluginConfigSchema>;

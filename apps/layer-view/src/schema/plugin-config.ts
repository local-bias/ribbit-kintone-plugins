import { z } from 'zod';

/**
 * プラグイン条件設定 (バージョン1)
 */
export const PluginConditionV1Schema = z.object({
  /**
   * プラグイン設定を一意に識別するためのID
   * 設定の並び替えに使用されます
   */
  id: z.string(),

  /**
   * ページモード: 他アプリを開くか、特定のURLを開くか
   */
  pageMode: z.enum(['app', 'url']).default('app'),

  /**
   * 表示画面: どの画面にボタンを設置するか（複数選択可能）
   */
  displayScreens: z
    .object({
      index: z.boolean().default(false), // 一覧画面
      show: z.boolean().default(false), // 詳細画面
      edit: z.boolean().default(false), // 編集画面
    })
    .default({
      index: false,
      show: false,
      edit: false,
    }),

  /**
   * ボタンラベル
   */
  buttonLabel: z.string().default(''),

  /**
   * 表示モード: どのような形式でページを表示するか
   */
  displayMode: z.enum(['modal', 'drawer', 'split']).default('modal'),

  /**
   * URL (ページモードが'url'の場合)
   */
  url: z.string().default(''),

  /**
   * アプリID (ページモードが'app'の場合)
   */
  appId: z.string().default(''),
});

export const PluginConfigV1Schema = z.object({
  version: z.literal(1),
  conditions: z.array(PluginConditionV1Schema),
});

type PluginConfigV1 = z.infer<typeof PluginConfigV1Schema>;

export const AnyPluginConfigSchema = z.discriminatedUnion('version', [PluginConfigV1Schema]);

export const LatestPluginConditionSchema = PluginConditionV1Schema;

/** 🔌 プラグインがアプリ単位で保存する設定情報 */
export type PluginConfig = PluginConfigV1;

/** 🔌 プラグインの詳細設定 */
export type PluginCondition = PluginConfig['conditions'][number];

/** 🔌 過去全てのバージョンを含むプラグインの設定情報 */
export type AnyPluginConfig = z.infer<typeof AnyPluginConfigSchema>;

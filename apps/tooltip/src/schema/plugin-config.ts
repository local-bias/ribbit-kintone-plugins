import { z } from 'zod';

const PluginConditionV1Schema = z.object({
  field: z.string(),
  label: z.string(),
});
const PluginConfigV1Schema = z.object({
  version: z.literal(1),
  conditions: z.array(PluginConditionV1Schema),
});
type PluginConfigV1 = z.infer<typeof PluginConfigV1Schema>;

const PluginConditionV2Schema = z.object({
  // - 継続 ---------------
  fieldCode: z.string(),
  label: z.string(),
  // - 追加 ---------------
  type: z.union([z.literal('icon'), z.literal('emoji')]),
  emoji: z.string(),
  iconType: z.union([
    z.literal('info'),
    z.literal('warning'),
    z.literal('error'),
    z.literal('success'),
  ]),
  iconColor: z.string(),
});
const PluginConfigV2Schema = z.object({
  version: z.literal(2),
  conditions: z.array(PluginConditionV2Schema),
});
type PluginConfigV2 = z.infer<typeof PluginConfigV2Schema>;

const PluginConditionV3Schema = z.object({
  // - 継続 ---------------
  fieldCode: z.string(),
  label: z.string(),
  type: z.union([z.literal('icon'), z.literal('emoji')]),
  emoji: z.string(),
  iconType: z.union([
    z.literal('info'),
    z.literal('warning'),
    z.literal('error'),
    z.literal('success'),
  ]),
  iconColor: z.string(),
  // - 追加 ---------------
  id: z.string(),
});
const PluginConfigV3Schema = z.object({
  version: z.literal(3),
  conditions: z.array(PluginConditionV3Schema),
});
type PluginConfigV3 = z.infer<typeof PluginConfigV3Schema>;

const PluginConditionV4Schema = z.object({
  // - 継続 ---------------
  fieldCode: z.string(),
  label: z.string(),
  type: z.union([z.literal('icon'), z.literal('emoji')]),
  emoji: z.string(),
  iconType: z.union([
    z.literal('info'),
    z.literal('warning'),
    z.literal('error'),
    z.literal('success'),
  ]),
  iconColor: z.string(),
  /**
   * 設定情報のID
   */
  id: z.string(),
  // - 追加 ---------------
  /**
   * ツールチップを表示する画面
   * - create: レコード追加画面
   * - edit: レコード編集画面
   * - detail: レコード詳細画面
   * - index: 一覧画面
   */
  targetEvents: z.array(
    z.union([z.literal('create'), z.literal('edit'), z.literal('index'), z.literal('detail')])
  ),
  /**
   * ツールチップのデザイン: 背景色
   *
   * ツールチップの`backgroundColor`プロパティに使用されます
   */
  backgroundColor: z.string(),
  /**
   * ツールチップのデザイン: テキストの色
   *
   * ツールチップの`color`プロパティに使用されます
   */
  foregroundColor: z.string(),
});
const PluginConfigV4Schema = z.object({
  version: z.literal(4),
  conditions: z.array(PluginConditionV4Schema),
});
type PluginConfigV4 = z.infer<typeof PluginConfigV4Schema>;

export type PluginConfig = PluginConfigV4;
export type PluginCondition = PluginConfig['conditions'][number];

export const LatestPluginConditionSchema = PluginConditionV4Schema;

/**
 * 🔌 過去全てのバージョンを含むプラグインの設定情報
 *
 * 設定情報は各ユーザーのkintoneに格納されるため、必ずしも最新バージョンの設定情報が格納されているとは限りません。
 * そのため、設定情報を復元する際には、全てのバージョンに対応した型を使用する必要があります。
 */
export type AnyPluginConfig = PluginConfigV1 | PluginConfigV2 | PluginConfigV3 | PluginConfigV4;

export type IconType = PluginCondition['iconType'];
export type ConditionType = PluginCondition['type'];

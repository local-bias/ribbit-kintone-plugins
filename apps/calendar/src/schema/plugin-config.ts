import { z } from 'zod';
import { CalendarViewTypeSchema } from './calendar';

export const PluginConditionV1Schema = z.object({
  viewId: z.string(),
  initialView: CalendarViewTypeSchema,
  enablesAllDay: z.boolean(),
  allDayOption: z.string(),
  enablesNote: z.boolean(),
  slotMaxTime: z.string(),
  slotMinTime: z.string(),
  calendarEvent: z.object({
    titleField: z.string(),
    startField: z.string(),
    endField: z.string(),
    allDayField: z.string(),
    noteField: z.string(),
    categoryField: z.string(),
  }),
});
export const PluginConfigV1Schema = z.object({
  version: z.literal(1),
  conditions: z.array(PluginConditionV1Schema),
});

export const PluginConditionV2Schema = z.object({
  viewId: z.string(),
  initialView: CalendarViewTypeSchema,
  enablesAllDay: z.boolean(),
  allDayOption: z.string(),
  enablesNote: z.boolean(),
  slotMaxTime: z.string(),
  slotMinTime: z.string(),
  colors: z.array(z.string()),
  calendarEvent: z.object({
    titleField: z.string(),
    startField: z.string(),
    endField: z.string(),
    allDayField: z.string(),
    noteField: z.string(),
    categoryField: z.string(),
  }),
});
export const PluginConfigV2Schema = z.object({
  version: z.literal(2),
  conditions: z.array(PluginConditionV2Schema),
});

const PluginCalendarEventV3Schema = z.object({
  startField: z.string(),
  endField: z.string(),
  allDayField: z.string(),
  noteField: z.string(),
  categoryField: z.string(),

  // ------ 追加 ------
  /** 登録時に入力するタイトル */
  inputTitleField: z.string(),
  /**
   * カレンダーに表示するタイトル
   *
   * 計算フィールドなどが使用されることを想定
   *
   * 未指定の場合は`inputTitleField`と同じ値が使用される
   */
  displayTitleField: z.string(),

  // ------ 削除 ------
  // titleField: z.string(),
});
export const PluginConditionV3Schema = z.object({
  // ------ 継続 ------
  viewId: z.string(),
  initialView: CalendarViewTypeSchema,
  enablesAllDay: z.boolean(),
  allDayOption: z.string(),
  enablesNote: z.boolean(),
  slotMaxTime: z.string(),
  slotMinTime: z.string(),
  colors: z.array(z.string()),
  calendarEvent: PluginCalendarEventV3Schema,
  // ------ 追加 ------
  id: z.string(),
  /**
   * 週表示時に表示する曜日
   *
   * 0: 日曜日
   * 1: 月曜日
   * 2: 火曜日
   * 3: 水曜日
   * 4: 木曜日
   * 5: 金曜日
   * 6: 土曜日
   */
  daysOfWeek: z.array(
    z.union([
      z.literal(0),
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.literal(5),
      z.literal(6),
    ])
  ),
});
export const PluginConfigV3Schema = z.object({
  version: z.literal(3),
  common: z.object({}),
  conditions: z.array(PluginConditionV3Schema),
});

export const PluginConditionV4Schema = z.object({
  viewId: z.string(),
  initialView: CalendarViewTypeSchema,
  enablesAllDay: z.boolean(),
  allDayOption: z.string(),
  enablesNote: z.boolean(),
  slotMaxTime: z.string(),
  slotMinTime: z.string(),
  colors: z.array(z.string()),
  calendarEvent: PluginCalendarEventV3Schema,
  id: z.string(),
  /**
   * 週表示時に表示する曜日
   *
   * 0: 日曜日
   * 1: 月曜日
   * 2: 火曜日
   * 3: 水曜日
   * 4: 木曜日
   * 5: 金曜日
   * 6: 土曜日
   */
  daysOfWeek: z.array(
    z.union([
      z.literal(0),
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.literal(5),
      z.literal(6),
    ])
  ),
  // ------ 追加 ------
  /**
   * 週の始まりの曜日
   *
   * @default 0 (日曜日)
   */
  firstDay: z.number(),
});
export const PluginConfigV4Schema = z.object({
  version: z.literal(4),
  common: z.object({}),
  conditions: z.array(PluginConditionV4Schema),
});

const PluginCalendarEventV5Schema = PluginCalendarEventV3Schema.extend({
  // ------ 追加 ------
  /** 繰り返し予定の情報(JSON)を保存するフィールド */
  recurrenceField: z.string(),
});
export const PluginConditionV5Schema = z.object({
  viewId: z.string(),
  initialView: CalendarViewTypeSchema,
  enablesAllDay: z.boolean(),
  allDayOption: z.string(),
  enablesNote: z.boolean(),
  slotMaxTime: z.string(),
  slotMinTime: z.string(),
  colors: z.array(z.string()),
  calendarEvent: PluginCalendarEventV5Schema,
  id: z.string(),
  daysOfWeek: z.array(
    z.union([
      z.literal(0),
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(4),
      z.literal(5),
      z.literal(6),
    ])
  ),
  firstDay: z.number(),
  // ------ 追加 ------
  /** 繰り返し予定機能を有効にするかどうか */
  enablesRecurrence: z.boolean(),
});
export const PluginConfigV5Schema = z.object({
  version: z.literal(5),
  common: z.object({}),
  conditions: z.array(PluginConditionV5Schema),
});

/**
 * 予定の追加・編集方法
 *
 * - simple: プラグイン独自のダイアログで編集する
 * - detailed: kintone標準のレコード追加・編集画面をダイアログ内にiframeで表示する
 */
export const EditModeSchema = z.enum(['simple', 'detailed']);
export type EditMode = z.infer<typeof EditModeSchema>;

export const PluginConditionV6Schema = PluginConditionV5Schema.extend({
  // ------ 追加 ------
  /** 予定の追加・編集方法 */
  editMode: EditModeSchema,
});
export const PluginConfigV6Schema = z.object({
  version: z.literal(6),
  common: z.object({}),
  conditions: z.array(PluginConditionV6Schema),
});

export const LatestPluginConditionSchema = PluginConditionV6Schema;

export type PluginConfig = z.infer<typeof PluginConfigV6Schema>;
export type PluginCommonConfig = PluginConfig['common'];
export type PluginCondition = PluginConfig['conditions'][number];

export const AnyPluginConfigSchema = z.discriminatedUnion('version', [
  PluginConfigV1Schema,
  PluginConfigV2Schema,
  PluginConfigV3Schema,
  PluginConfigV4Schema,
  PluginConfigV5Schema,
  PluginConfigV6Schema,
]);

export type AnyPluginConfig = z.infer<typeof AnyPluginConfigSchema>;

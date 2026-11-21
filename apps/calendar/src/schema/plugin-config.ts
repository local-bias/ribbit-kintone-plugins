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
 * - detailView: 予定のクリック時はkintone標準のレコード詳細画面をダイアログ内にiframeで表示する
 *   (予定の追加・編集は`detailed`と同じくkintone標準の追加・編集画面で行う)
 */
export const EditModeSchema = z.enum(['simple', 'detailed', 'detailView']);
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

/** 同じ時刻の予定の並び順 */
export const EventSortOrderSchema = z.enum(['asc', 'desc']);
export type EventSortOrder = z.infer<typeof EventSortOrderSchema>;

const PluginCalendarEventV7Schema = PluginCalendarEventV5Schema.extend({
  // ------ 追加 ------
  /** 背景イベントとして表示するかどうかを判定するチェックボックスフィールド */
  backgroundEventField: z.string(),
  /** 同じ時刻の予定の並び順を決めるフィールド(未指定の場合はタイトル順) */
  sortField: z.string(),
});
export const PluginConditionV7Schema = PluginConditionV6Schema.extend({
  calendarEvent: PluginCalendarEventV7Schema,
  // ------ 追加 ------
  /** 時間枠ビューの1マスあたりの時間(`HH:mm:ss`) */
  slotDuration: z.string(),
  /** 時間枠ビューの表示時に、現在時刻付近まで自動でスクロールするかどうか */
  scrollsToNow: z.boolean(),
  /** ヘッダーに表示する表示形式の切り替えボタン(空の場合はすべて表示) */
  visibleViews: z.array(CalendarViewTypeSchema),
  /** ドラッグ&ドロップ・リサイズによる日時の変更を許可するかどうか */
  enablesDragAndDrop: z.boolean(),
  /** ドラッグ&ドロップ・リサイズで日時を変更する前に確認するかどうか */
  confirmsReschedule: z.boolean(),
  /** 予定同士の時間帯の重複を禁止するかどうか(カレンダー上の操作のみ対象) */
  preventsOverlap: z.boolean(),
  /** カレンダーの上部にカテゴリーの凡例を表示するかどうか */
  showsLegend: z.boolean(),
  /** 背景イベントを有効にするかどうか */
  enablesBackgroundEvent: z.boolean(),
  /** `backgroundEventField`のうち、背景イベントとして扱う選択肢 */
  backgroundEventOption: z.string(),
  /** `calendarEvent.sortField`による並び順 */
  sortOrder: EventSortOrderSchema,
});
export const PluginConfigV7Schema = z.object({
  version: z.literal(7),
  common: z.object({}),
  conditions: z.array(PluginConditionV7Schema),
});

const PluginCalendarEventV8Schema = PluginCalendarEventV7Schema.extend({
  // ------ 追加 ------
  /**
   * 予定の担当者として扱うフィールド(未指定の場合は担当者による絞り込みを行わない)
   *
   * カテゴリーとは別の軸として、サイドバーで絞り込むために使用する。
   * ユーザー系のフィールドの場合はアバターを表示する
   */
  assigneeField: z.string(),
});
export const PluginConditionV8Schema = PluginConditionV7Schema.extend({
  calendarEvent: PluginCalendarEventV8Schema,
});
export const PluginConfigV8Schema = z.object({
  version: z.literal(8),
  common: z.object({}),
  conditions: z.array(PluginConditionV8Schema),
});

export const LatestPluginConditionSchema = PluginConditionV8Schema;

export type PluginConfig = z.infer<typeof PluginConfigV8Schema>;
export type PluginCommonConfig = PluginConfig['common'];
export type PluginCondition = PluginConfig['conditions'][number];

export const AnyPluginConfigSchema = z.discriminatedUnion('version', [
  PluginConfigV1Schema,
  PluginConfigV2Schema,
  PluginConfigV3Schema,
  PluginConfigV4Schema,
  PluginConfigV5Schema,
  PluginConfigV6Schema,
  PluginConfigV7Schema,
  PluginConfigV8Schema,
]);

export type AnyPluginConfig = z.infer<typeof AnyPluginConfigSchema>;

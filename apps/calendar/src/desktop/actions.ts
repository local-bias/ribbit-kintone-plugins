import {
  calendarDateInputToDateTime,
  calendarEventDatesToKintone,
  CalendarFieldType,
  dateTimeToCalendarValue,
  getDefaultEndDate as getDefaultEndDateInZone,
  getDefaultStartDate as getDefaultStartDateInZone,
  getLoginUserTimezone,
  kintoneRecordDatesToCalendar,
} from '@/desktop/date-conversion';
import {
  applyRecurrenceMetaToEventInput,
  parseRecurrenceMeta,
  RecurrenceMasterMeta,
  serializeRecurrenceMeta,
} from '@/desktop/recurrence';
import { GUEST_SPACE_ID } from '@/lib/global';
import { htmlToMarkdown, markdownToHtml } from '@/lib/html-markdown-converter';
import { t } from '@/lib/i18n-plugin';
import { getSortedOptions } from '@/lib/utils';
import { PluginCondition } from '@/schema/plugin-config';
import {
  addRecord,
  AddRecordParams,
  getAppId,
  getYuruChara,
  kintoneAPI,
  updateRecord,
} from '@konomi-app/kintone-utilities';
import { produce } from 'immer';
import { PluginCalendarEvent } from './states/calendar';

const toCalendarFieldType = (property: kintoneAPI.FieldProperty | undefined): CalendarFieldType | undefined => {
  if (!property) return undefined;
  return property.type === 'DATE' ? 'DATE' : 'DATETIME';
};

export const getDefaultStartDate = (): string => getDefaultStartDateInZone(getLoginUserTimezone());
export const getDefaultEndDate = (): string => getDefaultEndDateInZone(getLoginUserTimezone());

export const completeCalendarEvent = (eventInput: PluginCalendarEvent) => {
  return produce(eventInput, (draft) => {
    if (!draft.start) draft.start = draft.end;
    if (!draft.end) {
      if (draft.allDay && draft.start) {
        const zone = getLoginUserTimezone();
        const startOfNextDay = calendarDateInputToDateTime(draft.start, zone).plus({ days: 1 });
        draft.end = dateTimeToCalendarValue(startOfNextDay, true);
      } else {
        draft.end = draft.start;
      }
    }
  });
};

export const getKintoneRecordFromCalendarEvent = async (params: {
  calendarEvent: PluginCalendarEvent;
  condition: PluginCondition;
  properties: kintoneAPI.FieldProperties;
}): Promise<AddRecordParams['record']> => {
  const { calendarEvent, condition, properties } = params;
  const { calendarEvent: calendarConfig } = condition;

  const startProperty = properties[calendarConfig.startField];
  const endProperty = properties[calendarConfig.endField];

  // DATE型フィールドが使用されている場合、フィールド型に関わらず全日イベントとして扱う
  // (読み込み側 getCalendarEventFromKintoneRecord と同じ強制ルール)
  const allDay =
    startProperty.type === 'DATE' || endProperty?.type === 'DATE' || !!calendarEvent.allDay;

  const { start, end } = calendarEventDatesToKintone({
    start: calendarEvent.start,
    end: calendarEvent.end,
    allDay,
    startFieldType: toCalendarFieldType(startProperty)!,
    endFieldType: toCalendarFieldType(endProperty),
    zone: getLoginUserTimezone(),
  });

  const record: AddRecordParams['record'] = {};

  if (calendarConfig.inputTitleField) {
    record[calendarConfig.inputTitleField] = { value: calendarEvent.title ?? '' };
  }
  if (calendarConfig.startField) {
    record[calendarConfig.startField] = { value: start || '' };
  }
  if (calendarConfig.endField) {
    record[calendarConfig.endField] = { value: end || '' };
  }
  if (condition.enablesAllDay && condition.allDayOption && calendarConfig.allDayField) {
    record[calendarConfig.allDayField] = {
      value: calendarEvent.allDay ? [condition.allDayOption] : [],
    };
  }
  if (condition.enablesRecurrence && calendarConfig.recurrenceField) {
    record[calendarConfig.recurrenceField] = {
      value: calendarEvent.extendedProps?.recurrence
        ? serializeRecurrenceMeta(calendarEvent.extendedProps.recurrence)
        : '',
    };
  }
  if (condition.enablesNote && calendarConfig.noteField) {
    const noteProperty = properties[calendarConfig.noteField];
    const isRichText = noteProperty?.type === 'RICH_TEXT';
    // リッチテキストフィールドの場合のみMarkdown→HTML変換を実施
    const noteValue = isRichText
      ? await markdownToHtml(calendarEvent.note ?? '')
      : calendarEvent.note ?? '';
    record[calendarConfig.noteField] = { value: noteValue };
  }
  if (calendarConfig.categoryField) {
    record[calendarConfig.categoryField] = { value: calendarEvent.category ?? '' };
  }

  process.env.NODE_ENV === 'development' &&
    console.log('♻ カレンダーイベントがkintoneレコードに変換されました', {
      calendarEvent,
      record,
    });
  return record;
};

export const getCalendarEventFromKintoneRecord = async (params: {
  condition: PluginCondition;
  properties: kintoneAPI.FieldProperties;
  record: kintoneAPI.RecordData;
}): Promise<PluginCalendarEvent> => {
  const { condition, properties, record } = params;

  const startProperty = properties[condition.calendarEvent.startField];
  const endProperty = properties[condition.calendarEvent.endField];

  const colors = getEventColors({
    value: record[condition.calendarEvent.categoryField]?.value,
    condition,
    properties,
  });

  // リッチテキストフィールドの場合のみHTML→Markdown変換を実施
  const noteProperty = properties[condition.calendarEvent.noteField];
  const isRichText = noteProperty?.type === 'RICH_TEXT';
  const rawNote = record[condition.calendarEvent.noteField]?.value as string | undefined;
  const noteValue = rawNote && isRichText ? await htmlToMarkdown(rawNote) : rawNote;

  // 日付フィールドが使用されている場合、フィールド型に関わらず全日イベントとして扱う
  let allDay: boolean;
  if (startProperty.type === 'DATE' || endProperty?.type === 'DATE') {
    allDay = true;
  } else if (condition.enablesAllDay && condition.allDayOption) {
    const options = record[condition.calendarEvent.allDayField]?.value as string[] | undefined;
    allDay = !!options?.includes(condition.allDayOption);
  } else {
    allDay = false;
  }

  const { start, end } = kintoneRecordDatesToCalendar({
    startValue: record[condition.calendarEvent.startField]?.value as string | undefined,
    endValue: record[condition.calendarEvent.endField]?.value as string | undefined,
    allDay,
    zone: getLoginUserTimezone(),
  });

  // 生の(未加工の)繰り返しメタ情報。start/endは常にこのレコード自身の値(マスターの場合は
  // 第1回の日時)を保持し、FullCalendar描画用のrrule/duration変換はレンダリング直前の
  // renderableCalendarEventsAtom(states/calendar.ts)でのみ行う。
  const recurrenceMeta = condition.calendarEvent.recurrenceField
    ? parseRecurrenceMeta(record[condition.calendarEvent.recurrenceField]?.value as string | undefined)
    : null;

  const calendarEvent: PluginCalendarEvent = {
    id: record.$id.value as string | undefined,
    start,
    end,
    allDay,
    ...(recurrenceMeta ? { extendedProps: { recurrence: recurrenceMeta } } : {}),
    title: record[condition.calendarEvent.inputTitleField]?.value as string | undefined,
    note: noteValue,
    category: record[condition.calendarEvent.categoryField]?.value as string | undefined,
    __quickSearch: getYuruChara(
      [
        record[condition.calendarEvent.inputTitleField]?.value,
        noteValue,
        record[condition.calendarEvent.categoryField]?.value,
      ]
        .filter(Boolean)
        .join('_$$_')
    ),
    ...colors,
  };

  process.env.NODE_ENV === 'development' &&
    console.info('♻ kintoneレコードがカレンダーイベントに変換されました', {
      record,
      calendarEvent,
    });

  return calendarEvent;
};

export const addNewRecord = async (params: {
  calendarEvent: PluginCalendarEvent;
  condition: PluginCondition;
  properties: kintoneAPI.FieldProperties;
}): Promise<PluginCalendarEvent> => {
  const { calendarEvent, condition, properties } = params;

  const newEvent = {
    ...calendarEvent,
    title: calendarEvent.title || t('desktop.calendar.noTitle'),
    // getCalendarEventFromKintoneRecord(読み込み時の変換)でしか色は計算されないため、
    // ここで明示的に計算しないと次のリロードまで書式(背景色等)が反映されない。
    ...getEventColors({ value: calendarEvent.category, condition, properties }),
  };

  const record = await getKintoneRecordFromCalendarEvent({
    calendarEvent: newEvent,
    condition,
    properties,
  });

  process.env.NODE_ENV === 'development' && console.info('レコードを追加します', record);

  const response = await addRecord({
    app: getAppId()!,
    record,
    guestSpaceId: GUEST_SPACE_ID,
    debug: process.env.NODE_ENV === 'development',
  });

  newEvent.id = response.id;
  return newEvent;
};

export const reschedule = async (params: {
  calendarEvent: PluginCalendarEvent;
  condition: PluginCondition;
  properties: kintoneAPI.FieldProperties;
}) => {
  const { calendarEvent, condition, properties } = params;
  const { id } = calendarEvent;
  if (!id) {
    throw t('desktop.error.scheduleRecordNotFound');
  }

  const app = getAppId()!;
  const record = await getKintoneRecordFromCalendarEvent({ calendarEvent, condition, properties });
  return updateRecord({
    app,
    id,
    record,
    guestSpaceId: GUEST_SPACE_ID,
    debug: process.env.NODE_ENV === 'development',
  });
};

/**
 * 繰り返し予定の「この回のみ」を編集するためのkintone未登録の下書きイベントを生成します。
 *
 * マスターの各項目(タイトル・備考・カテゴリー等)を複製しつつ、日時だけをクリックされた
 * オカレンス自身の日時に差し替えます。ここではkintoneへの書き込みは一切行わず(キャンセル時に
 * 何も後始末が要らないようにするため)、ダイアログ保存時に他の新規イベントと同じ
 * `addNewRecord`経路でレコード化されます。
 */
export const buildOverrideDraftEvent = (params: {
  master: PluginCalendarEvent;
  occurrenceStart: string;
  occurrenceEnd: string;
}): PluginCalendarEvent => {
  const { master, occurrenceStart, occurrenceEnd } = params;
  if (!master.id) {
    throw t('desktop.error.recurrenceMasterNotFound');
  }

  return {
    ...master,
    id: undefined,
    start: occurrenceStart,
    end: occurrenceEnd,
    extendedProps: {
      recurrence: { kind: 'override', masterId: master.id, originalStart: occurrenceStart },
    },
  };
};

/**
 * マスターの`exceptions`(除外/分離済みオカレンス一覧)に1件追加してkintoneへ保存します。
 * 「この回のみ編集」の保存確定時、および「この回のみ削除」で呼び出されます。
 */
export const patchMasterException = async (params: {
  calendarEvents: PluginCalendarEvent[];
  masterId: string;
  occurrenceStart: string;
  condition: PluginCondition;
  properties: kintoneAPI.FieldProperties;
}): Promise<PluginCalendarEvent> => {
  const { calendarEvents, masterId, occurrenceStart, condition, properties } = params;

  const master = calendarEvents.find((event) => event.id === masterId);
  if (!master || master.extendedProps?.recurrence?.kind !== 'master') {
    throw t('desktop.error.recurrenceMasterNotFound');
  }

  const updatedMaster = produce(master, (draft) => {
    const recurrence = draft.extendedProps!.recurrence as RecurrenceMasterMeta;
    if (!recurrence.exceptions.includes(occurrenceStart)) {
      recurrence.exceptions.push(occurrenceStart);
    }
  });

  await reschedule({ calendarEvent: updatedMaster, condition, properties });

  return updatedMaster;
};

const getForegroundColor = (backgroundColor: string) => {
  try {
    const hex = backgroundColor.substring(1);
    const [r, g, b] = [
      parseInt(hex.substring(0, 2), 16),
      parseInt(hex.substring(2, 4), 16),
      parseInt(hex.substring(4, 6), 16),
    ];
    const brightness = r * 0.299 + g * 0.587 + b * 0.114;
    return brightness > 186 ? '#000000' : '#ffffff';
  } catch (error) {
    console.log('failed to get foreground color', error);
    return '#ffffff';
  }
};

const getEventBackgroundColor = (
  value: kintoneAPI.RecordData[string]['value'] | undefined,
  condition: PluginCondition,
  properties: kintoneAPI.FieldProperties
) => {
  const { colors } = condition;
  if (!value) {
    return colors[0];
  }

  const keyProperty: kintoneAPI.FieldProperty | undefined =
    properties[condition.calendarEvent.categoryField];
  if (
    keyProperty?.type === 'CHECK_BOX' ||
    keyProperty?.type === 'DROP_DOWN' ||
    keyProperty?.type === 'RADIO_BUTTON'
  ) {
    const index = getSortedOptions(keyProperty.options).findIndex(
      (option) => option.label === value
    );
    if (index === -1) {
      return colors[0];
    }
    return colors[index % colors.length];
  }

  return colors[0];
};

export const getEventColors = (params: {
  value: kintoneAPI.RecordData[string]['value'] | undefined;
  condition: PluginCondition;
  properties: kintoneAPI.FieldProperties;
}): Pick<PluginCalendarEvent, 'backgroundColor' | 'borderColor' | 'textColor' | 'color'> => {
  const { value, condition, properties } = params;

  const background = getEventBackgroundColor(value, condition, properties);
  const foreground = getForegroundColor(background);

  return {
    color: `${foreground}aa`,
    backgroundColor: background,
    borderColor: `${foreground}22`,
    textColor: foreground,
  };
};


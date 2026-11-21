import {
  buildEventOrder,
  buildViewButtons,
  isDayViewSelectable,
  getScrollTimeAroundNow,
  resolveFirstDay,
  resolveInitialView,
  resolveSlotRange,
} from '@/desktop/calendar-options';
import { useCalendar } from '@/desktop/hooks/use-calendar';
import { EVENT_DATA_ATTRIBUTES, openEventContextMenuAtom } from '@/desktop/states/context-menu';
import { readStoredViewType, storeViewType } from '@/desktop/view-storage';
import { getSlotTime } from '@/lib/calendar';
import { t } from '@/lib/i18n-plugin';
import { DEFAULT_SLOT_DURATION } from '@/schema/calendar';
import { DatesSetArg, EventApi, EventMountArg } from '@fullcalendar/core';
import allLocales from '@fullcalendar/core/locales-all';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import rrulePlugin from '@fullcalendar/rrule';
import timeGridPlugin from '@fullcalendar/timegrid';
import { useAtomValue, useSetAtom } from 'jotai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  fullcalendarApiAtom,
  fullcalendarRefAtom,
  handleCalendarDateSelectAtom,
  handleCalendarEventAddAtom,
  renderableCalendarEventsAtom,
} from '../../states/calendar';
import { loginUserAtom, pluginConditionAtom } from '../../states/kintone';
import CalendarLegend from '../legend';
import DayHeader from './day-header';
import CalendarEvent from './event';

/** 現在時刻付近へ自動スクロールしない場合の初期スクロール位置(FullCalendarの既定値) */
const DEFAULT_SCROLL_TIME = '06:00:00';

/** 予定の重複を禁止する場合でも、背景イベントの上には予定を配置できるようにする */
const allowsOverlapWith = (stillEvent: EventApi) => stillEvent.display === 'background';

/** 右クリックメニューで操作対象の予定を特定できるよう、予定の要素に識別情報を付与する */
const handleEventDidMount = ({ el, event }: EventMountArg) => {
  if (!event.id) return;
  el.setAttribute(EVENT_DATA_ATTRIBUTES.id, event.id);
  el.setAttribute(EVENT_DATA_ATTRIBUTES.start, event.startStr);
  el.setAttribute(EVENT_DATA_ATTRIBUTES.end, event.endStr);
};

function FullCalendarRoot() {
  const setFullcalendarRef = useSetAtom(fullcalendarRefAtom);
  const calendarEvents = useAtomValue(renderableCalendarEventsAtom);
  const pluginCondition = useAtomValue(pluginConditionAtom);
  const onCalendarDateSelect = useSetAtom(handleCalendarDateSelectAtom);
  const onCalendarEventAdd = useSetAtom(handleCalendarEventAddAtom);
  const { onCalendarEventClick, onCalendarEventChange, onCalendarEventRemove } = useCalendar();
  const loginUser = useAtomValue(loginUserAtom);
  const conditionId = pluginCondition?.id ?? '';
  const visibleViews = pluginCondition?.visibleViews ?? [];

  // FullCalendarは`initialView`をマウント時にしか参照しないため、初回の描画時にのみ決定する
  const [initialView] = useState(() =>
    resolveInitialView({
      stored: readStoredViewType(conditionId),
      initialView: pluginCondition?.initialView ?? 'timeGridWeek',
      visibleViews,
    })
  );
  const scrollTime = useMemo(
    () =>
      pluginCondition?.scrollsToNow
        ? getScrollTimeAroundNow(loginUser.timezone)
        : DEFAULT_SCROLL_TIME,
    [pluginCondition?.scrollsToNow, loginUser.timezone]
  );
  const firstDay = useMemo(
    () => resolveFirstDay(pluginCondition?.firstDay ?? 0, loginUser.timezone),
    [pluginCondition?.firstDay, loginUser.timezone]
  );
  const eventOrder = useMemo(
    () =>
      buildEventOrder({
        sortField: pluginCondition?.calendarEvent.sortField ?? '',
        sortOrder: pluginCondition?.sortOrder ?? 'asc',
      }),
    [pluginCondition?.calendarEvent.sortField, pluginCondition?.sortOrder]
  );
  const viewButtons = buildViewButtons(visibleViews);
  const preventsOverlap = !!pluginCondition?.preventsOverlap;
  // 日表示に切り替えられない設定では、日付のクリックで日表示へ移動させない(戻れなくなるため)
  const enablesNavLinks = isDayViewSelectable(visibleViews);
  const { slotMinTime, slotMaxTime } = resolveSlotRange({
    slotMinTime: pluginCondition?.slotMinTime ?? '',
    slotMaxTime: pluginCondition?.slotMaxTime ?? '',
  });

  const onDatesSet = useCallback(
    ({ view }: DatesSetArg) => {
      if (conditionId) storeViewType(conditionId, view.type);
    },
    [conditionId]
  );

  const locale = (() => {
    switch (loginUser.language) {
      case 'ja':
        return 'ja';
      case 'zh':
        return 'zh-cn';
      case 'zh-TW':
        return 'zh-tw';
      case 'es':
        return 'es';
      default:
        return 'en';
    }
  })();

  return (
    <FullCalendar
      ref={setFullcalendarRef}
      locale={locale}
      timeZone={loginUser.timezone}
      locales={allLocales}
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, rrulePlugin]}
      initialView={initialView}
      datesSet={onDatesSet}
      businessHours={{
        daysOfWeek: pluginCondition?.daysOfWeek,
        startTime: '00:00',
        endTime: '24:00',
      }}
      views={{
        timeGridThreeDay: {
          type: 'timeGrid',
          duration: { days: 3 },
          buttonText: t('desktop.calendar.viewType.threeDay'),
        },
        timeGridFiveDay: {
          type: 'timeGrid',
          duration: { days: 5 },
          buttonText: t('desktop.calendar.viewType.fiveDay'),
        },
      }}
      firstDay={firstDay}
      headerToolbar={{
        left: 'title',
        center: '',
        right: [viewButtons, 'today prev,next'].filter(Boolean).join(' '),
      }}
      navLinks={enablesNavLinks}
      navLinkDayClick='timeGridDay'
      events={calendarEvents}
      allDaySlot={pluginCondition?.enablesAllDay}
      editable={pluginCondition?.enablesDragAndDrop ?? true}
      eventOverlap={preventsOverlap ? allowsOverlapWith : true}
      selectOverlap={preventsOverlap ? allowsOverlapWith : true}
      // FullCalendarは実行時に文字列と比較関数が混在した配列を受け付けるが、型定義は
      // 「文字列のみ」か「関数のみ」の配列しか表現できないため、ここでのみ型を合わせる
      eventOrder={eventOrder as string[]}
      selectable
      selectMirror
      slotMinTime={getSlotTime(slotMinTime)}
      slotMaxTime={getSlotTime(slotMaxTime)}
      slotDuration={pluginCondition?.slotDuration || DEFAULT_SLOT_DURATION}
      scrollTime={scrollTime}
      themeSystem='normal'
      nowIndicator
      slotLabelContent={(props) => <span className='rad:text-foreground/50'>{props.text}</span>}
      allDayContent={(props) => <span className='rad:text-foreground/50'>{props.text}</span>}
      dayHeaderContent={DayHeader}
      // slotLaneContent={(props) => <pre>{JSON.stringify(props, null, 2)}</pre>}
      // weekNumberContent={(props) => <pre>{JSON.stringify(props, null, 2)}</pre>}
      // moreLinkContent={(props) => <pre>{JSON.stringify(props, null, 2)}</pre>}
      eventContent={CalendarEvent}
      eventDidMount={handleEventDidMount}
      select={onCalendarDateSelect}
      eventClick={onCalendarEventClick}
      eventChange={onCalendarEventChange}
      eventAdd={onCalendarEventAdd}
      eventRemove={onCalendarEventRemove}
      height='auto'
      handleWindowResize
    />
  );
}

export default function FullCalendarContainer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const fullcalendarApi = useAtomValue(fullcalendarApiAtom);
  const openContextMenu = useSetAtom(openEventContextMenuAtom);

  // サイドバーの開閉アニメーションなど、window自体はリサイズされないがコンテナ幅が
  // 変化するケースをFullCalendarの`handleWindowResize`は検知できないため、
  // コンテナのサイズ変化を直接監視して再計算させる
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !fullcalendarApi) {
      return;
    }

    const observer = new ResizeObserver(() => {
      fullcalendarApi.updateSize();
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, [fullcalendarApi]);

  return (
    <div ref={containerRef}>
      <CalendarLegend />
      <div
        className='rad:p-2 rad:md:p-4'
        onContextMenu={(event) => openContextMenu(event.nativeEvent)}
      >
        <FullCalendarRoot />
      </div>
    </div>
  );
}

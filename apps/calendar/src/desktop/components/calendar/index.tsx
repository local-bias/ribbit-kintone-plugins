import {
  buildViewButtons,
  isDayViewSelectable,
  getScrollTimeAroundNow,
  resolveFirstDay,
  resolveInitialView,
  resolveSlotRange,
} from '@/desktop/calendar-options';
import { useCalendar } from '@/desktop/hooks/use-calendar';
import { readStoredViewType, storeViewType } from '@/desktop/view-storage';
import { getSlotTime } from '@/lib/calendar';
import { t } from '@/lib/i18n-plugin';
import { DEFAULT_SLOT_DURATION } from '@/schema/calendar';
import { DatesSetArg } from '@fullcalendar/core';
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
import DayHeader from './day-header';
import CalendarEvent from './event';

/** 現在時刻付近へ自動スクロールしない場合の初期スクロール位置(FullCalendarの既定値) */
const DEFAULT_SCROLL_TIME = '06:00:00';

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
  const viewButtons = buildViewButtons(visibleViews);
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
      editable
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
    <div ref={containerRef} className='rad:p-2 rad:md:p-4'>
      <FullCalendarRoot />
    </div>
  );
}

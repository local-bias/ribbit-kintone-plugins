import { useCalendar } from '@/desktop/hooks/use-calendar';
import { getSlotTime } from '@/lib/calendar';
import { t } from '@/lib/i18n-plugin';
import allLocales from '@fullcalendar/core/locales-all';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import rrulePlugin from '@fullcalendar/rrule';
import timeGridPlugin from '@fullcalendar/timegrid';
import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useRef } from 'react';
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

function FullCalendarRoot() {
  const setFullcalendarRef = useSetAtom(fullcalendarRefAtom);
  const calendarEvents = useAtomValue(renderableCalendarEventsAtom);
  const pluginCondition = useAtomValue(pluginConditionAtom);
  const onCalendarDateSelect = useSetAtom(handleCalendarDateSelectAtom);
  const onCalendarEventAdd = useSetAtom(handleCalendarEventAddAtom);
  const { onCalendarEventClick, onCalendarEventChange, onCalendarEventRemove } = useCalendar();
  const loginUser = useAtomValue(loginUserAtom);

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
      initialView={pluginCondition?.initialView ?? 'timeGridWeek'}
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
      firstDay={pluginCondition?.firstDay}
      headerToolbar={{
        left: 'title',
        center: '',
        right:
          'dayGridMonth,timeGridWeek,timeGridFiveDay,timeGridThreeDay,timeGridDay today prev,next',
      }}
      events={calendarEvents}
      allDaySlot={pluginCondition?.enablesAllDay}
      editable
      selectable
      selectMirror
      slotMinTime={getSlotTime(pluginCondition?.slotMinTime || '0')}
      slotMaxTime={getSlotTime(pluginCondition?.slotMaxTime || '24')}
      themeSystem='normal'
      nowIndicator
      slotLabelContent={(props) => <span className='text-foreground/50'>{props.text}</span>}
      allDayContent={(props) => <span className='text-foreground/50'>{props.text}</span>}
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
    <div ref={containerRef} className='p-2 md:p-4'>
      <FullCalendarRoot />
    </div>
  );
}

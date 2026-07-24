import { calendarDateInputToDateTime, getLoginUserTimezone } from '@/desktop/date-conversion';
import { EventContentArg } from '@fullcalendar/core';

export default function CalendarEvent(props: EventContentArg) {
  const { allDay, backgroundColor, title } = props.event;
  // FullCalendar invokes eventContent renderers via its own internal (preact-based)
  // ContentInjector, not through @fullcalendar/react's hook-aware bridge — React hooks
  // (e.g. useAtomValue) throw "Invalid hook call" here, so read the timezone directly.
  const timezone = getLoginUserTimezone();
  // props.event.start/end are FullCalendar's UTC-coerced marker Dates (see date-conversion.ts).
  const start = props.event.start
    ? calendarDateInputToDateTime(props.event.start, timezone).setLocale('ja')
    : null;
  const end = props.event.end
    ? calendarDateInputToDateTime(props.event.end, timezone).setLocale('ja')
    : null;
  const isDayGridMonth = props.view.type === 'dayGridMonth';

  return (
    <div className='grid h-full px-1 py-0.5 overflow-hidden min-h-6'>
      {isDayGridMonth && allDay && <div>{title}</div>}
      {isDayGridMonth && !allDay && (
        <div
          className='flex items-center gap-1 border-l-4 text-foreground/70 pl-2'
          style={{ borderColor: backgroundColor }}
        >
          <div className='text-xs !text-[10px] opacity-70 inline-flex items-center'>
            <div>{start?.toFormat('H:mm')}</div>
            <div>-</div>
            <div>{end?.toFormat('H:mm')}</div>
          </div>
          <div>{title}</div>
        </div>
      )}
      {!isDayGridMonth && allDay && <div>{title}</div>}
      {!isDayGridMonth && !allDay && (
        <div>
          <div>{title}</div>
          <div className='text-xs opacity-70 flex items-center gap-1 ml-2'>
            <div>{start?.toFormat('H:mm')}</div>
            <div>-</div>
            <div>{end?.toFormat('H:mm')}</div>
          </div>
        </div>
      )}
    </div>
  );
}

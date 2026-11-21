import { calendarDateInputToDateTime, getLoginUserTimezone } from '@/desktop/date-conversion';
import { EventContentArg } from '@fullcalendar/core';

export default function CalendarEvent(props: EventContentArg) {
  const { allDay, backgroundColor, display, extendedProps } = props.event;
  // 表示用タイトルのフィールドが設定されている場合は、入力用のタイトルの代わりに表示する
  const title: string = extendedProps.displayTitle || props.event.title;
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

  if (display === 'background') {
    return (
      <div className='rad:px-1 rad:py-0.5 rad:text-[10px] rad:leading-tight rad:text-foreground/60 rad:truncate'>
        {title}
      </div>
    );
  }

  return (
    <div className='rad:grid rad:h-full rad:px-1 rad:py-0.5 rad:overflow-hidden rad:min-h-6'>
      {isDayGridMonth && allDay && <div>{title}</div>}
      {isDayGridMonth && !allDay && (
        <div
          className='rad:flex rad:items-center rad:gap-1 rad:border-l-4 rad:text-foreground/70 rad:pl-2'
          style={{ borderColor: backgroundColor }}
        >
          <div className='rad:text-xs rad:text-[10px]! rad:opacity-70 rad:inline-flex rad:items-center'>
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
          <div className='rad:text-xs rad:opacity-70 rad:flex rad:items-center rad:gap-1 rad:ml-2'>
            <div>{start?.toFormat('H:mm')}</div>
            <div>-</div>
            <div>{end?.toFormat('H:mm')}</div>
          </div>
        </div>
      )}
    </div>
  );
}

import { calendarDateInputToDateTime, getLoginUserTimezone } from '@/desktop/date-conversion';
import { DayHeaderContentArg } from '@fullcalendar/core';

export default function DayHeader(props: DayHeaderContentArg) {
  // FullCalendar invokes dayHeaderContent renderers via its own internal (preact-based)
  // ContentInjector, not through @fullcalendar/react's hook-aware bridge — React hooks
  // (e.g. useAtomValue) throw "Invalid hook call" here, so read the timezone directly.
  const timezone = getLoginUserTimezone();
  // props.date is FullCalendar's UTC-coerced marker Date (see date-conversion.ts) — it must be
  // decoded through the login user's zone, not the browser's local zone, or the weekday/date
  // shown here can roll back a day for any zone behind UTC (e.g. US timezones).
  const date = calendarDateInputToDateTime(props.date, timezone).setLocale('ja');
  const type = props.view.type;

  return (
    <>
      <span className='hidden md:block'>
        {type !== 'dayGridMonth' && date.toFormat('M/d')}
        <span className='text-xs text-foreground/50'>{date.toFormat('(EEE)')}</span>
      </span>
      <span className='block md:hidden text-xs'>
        {type !== 'dayGridMonth' && date.toFormat('d')}
        <span className='text-[10px] text-foreground/50'>{date.toFormat('(EEE)')}</span>
      </span>
    </>
  );
}

import { fullcalendarApiAtom } from '@/desktop/states/calendar';
import { calendarGridTypeAtom } from '@/desktop/states/plugin';
import { t } from '@/lib/i18n-plugin';
import { CALENDAR_VIEW_TYPES, CalendarViewType } from '@/schema/calendar';
import { Tab, Tabs } from '@mui/material';
import { atom, useAtomValue, useSetAtom } from 'jotai';

const VIEW_TYPE_LABEL: Record<CalendarViewType, string> = {
  dayGridMonth: t('desktop.calendar.viewType.month'),
  timeGridWeek: t('desktop.calendar.viewType.week'),
  timeGridFiveDay: t('desktop.calendar.viewType.fiveDay'),
  timeGridThreeDay: t('desktop.calendar.viewType.threeDay'),
  timeGridDay: t('desktop.calendar.viewType.day'),
};

const handleGridTypeChangeAtom = atom(null, (get, set, _: unknown, gridType: CalendarViewType) => {
  set(calendarGridTypeAtom, gridType);
  const api = get(fullcalendarApiAtom);
  if (api) {
    api.changeView(gridType);
  }
});

export default function HeaderGridTypeSelect() {
  const gridType = useAtomValue(calendarGridTypeAtom);
  const onChange = useSetAtom(handleGridTypeChangeAtom);

  return (
    <Tabs value={gridType} onChange={onChange}>
      {CALENDAR_VIEW_TYPES.map((type) => (
        <Tab key={type} value={type} label={VIEW_TYPE_LABEL[type]} />
      ))}
    </Tabs>
  );
}

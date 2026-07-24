import { fullcalendarApiAtom } from '@/desktop/states/calendar';
import DateCalendar from '@/lib/components/date-calendar';
import { PickerValue } from '@mui/x-date-pickers/internals';
import { useAtomValue } from 'jotai';
import { DateTime } from 'luxon';
import { useState } from 'react';

export default function SidebarDatePicker() {
  const [date, setDate] = useState<DateTime>(DateTime.now());
  const fullcalendarApi = useAtomValue(fullcalendarApiAtom);

  const onChange = (date: PickerValue) => {
    if (!(date instanceof DateTime)) {
      return;
    }
    setDate(date);
    if (fullcalendarApi) {
      fullcalendarApi.gotoDate(date.toJSDate());
    }
  };

  return (
    <div className='!-mb-20'>
      <DateCalendar className='!w-full aspect-square' value={date} onChange={onChange} />
    </div>
  );
}

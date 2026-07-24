import { calendarDateInputToDateTime, dateTimeToCalendarValue } from '@/desktop/date-conversion';
import { loginUserAtom } from '@/desktop/states/kintone';
import { isTimeSupportedAtom } from '@/desktop/states/plugin';
import { DatePicker } from '@/lib/components/date-picker';
import { DateTimePicker } from '@/lib/components/datetime-picker';
import { t } from '@/lib/i18n-plugin';
import { produce } from 'immer';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { DateTime } from 'luxon';
import { FC } from 'react';
import { dialogAllDayAtom, dialogPropsAtom } from '../../../states/dialog';
import { PickerValue } from '@mui/x-date-pickers/internals';

const handleStartChangeAtom = atom(null, (get, set, date: PickerValue) => {
  set(dialogPropsAtom, (current) =>
    produce(current, (draft) => {
      draft.event.start = date instanceof DateTime ? dateTimeToCalendarValue(date, !!draft.event.allDay) : undefined;
    })
  );
});

const handleEndChangeAtom = atom(null, (get, set, date: PickerValue) => {
  set(dialogPropsAtom, (current) =>
    produce(current, (draft) => {
      if (!(date instanceof DateTime)) {
        draft.event.end = undefined;
        return;
      }
      // The end-date picker shows the *inclusive* last day (kintone/human convention), while
      // `event.end` itself stays FullCalendar's exclusive end — so shift it back by a day here.
      const value = draft.event.allDay ? date.plus({ days: 1 }) : date;
      draft.event.end = dateTimeToCalendarValue(value, !!draft.event.allDay);
    })
  );
});

const DateEnd: FC = () => {
  const props = useAtomValue(dialogPropsAtom);
  const allDay = useAtomValue(dialogAllDayAtom);
  const isTimeSupported = useAtomValue(isTimeSupportedAtom);
  const onEndChange = useSetAtom(handleEndChangeAtom);
  const { timezone } = useAtomValue(loginUserAtom);

  const end = props.event.end ? calendarDateInputToDateTime(props.event.end, timezone) : undefined;

  if (!isTimeSupported || allDay) {
    return (
      <DatePicker
        label={t('desktop.dialog.endDate')}
        value={end ? end.minus({ days: 1 }) : DateTime.now().setZone(timezone)}
        onChange={onEndChange}
      />
    );
  }

  return (
    <DateTimePicker
      ampm={false}
      label={t('desktop.dialog.endDateTime')}
      value={end ?? DateTime.now().setZone(timezone)}
      onChange={onEndChange}
    />
  );
};

const DateStart: FC = () => {
  const { event } = useAtomValue(dialogPropsAtom);
  const allDay = useAtomValue(dialogAllDayAtom);
  const isTimeSupported = useAtomValue(isTimeSupportedAtom);
  const onStartChange = useSetAtom(handleStartChangeAtom);
  const { timezone } = useAtomValue(loginUserAtom);

  const start = event.start ? calendarDateInputToDateTime(event.start, timezone) : undefined;

  if (!isTimeSupported || allDay) {
    return (
      <DatePicker
        label={t('desktop.dialog.startDate')}
        value={start ?? DateTime.now().setZone(timezone)}
        onChange={onStartChange}
      />
    );
  }

  return (
    <DateTimePicker
      ampm={false}
      label={t('desktop.dialog.startDateTime')}
      value={start ?? DateTime.now().setZone(timezone)}
      onChange={onStartChange}
    />
  );
};

const Container: FC = () => {
  return (
    <div>
      <DateStart />
      <DateEnd />
    </div>
  );
};

export default Container;

import { slotMaxTimeState, slotMinTimeState } from '@/config/states/plugin';
import { t } from '@/lib/i18n-plugin';
import { MenuItem, TextField } from '@mui/material';
import { useAtom } from 'jotai';
import { FC } from 'react';

const HOURS_PER_DAY = 24;
/** 日をまたぐ時間帯(夜勤など)を表示できるよう、終了は翌日の24時まで選択できる */
const MAX_END_HOUR = HOURS_PER_DAY * 2;

const START_HOURS = Array.from({ length: HOURS_PER_DAY }, (_, i) => i);
const END_HOURS = Array.from({ length: MAX_END_HOUR }, (_, i) => i + 1);

const toHour = (time: string | undefined, fallback: number) => {
  const hour = Number((time || '').split(':')[0]);
  return Number.isFinite(hour) && time ? hour : fallback;
};

const formatHour = (hour: number) =>
  hour > HOURS_PER_DAY
    ? t('config.form.nextDayHour', String(hour - HOURS_PER_DAY))
    : `${hour}${t('config.form.hour')}`;

const Component: FC = () => {
  const [slotMinTime, setSlotMinTime] = useAtom(slotMinTimeState);
  const [slotMaxTime, setSlotMaxTime] = useAtom(slotMaxTimeState);
  const minHour = toHour(slotMinTime, 0);
  const maxHour = toHour(slotMaxTime, HOURS_PER_DAY);
  const isInvalid = maxHour <= minHour;

  return (
    <div className='flex gap-4'>
      <TextField
        label={t('config.form.slotStart')}
        select
        variant='outlined'
        color='primary'
        onChange={(event) => setSlotMinTime(event.target.value)}
        sx={{ width: '150px' }}
        value={String(minHour)}
      >
        {START_HOURS.map((hour) => (
          <MenuItem key={hour} value={String(hour)}>
            {formatHour(hour)}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        label={t('config.form.slotEnd')}
        select
        variant='outlined'
        color='primary'
        onChange={(event) => setSlotMaxTime(event.target.value)}
        sx={{ width: '150px' }}
        value={String(maxHour)}
        error={isInvalid}
        helperText={isInvalid ? t('config.form.slotRangeInvalid') : undefined}
      >
        {END_HOURS.map((hour) => (
          <MenuItem key={hour} value={String(hour)}>
            {formatHour(hour)}
          </MenuItem>
        ))}
      </TextField>
    </div>
  );
};

export default Component;

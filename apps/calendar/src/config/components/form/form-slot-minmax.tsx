import { slotMaxTimeState, slotMinTimeState } from '@/config/states/plugin';
import { t } from '@/lib/i18n-plugin';
import { MenuItem, TextField } from '@mui/material';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import React, { FC } from 'react';

const HOURS = Array.from({ length: 25 }, (_, i) => String(i));

const handleSlotMinTimeChangeAtom = atom(
  null,
  (_, set, event: React.ChangeEvent<HTMLInputElement>) => {
    set(slotMinTimeState, event.target.value);
  }
);
const handleSlotMaxTimeChangeAtom = atom(
  null,
  (_, set, event: React.ChangeEvent<HTMLInputElement>) => {
    set(slotMaxTimeState, event.target.value);
  }
);

const Component: FC = () => {
  const slotMinTime = useAtomValue(slotMinTimeState);
  const slotMaxTime = useAtomValue(slotMaxTimeState);
  const onSlotMinTimeChange = useSetAtom(handleSlotMinTimeChangeAtom);
  const onSlotMaxTimeChange = useSetAtom(handleSlotMaxTimeChangeAtom);

  return (
    <div>
      <TextField
        label={t('config.form.slotStart')}
        select
        variant='outlined'
        color='primary'
        onChange={onSlotMinTimeChange}
        sx={{ width: '150px', marginRight: '1rem' }}
        value={(slotMinTime || '0:').split(':')[0]}
      >
        {HOURS.map((hour) => (
          <MenuItem key={`slotMinTime-${hour}`} value={hour}>
            {hour}{t('config.form.hour')}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        label={t('config.form.slotEnd')}
        select
        variant='outlined'
        color='primary'
        onChange={onSlotMaxTimeChange}
        sx={{ width: '150px' }}
        value={(slotMaxTime || '24:').split(':')[0]}
      >
        {HOURS.map((hour, i) => (
          <MenuItem key={i} value={hour}>
            {hour}{t('config.form.hour')}
          </MenuItem>
        ))}
      </TextField>
    </div>
  );
};

export default Component;

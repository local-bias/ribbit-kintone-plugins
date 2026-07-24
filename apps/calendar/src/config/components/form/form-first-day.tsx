import { WEEK_DAYS } from '@/lib/calendar';
import { t } from '@/lib/i18n-plugin';
import { MenuItem, TextField } from '@mui/material';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import React, { FC } from 'react';
import { firstDayAtom } from '../../states/plugin';

const handleFirstDayChangeAtom = atom(
  null,
  (_, set, event: React.ChangeEvent<HTMLInputElement>) => {
    set(firstDayAtom, Number(event.target.value));
  }
);

const FirstDayForm: FC = () => {
  const firstDay = useAtomValue(firstDayAtom);
  const onFirstDayChange = useSetAtom(handleFirstDayChangeAtom);

  return (
    <TextField
      select
      label={t('config.form.firstDay')}
      value={firstDay}
      onChange={onFirstDayChange}
      sx={{ width: '200px' }}
    >
      {WEEK_DAYS.map(({ label, value }) => (
        <MenuItem key={value} value={value}>
          {label}
        </MenuItem>
      ))}
    </TextField>
  );
};

export default FirstDayForm;

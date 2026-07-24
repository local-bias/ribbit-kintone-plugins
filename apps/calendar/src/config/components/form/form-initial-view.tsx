import { t } from '@/lib/i18n-plugin';
import { PluginCondition } from '@/schema/plugin-config';
import { MenuItem, TextField } from '@mui/material';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import React, { FC } from 'react';
import { initialViewState } from '../../states/plugin';

const VIEW_LIST: { labelKey: Parameters<typeof t>[0]; viewType: PluginCondition['initialView']; }[] = [
  { labelKey: 'config.initialView.dayGridMonth', viewType: 'dayGridMonth' },
  { labelKey: 'config.initialView.timeGridWeek', viewType: 'timeGridWeek' },
  { labelKey: 'config.initialView.timeGridFiveDay', viewType: 'timeGridFiveDay' },
  { labelKey: 'config.initialView.timeGridThreeDay', viewType: 'timeGridThreeDay' },
  { labelKey: 'config.initialView.timeGridDay', viewType: 'timeGridDay' },
];

const handleViewChangeAtom = atom(null, (_, set, event: React.ChangeEvent<HTMLInputElement>) => {
  set(initialViewState, event.target.value as PluginCondition['initialView']);
});

const Container: FC = () => {
  const initialView = useAtomValue(initialViewState);
  const onChange = useSetAtom(handleViewChangeAtom);

  return (
    <TextField
      select
      label={t('config.form.calendarType')}
      value={initialView}
      onChange={onChange}
      sx={{ width: '400px' }}
    >
      {VIEW_LIST.map(({ labelKey, viewType }) => (
        <MenuItem key={viewType} value={viewType}>
          {t(labelKey)}
        </MenuItem>
      ))}
    </TextField>
  );
};

export default Container;

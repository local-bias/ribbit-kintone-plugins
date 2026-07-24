import { t } from '@/lib/i18n-plugin';
import { MenuItem, TextField } from '@mui/material';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import React, { FC } from 'react';
import { customViewsAtom } from '../../states/kintone';
import { viewIdState } from '../../states/plugin';

const handleViewIdChangeAtom = atom(null, (_, set, event: React.ChangeEvent<HTMLInputElement>) => {
  set(viewIdState, event.target.value);
});

const Container: FC = () => {
  const viewId = useAtomValue(viewIdState);
  const views = useAtomValue(customViewsAtom);
  const onViewIdChange = useSetAtom(handleViewIdChangeAtom);

  return (
    <TextField
      select
      label={t('config.form.viewName')}
      value={viewId}
      onChange={onViewIdChange}
      sx={{ width: '250px' }}
    >
      {Object.entries(views).map(([name, { id }]) => (
        <MenuItem key={id} value={id}>
          {name}
        </MenuItem>
      ))}
    </TextField>
  );
};

export default Container;

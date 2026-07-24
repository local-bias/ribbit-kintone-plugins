import { t } from '@/lib/i18n-plugin';
import { TextField } from '@mui/material';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import React, { FC } from 'react';
import { dialogEventTitleAtom } from '../../../states/dialog';

const handleTitleChangeAtom = atom(
  null,
  (_, set, event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    set(dialogEventTitleAtom, event.target.value);
  }
);

const DialogEventTitleInput: FC = () => {
  const title = useAtomValue(dialogEventTitleAtom);
  const onTitleChange = useSetAtom(handleTitleChangeAtom);

  return (
    <TextField
      variant='outlined'
      color='primary'
      label={t('desktop.dialog.eventTitle')}
      value={title || ''}
      onChange={onTitleChange}
    />
  );
};

export default DialogEventTitleInput;

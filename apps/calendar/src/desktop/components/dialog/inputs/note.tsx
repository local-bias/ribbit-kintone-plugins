import { t } from '@/lib/i18n-plugin';
import { TextField } from '@mui/material';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import React, { FC, memo } from 'react';
import { dialogEventNoteAtom } from '../../../states/dialog';
import { pluginConditionAtom } from '../../../states/kintone';

const enablesNoteAtom = atom((get) => {
  const condition = get(pluginConditionAtom);
  return condition?.enablesNote ?? false;
});

const handleNoteChangeAtom = atom(
  null,
  async (get, set, event: React.ChangeEvent<HTMLInputElement>) => {
    set(dialogEventNoteAtom, event.target.value);
  }
);

const Component: FC<{ value: string; }> = memo((props) => {
  const onNoteChange = useSetAtom(handleNoteChangeAtom);

  return (
    <div className='full'>
      <TextField label={t('desktop.dialog.description')} multiline rows={4} value={props.value} onChange={onNoteChange} />
    </div>
  );
});

const Container: FC = () => {
  const note = useAtomValue(dialogEventNoteAtom);
  const enablesNote = useAtomValue(enablesNoteAtom);

  if (!enablesNote) {
    return null;
  }
  return <Component value={note || ''} />;
};

export default Container;

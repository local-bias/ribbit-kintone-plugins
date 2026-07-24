import { t } from '@/lib/i18n-plugin';
import { EditMode } from '@/schema/plugin-config';
import { MenuItem, TextField } from '@mui/material';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import React, { FC } from 'react';
import { editModeState } from '../../states/plugin';

const EDIT_MODE_LIST: { labelKey: Parameters<typeof t>[0]; value: EditMode }[] = [
  { labelKey: 'config.form.editMode.simple', value: 'simple' },
  { labelKey: 'config.form.editMode.detailed', value: 'detailed' },
];

const handleEditModeChangeAtom = atom(
  null,
  (_, set, event: React.ChangeEvent<HTMLInputElement>) => {
    set(editModeState, event.target.value as EditMode);
  }
);

const FormEditMode: FC = () => {
  const editMode = useAtomValue(editModeState);
  const onChange = useSetAtom(handleEditModeChangeAtom);

  return (
    <TextField select label={t('config.form.editMode')} value={editMode} onChange={onChange} sx={{ width: '400px' }}>
      {EDIT_MODE_LIST.map(({ labelKey, value }) => (
        <MenuItem key={value} value={value}>
          {t(labelKey)}
        </MenuItem>
      ))}
    </TextField>
  );
};

export default FormEditMode;

import { conditionTypeAtom } from '@/config/states/plugin';
import { ConditionType } from '@/schema/plugin-config';
import { MenuItem, TextField } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import { FC, useCallback } from 'react';

const Component: FC = () => {
  const type = useAtomValue(conditionTypeAtom);

  const onChange = useAtomCallback(
    useCallback((_, set, value: string) => {
      set(conditionTypeAtom, value as ConditionType);
    }, [])
  );

  return (
    <div>
      <TextField
        variant='outlined'
        color='primary'
        select
        label='表示タイプ'
        value={type}
        onChange={(e) => onChange(e.target.value)}
      >
        <MenuItem value='icon'>アイコン</MenuItem>
        <MenuItem value='emoji'>絵文字</MenuItem>
      </TextField>
    </div>
  );
};

export default Component;

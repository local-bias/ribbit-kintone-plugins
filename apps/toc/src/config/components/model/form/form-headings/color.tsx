import { getConditionColorAtom } from '@/config/states/plugin';
import { DEFAULT_COLOR } from '@/lib/static';
import { TextField } from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import { FC, useMemo } from 'react';

type Props = { index: number };

const Component: FC<Props> = ({ index }) => {
  const colorAtom = useMemo(() => getConditionColorAtom(index), [index]);
  const color = useAtomValue(colorAtom);
  const setColor = useSetAtom(colorAtom);

  const onChange = (value: string) => {
    setColor(value);
  };

  return (
    <TextField
      type='color'
      sx={{ width: '120px' }}
      label='ヘッダーの色'
      variant='outlined'
      color='primary'
      value={color || DEFAULT_COLOR}
      onChange={(e) => onChange(e.target.value)}
    />
  );
};

export default Component;

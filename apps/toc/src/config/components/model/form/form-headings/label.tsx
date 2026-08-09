import { getConditionLabelAtom } from '@/config/states/plugin';
import { TextField } from '@mui/material';
import { useAtom } from 'jotai';
import { FC, useMemo } from 'react';

type Props = { index: number };

const Component: FC<Props> = ({ index }) => {
  const labelAtom = useMemo(() => getConditionLabelAtom(index), [index]);
  const [label, setLabel] = useAtom(labelAtom);

  const onChange = (value: string) => {
    setLabel(value);
  };

  return (
    <TextField
      sx={{ width: '350px' }}
      label='ラベル'
      variant='outlined'
      color='primary'
      value={label}
      onChange={(e) => onChange(e.target.value)}
    />
  );
};

export default Component;

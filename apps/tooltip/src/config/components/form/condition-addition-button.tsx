import { getNewCondition } from '@/lib/plugin';
import AddIcon from '@mui/icons-material/Add';
import { Button } from '@mui/material';
import { produce } from 'immer';
import { useAtomCallback } from 'jotai/utils';
import { FC, useCallback } from 'react';
import { pluginConfigAtom } from '../../states/plugin';

type Props = Readonly<{ addCondition: () => void }>;

const Component: FC<Props> = ({ addCondition }) => (
  <Button
    variant='outlined'
    color='primary'
    size='small'
    startIcon={<AddIcon />}
    onClick={addCondition}
    style={{ marginTop: '16px' }}
  >
    新しい設定
  </Button>
);

const Container: FC = () => {
  const addCondition = useAtomCallback(
    useCallback((_, set) => {
      set(pluginConfigAtom, (_, _storage = _!) =>
        produce(_storage, (draft) => {
          draft.conditions.push(getNewCondition());
        })
      );
    }, [])
  );

  return <Component {...{ addCondition }} />;
};

export default Container;

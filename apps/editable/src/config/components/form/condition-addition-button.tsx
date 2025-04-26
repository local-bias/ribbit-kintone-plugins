import AddIcon from '@mui/icons-material/Add';
import { Button } from '@mui/material';
import { produce } from 'immer';
import { FC } from 'react';

import { getNewCondition } from '@/common/plugin';

import { useSetAtom } from 'jotai';
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
  const setStorage = useSetAtom(pluginConfigAtom);

  const addCondition = () => {
    setStorage((_, _storage = _!) =>
      produce(_storage, (draft) => {
        draft.conditions.push(getNewCondition());
      })
    );
  };

  return <Component {...{ addCondition }} />;
};

export default Container;

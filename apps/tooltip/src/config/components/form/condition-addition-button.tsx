import { getNewCondition } from '@/lib/plugin';
import AddIcon from '@mui/icons-material/Add';
import { Button } from '@mui/material';
import { produce } from 'immer';
import { useAtomCallback } from 'jotai/utils';
import { useCallback } from 'react';
import { pluginConfigAtom } from '../../states/plugin';

type Props = Readonly<{ addCondition: () => void }>;

function AdditionButton({ addCondition }: Props) {
  return (
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
}

export default function ConditionAdditionButton() {
  const addCondition = useAtomCallback(
    useCallback((_, set) => {
      set(pluginConfigAtom, (_, _storage = _!) =>
        produce(_storage, (draft) => {
          draft.conditions.push(getNewCondition());
        })
      );
    }, [])
  );

  return <AdditionButton {...{ addCondition }} />;
}

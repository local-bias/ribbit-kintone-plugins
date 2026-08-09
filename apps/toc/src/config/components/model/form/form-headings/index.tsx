import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { IconButton, Tooltip } from '@mui/material';
import { useAtom, useAtomValue } from 'jotai';
import { FC, memo } from 'react';
import ColorForm from './color';
import LabelForm from './label';
import SpaceSelect from './space-select';

import { DEFAULT_COLOR } from '@/lib/static';
import { conditionsAtom, conditionsLengthAtom } from '../../../../states/plugin';

const Component: FC = () => {
  const length = useAtomValue(conditionsLengthAtom);
  const [conditions, setConditions] = useAtom(conditionsAtom);
  const isMultiple = length > 1;

  const addField = (rowIndex: number) => {
    const updated = [...conditions];
    updated.splice(rowIndex + 1, 0, {
      spaceId: '',
      label: '見出し',
      color: DEFAULT_COLOR,
    });
    setConditions(updated);
  };

  const removeField = (rowIndex: number) => {
    const updated = [...conditions];
    updated.splice(rowIndex, 1);
    setConditions(updated);
  };

  return (
    <div className='flex flex-col gap-4'>
      {new Array(length).fill('').map((_, i) => (
        <div key={i} className='flex items-center gap-2'>
          <SpaceSelect index={i} />
          <LabelForm index={i} />
          <ColorForm index={i} />
          <Tooltip title='フィールドを追加する'>
            <IconButton size='small' onClick={() => addField(i)}>
              <AddIcon fontSize='small' />
            </IconButton>
          </Tooltip>
          {isMultiple && (
            <Tooltip title='このフィールドを削除する'>
              <IconButton size='small' onClick={() => removeField(i)}>
                <DeleteIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          )}
        </div>
      ))}
    </div>
  );
};

export default memo(Component);

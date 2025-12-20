import { Chip } from '@mui/material';
import { produce } from 'immer';
import { FC } from 'react';
import { useAtom } from 'jotai';
import { tagDataAtom } from '../states/plugin';

const Component: FC = () => {
  const [tagData, setTagData] = useAtom(tagDataAtom);

  const onDeleteTag = (index: number) => {
    setTagData((current) =>
      produce(current, (draft) => {
        draft.tags.splice(index, 1);
      })
    );
  };

  return (
    <div className='🐸'>
      <div className='flex mt-2 flex-wrap gap-2'>
        {tagData.tags.map((tag, i) => (
          <Chip
            key={`${i}_${tag.value}`}
            color='primary'
            variant='outlined'
            label={tag.value}
            onDelete={() => onDeleteTag(i)}
          />
        ))}
      </div>
    </div>
  );
};

export default Component;

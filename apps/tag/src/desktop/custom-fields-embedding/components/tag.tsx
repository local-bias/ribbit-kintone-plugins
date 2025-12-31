import { Chip } from '@mui/material';
import { produce } from 'immer';
import { FC } from 'react';
import { useAtom } from 'jotai';
import { tagDataAtom } from '../states/plugin';
import styled from '@emotion/styled';

const TagContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;

  & > a > div {
    cursor: pointer;
  }
`;

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
    <TagContainer>
      {tagData.tags.map((tag, i) => (
        <Chip
          key={`${i}_${tag.value}`}
          color='primary'
          variant='outlined'
          label={tag.value}
          onDelete={() => onDeleteTag(i)}
        />
      ))}
    </TagContainer>
  );
};

export default Component;

import styled from '@emotion/styled';
import { Chip } from '@mui/material';

type Props = {
  fieldId: string | null;
  viewId: string;
  initialValue: Plugin.TagData;
};

const TagContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;

  & > a > div {
    cursor: pointer;
  }
`;

export default function Tags({ fieldId, initialValue, viewId }: Props) {
  return (
    <TagContainer>
      {initialValue.tags.map((tag, i) => {
        const key = `${i}_${tag.value}`;
        const path = location.pathname.replace('show', '');
        const href = `${path}${viewId ? `?view=${viewId}&` : '?'}q=f${fieldId} like "${tag.value}"`;

        return (
          <a key={key} href={href}>
            <Chip color='primary' variant='outlined' label={tag.value} />
          </a>
        );
      })}
    </TagContainer>
  );
}

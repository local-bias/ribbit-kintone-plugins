import styled from '@emotion/styled';
import { useAtomValue } from 'jotai';
import { displayingTableRowsAtom } from '../../../states/records';
import ViewCard from './card';

export default function ViewCardList({ className }: { className?: string; }) {
  const records = useAtomValue(displayingTableRowsAtom);

  return (
    <Container className={className}>
      {records.map((record, i) => {
        return (
          <div key={i}>
            <ViewCard record={record} />
          </div>
        );
      })}
    </Container>
  );
}

const Container = styled.div`
  padding: 16px 8px;
  display: grid;
  gap: 24px;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  @media (min-width: 1200px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (min-width: 1624px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  @media (min-width: 2048px) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  @media (min-width: 2472px) {
    grid-template-columns: repeat(5, minmax(0, 400px));
  }
  place-content: center;
`;

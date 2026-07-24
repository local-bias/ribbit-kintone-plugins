import styled from '@emotion/styled';
import { Skeleton } from '@mui/material';
import { FCX, Suspense } from 'react';
import Category from './category';
import Note from './note';
import Recurrence from './recurrence';
import StartEnd from './start-end';
import Title from './title';
import DialogAllDayForm from './allday';

const Component: FCX = ({ className }) => (
  <div className={className}>
    <div>
      <Title />
    </div>
    <StartEnd />
    <DialogAllDayForm />
    <Recurrence />
    <Note />
    <Suspense fallback={<Skeleton variant='text' />}>
      <Category />
    </Suspense>
  </div>
);

const StyledComponent = styled(Component)`
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  > div {
    display: flex;
    gap: 1rem;

    &.full {
      align-items: stretch;
      flex-direction: column;
    }
  }
`;

export default StyledComponent;

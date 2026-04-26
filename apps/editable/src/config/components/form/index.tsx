import styled from '@emotion/styled';
import type { FCX } from 'react';
import Condition from './condition';

const Component: FCX = ({ className }) => {
  return (
    <div {...{ className }}>
      <Condition />
    </div>
  );
};

const StyledComponent = styled(Component)`
  width: 100%;

  & > div {
    padding: 1em;
  }
`;

export default StyledComponent;

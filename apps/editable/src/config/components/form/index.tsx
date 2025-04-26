import styled from '@emotion/styled';
import { useAtomValue } from 'jotai';
import { FC, FCX } from 'react';
import { pluginConfigAtom } from '../../states/plugin';
import Condition from './condition';
import ConditionAdditionButton from './condition-addition-button';

const Component: FCX = ({ className }) => {
  const storage = useAtomValue(pluginConfigAtom);
  return (
    <div {...{ className }}>
      {storage.conditions.map((condition, index) => (
        <Condition key={index} {...{ condition, index }} />
      ))}
      <ConditionAdditionButton />
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

import styled from '@emotion/styled';
import { FC, FCX } from 'react';
import { DeepReadonly } from 'utility-types';

type ContainerProps = DeepReadonly<{}>;
type Props = ContainerProps & DeepReadonly<{}>;

const Component: FCX<Props> = ({ className }) => (
  <div {...{ className }}>
    <div></div>
  </div>
);

const StyledComponent = styled(Component)``;

const Container: FC<ContainerProps> = () => {
  return <StyledComponent />;
};

export default Container;

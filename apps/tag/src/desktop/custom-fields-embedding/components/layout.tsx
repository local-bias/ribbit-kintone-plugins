import styled from '@emotion/styled';
import type { FC, PropsWithChildren } from 'react';

type Props = { className?: string };

const Component: FC<PropsWithChildren<Props>> = ({ children, className }) => (
  <div className={className}>{children}</div>
);

const StyledComponent = styled(Component)``;

export default StyledComponent;

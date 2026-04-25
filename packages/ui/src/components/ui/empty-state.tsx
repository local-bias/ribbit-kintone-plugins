import styled from '@emotion/styled';
import { PackageOpen } from 'lucide-react';
import { FC, ReactNode } from 'react';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 0;
  color: #999;
  gap: 12px;
`;

const DefaultIcon = styled(PackageOpen)`
  width: 56px;
  height: 56px;
  opacity: 0.4;
`;

const Text = styled.div`
  font-size: 14px;
`;

interface EmptyStateProps {
  /** 表示するメッセージ */
  message: string;
  /** カスタムアイコン。省略時は PackageOpen アイコンを表示 */
  icon?: ReactNode;
}

export const EmptyState: FC<EmptyStateProps> = ({ message, icon }) => {
  return (
    <Container>
      {icon ?? <DefaultIcon />}
      <Text>{message}</Text>
    </Container>
  );
};

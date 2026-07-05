import styled from '@emotion/styled';
import { useSetAtom } from '@repo/jotai';
import { useEffect, useRef, useState } from 'react';
import { startOAuthFlow } from '@/lib/oauth';
import { driveTokenAtom } from '../states/drive';
import { ErrorText, PrimaryButton } from './styles';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 0;
`;

interface Props {
  oauthClientId: string;
  oauthClientSecret: string;
}

function ConnectButton({ oauthClientId, oauthClientSecret }: Props) {
  const setToken = useSetAtom(driveTokenAtom);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const onClick = async () => {
    setConnecting(true);
    setError(null);
    try {
      const token = await startOAuthFlow({
        clientId: oauthClientId,
        clientSecret: oauthClientSecret,
      });
      // driveTokenAtomはグローバル状態のため、ボタンがアンマウントされていても常に反映する
      setToken(token);
    } catch (cause) {
      if (mountedRef.current) {
        setError(cause instanceof Error ? cause.message : 'Google連携に失敗しました。');
      }
    } finally {
      if (mountedRef.current) {
        setConnecting(false);
      }
    }
  };

  return (
    <Wrapper>
      <PrimaryButton type='button' onClick={onClick} disabled={connecting}>
        {connecting ? '連携中...' : 'Google Driveに接続'}
      </PrimaryButton>
      {error && <ErrorText>{error}</ErrorText>}
    </Wrapper>
  );
}

export default ConnectButton;

import { ChatMessageRole } from '@/lib/static';
import PersonIcon from '@mui/icons-material/Person';
import { PropsWithChildren } from 'react';
import AiIcon from './ai-icon';
import styled from '@emotion/styled';
import FactCheckIndicator from '../../fact-check-indicator';

type Props = { role: ChatMessageRole; messageId?: string };

const MessageWrapper = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: 24px 16px;
  display: grid;
  grid-template-columns: 30px 1fr;
  gap: 24px;
  position: relative;
`;

const FactCheckIndicatorContainer = styled.div`
  position: absolute;
  left: 50%;
  top: 34px;
  translate: -50% 0;
`;

export default function MessageContainer({ children, role, messageId }: PropsWithChildren<Props>) {
  return (
    <MessageWrapper>
      <div className='rad:relative'>
        {/* Sticky container for icon and fact-check indicator */}
        <div className='rad:sticky rad:top-16'>
          <div
            data-role={role}
            className="rad:overflow-hidden rad:h-[30px] rad:grid rad:place-items-center rad:rounded rad:text-white rad:data-[role='user']:bg-blue-600 rad:[&_img]:w-full rad:[&_img]:h-full rad:[&_img]:object-cover"
          >
            {role === 'assistant' && <AiIcon />}
            {role === 'user' && <PersonIcon />}
          </div>
          {role === 'assistant' && messageId && (
            <FactCheckIndicatorContainer>
              <FactCheckIndicator messageId={messageId} />
            </FactCheckIndicatorContainer>
          )}
        </div>
      </div>
      <div className='rad:overflow-x-auto'>{children}</div>
    </MessageWrapper>
  );
}

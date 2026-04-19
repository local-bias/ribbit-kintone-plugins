import styled from '@emotion/styled';
import { isMobile } from '@konomi-app/kintone-utilities';
import NewChatButton from '../new-chat';
import AIModeSelector from './ai-mode-selector';
import DropZone from './drop-zone';
import Examples from './examples';
import FileInput from './file-input';
import Files from './files';
import Input from './input';
import SendButton from './send-button';
import SendingOption from './sending-option';

const UserInputContainer = styled.div<{ isMobile: boolean }>`
  z-index: 10;
  position: sticky;
  bottom: 0;
  left: 0;
  width: 100%;
  background-color: var(--🐸background);

  ${({ isMobile }) =>
    isMobile &&
    `
    position: fixed;
    left: 50%;
    width: 100dvw;
    translate: -50%;
  `}
`;

const InputGroup = styled.div`
  position: relative;
  padding: calc(var(--🐸spacing) * 3);
  overflow: auto;
  border: 1px solid var(--🐸input);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-radius: var(--🐸radius);
`;

export default function UserInput() {
  return (
    <UserInputContainer isMobile={isMobile()}>
      <div className='rad:flex rad:flex-col rad:py-2! rad:px-4! rad:gap-3 rad:max-w-[900px] rad:mx-auto!'>
        <Examples />
        <div className='rad:flex rad:justify-between rad:items-end rad:gap-8'>
          <div>
            <AIModeSelector />
          </div>
          <div className='rad:flex rad:items-end rad:gap-8'>
            <div className='rad:hidden rad:md:block rad:text-xs rad:text-gray-500'>
              <SendingOption />
            </div>
            <div>
              <NewChatButton />
            </div>
            <div>
              <SendButton />
            </div>
          </div>
        </div>
        <DropZone>
          <InputGroup>
            <div className='rad:flex'>
              <Input />
              <FileInput />
            </div>
            <Files />
          </InputGroup>
        </DropZone>
      </div>
      <div className='rad:text-center rad:text-[10px] rad:md:text-xs rad:text-gray-500 rad:mb-1'>
        アシスタントは不正確な情報を表示することがあるため、生成された回答を再確認するようにしてください。
      </div>
    </UserInputContainer>
  );
}

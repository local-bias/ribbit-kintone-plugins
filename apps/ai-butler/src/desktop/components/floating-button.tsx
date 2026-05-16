import styled from '@emotion/styled';
import ChatIcon from '@mui/icons-material/Chat';
import { Tooltip } from '@mui/material';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useEffect } from 'react';
import { attachedFilesAtom, chatOpenAtom, fileAttachOpenAtom } from '@/desktop/states/chat';

const Fab = styled.button<{ hidden: boolean }>`
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #3498db, #2c3e50);
  color: #fff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  cursor: pointer;
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    transform 160ms ease,
    opacity 160ms ease,
    box-shadow 160ms ease;
  opacity: ${(p) => (p.hidden ? 0 : 1)};
  transform: ${(p) => (p.hidden ? 'scale(0.6)' : 'scale(1)')};
  pointer-events: ${(p) => (p.hidden ? 'none' : 'auto')};
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
  }
  &:active {
    transform: translateY(0);
  }
`;

const Badge = styled.span`
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ff5252;
  color: #fff;
  font-size: 11px;
  font-weight: bold;
  border-radius: 999px;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

function FloatingButton() {
  const [open, setOpen] = useAtom(chatOpenAtom);
  const fileAttachOpen = useAtomValue(fileAttachOpenAtom);
  const files = useAtomValue(attachedFilesAtom);
  const setFiles = useSetAtom(attachedFilesAtom);
  const setFileAttachOpen = useSetAtom(fileAttachOpenAtom);

  // ESC で閉じる
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setFileAttachOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setOpen, setFileAttachOpen]);

  const handleClick = () => {
    setOpen((prev) => !prev);
  };

  const handleFileSelect: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const list = event.target.files;
    if (!list) return;
    const next = Array.from(list);
    setFiles((prev) => [...prev, ...next]);
    setOpen(true);
    event.target.value = '';
  };

  return (
    <>
      <Tooltip title={open ? 'AI バトラーを閉じる' : 'AI バトラーを開く'} placement='left'>
        <Fab onClick={handleClick} aria-label='AIバトラー' hidden={fileAttachOpen}>
          <ChatIcon fontSize='medium' />
          {files.length > 0 && <Badge>{files.length}</Badge>}
        </Fab>
      </Tooltip>
      <input
        id='ai-butler-file-input'
        type='file'
        multiple
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
    </>
  );
}

export default FloatingButton;

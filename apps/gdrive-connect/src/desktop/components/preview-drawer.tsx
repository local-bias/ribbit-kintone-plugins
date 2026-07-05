import styled from '@emotion/styled';
import { ExternalLink, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { DriveFile } from '@/lib/drive';
import { buildPreviewUrl } from '@/lib/drive';

// kintone自体の固定ヘッダー等より確実に前面へ出すため、可能な限り大きなz-indexを指定する
const DRAWER_Z_INDEX = 2147483000;

const Backdrop = styled.div<{ open: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: ${DRAWER_Z_INDEX};
  opacity: ${(p) => (p.open ? 1 : 0)};
  pointer-events: ${(p) => (p.open ? 'auto' : 'none')};
  transition: opacity 0.2s ease;
`;

const Drawer = styled.div<{ open: boolean }>`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(90vw, 900px);
  background: var(--gdc-bg, #ffffff);
  z-index: ${DRAWER_Z_INDEX + 1};
  display: grid;
  grid-template-rows: auto 1fr;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.18);
  transform: translateX(${(p) => (p.open ? '0' : '100%')});
  transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: ${(p) => (p.open ? 'auto' : 'none')};
`;

const DrawerHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--gdc-border, #e4e4e7);
`;

const FileName = styled.div`
  flex: 1;
  min-width: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--gdc-fg, #18181b);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const IconLinkButton = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--gdc-radius, 3px);
  color: var(--gdc-muted-fg, #71717a);

  &:hover {
    background: var(--gdc-muted-2, #f1f1f3);
  }
`;

const IconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--gdc-radius, 3px);
  border: none;
  background: transparent;
  color: var(--gdc-muted-fg, #71717a);
  cursor: pointer;

  &:hover {
    background: var(--gdc-muted-2, #f1f1f3);
  }
`;

const Body = styled.div`
  position: relative;
  background: var(--gdc-muted, #f7f7f8);
`;

const PreviewFrame = styled.iframe`
  width: 100%;
  height: 100%;
  border: 0;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--gdc-muted-fg, #71717a);
  font-size: 12px;
`;

interface Props {
  file: DriveFile | null;
  onClose: () => void;
}

function PreviewDrawer({ file, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const open = !!file;

  // 表示するファイルが切り替わるたびに、読み込み中表示をリセットする(ドロワーを開いたままの
  // ファイル切り替えでも、iframeの再読み込みに応じてローディング表示が再び出るようにするため)
  // biome-ignore lint/correctness/useExhaustiveDependencies: file.idが変化した時のみリセットする(fileオブジェクト自体の同一性は問わない)
  useEffect(() => {
    if (file) {
      setLoading(true);
    }
  }, [file?.id]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  return (
    <>
      <Backdrop open={open} onClick={onClose} />
      <Drawer open={open}>
        {file && (
          <>
            <DrawerHeader>
              <FileName>{file.name}</FileName>
              {file.webViewLink && (
                <IconLinkButton
                  href={file.webViewLink}
                  target='_blank'
                  rel='noopener noreferrer'
                  title='Googleドライブで開く'
                >
                  <ExternalLink size={16} strokeWidth={1.75} />
                </IconLinkButton>
              )}
              <IconButton type='button' onClick={onClose} title='閉じる'>
                <X size={18} strokeWidth={1.75} />
              </IconButton>
            </DrawerHeader>
            <Body>
              {loading && <LoadingOverlay>読み込んでいます...</LoadingOverlay>}
              <PreviewFrame
                key={file.id}
                src={buildPreviewUrl(file)}
                title={file.name}
                onLoad={() => setLoading(false)}
                sandbox='allow-scripts allow-same-origin allow-popups allow-forms'
                referrerPolicy='no-referrer'
              />
            </Body>
          </>
        )}
      </Drawer>
    </>
  );
}

export default PreviewDrawer;

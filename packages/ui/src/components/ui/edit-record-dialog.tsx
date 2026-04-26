import styled from '@emotion/styled';
import { Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import { X } from 'lucide-react';
import { type FC, type ReactNode, useCallback, useEffect, useState } from 'react';

const StyledDialogTitle = styled(DialogTitle)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  font-size: 15px;
  font-weight: 600;
`;

const StyledDialogContent = styled(DialogContent)`
  padding: 0 !important;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const IframeWrapper = styled.div`
  position: relative;
  flex: 1;
  min-height: 0;
`;

const StyledIframe = styled.iframe`
  width: 100%;
  height: 100%;
  border: none;
  display: block;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  color: #666;
`;

interface EditRecordDialogProps {
  /** ダイアログの開閉状態 */
  open: boolean;
  /** タスクのタイトル（ダイアログヘッダーに表示） */
  title: ReactNode;
  /** 読み込み中のテキスト */
  loadingText: string;
  /** iframe の URL */
  editUrl: string;
  /** postMessage で閉じるイベントタイプの配列 */
  closeMessageTypes: string[];
  /** 閉じたときのコールバック */
  onClose: () => void;
}

export const EditRecordDialog: FC<EditRecordDialogProps> = ({
  open,
  title,
  loadingText,
  editUrl,
  closeMessageTypes,
  onClose,
}) => {
  const [iframeLoading, setIframeLoading] = useState(true);

  const handleClose = useCallback(() => {
    setIframeLoading(true);
    onClose();
  }, [onClose]);

  // iframe 内から postMessage を受信して保存完了を検知する
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== location.origin) {
        return;
      }
      if (closeMessageTypes.includes(event.data?.type)) {
        handleClose();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [open, handleClose, closeMessageTypes]);

  // ダイアログが開かれるたびに iframe loading をリセット
  useEffect(() => {
    if (open) {
      setIframeLoading(true);
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: '90vw',
          height: '85vh',
          maxWidth: '1200px',
          maxHeight: '900px',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <StyledDialogTitle>
        <span>{title}</span>
        <IconButton onClick={handleClose} size='small'>
          <X size={18} />
        </IconButton>
      </StyledDialogTitle>
      <StyledDialogContent>
        <IframeWrapper>
          {open && editUrl && <StyledIframe src={editUrl} onLoad={() => setIframeLoading(false)} />}
          {iframeLoading && <LoadingOverlay>{loadingText}</LoadingOverlay>}
        </IframeWrapper>
      </StyledDialogContent>
    </Dialog>
  );
};

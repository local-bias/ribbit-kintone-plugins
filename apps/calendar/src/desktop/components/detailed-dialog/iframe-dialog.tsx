import styled from '@emotion/styled';
import { Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import { X } from 'lucide-react';
import { type FC, type ReactNode, useCallback, useEffect, useRef, useState } from 'react';

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

export interface InlineDialogMessage {
  type?: string;
  recordId?: string;
}

interface IframeDialogProps {
  /** ダイアログの開閉状態 */
  open: boolean;
  /** タイトル(ダイアログヘッダーに表示) */
  title: ReactNode;
  /** 読み込み中のテキスト */
  loadingText: string;
  /** iframeのURL */
  editUrl: string;
  /** iframe内からのpostMessageのうち、ダイアログを閉じるべきものと判定するtype一覧 */
  closeMessageTypes: string[];
  /** ダイアログが閉じられたときのコールバック。postMessage受信時はそのpayloadを渡す */
  onClose: (message?: InlineDialogMessage) => void;
}

/**
 * kintone標準のレコード追加・編集画面をダイアログ内にiframeで埋め込む共通コンポーネント。
 *
 * iframe内(record-page.ts)がkintoneの保存/キャンセルイベントを検知して`window.parent`へ
 * postMessageすることで、このコンポーネントが自動的にダイアログを閉じる。
 */
export const IframeDialog: FC<IframeDialogProps> = ({
  open,
  title,
  loadingText,
  editUrl,
  closeMessageTypes,
  onClose,
}) => {
  const [iframeLoading, setIframeLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleClose = useCallback(
    (message?: InlineDialogMessage) => {
      setIframeLoading(true);
      onClose(message);
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== location.origin) {
        return;
      }
      // 同一originの他フレーム/スクリプトからの偽装メッセージを排除するため、送信元が
      // このダイアログ自身のiframeであることも確認する
      if (event.source !== iframeRef.current?.contentWindow) {
        return;
      }
      if (closeMessageTypes.includes(event.data?.type)) {
        handleClose(event.data as InlineDialogMessage);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [open, handleClose, closeMessageTypes]);

  useEffect(() => {
    if (open) {
      setIframeLoading(true);
    }
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={() => handleClose()}
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
        <IconButton onClick={() => handleClose()} size='small'>
          <X size={18} />
        </IconButton>
      </StyledDialogTitle>
      <StyledDialogContent>
        <IframeWrapper>
          {open && editUrl && (
            <StyledIframe ref={iframeRef} src={editUrl} onLoad={() => setIframeLoading(false)} />
          )}
          {iframeLoading && <LoadingOverlay>{loadingText}</LoadingOverlay>}
        </IframeWrapper>
      </StyledDialogContent>
    </Dialog>
  );
};

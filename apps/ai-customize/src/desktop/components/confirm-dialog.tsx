import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { type ReactNode, useCallback, useId, useRef, useState } from 'react';
import { t } from '@/lib/i18n';
import { isTrustedEvent } from './use-edit-action';

export type ConfirmRequest = {
  title: string;
  body: ReactNode;
  confirmLabel: string;
  /** 取り消せない・広く影響する操作。確定ボタンを警告色にする */
  danger?: boolean;
};

/**
 * 確認ダイアログを開き、確定したかを`Promise`で返すフック
 *
 * 権限の付与・公開・削除のように、取り消しにくい操作の前に使う。
 * `Escape`はダイアログが先に受け取るため、パネルまで閉じない
 */
export const useConfirm = (): [(request: ConfirmRequest) => Promise<boolean>, ReactNode] => {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const resolveRef = useRef<((confirmed: boolean) => void) | null>(null);
  const titleId = useId();

  const confirm = useCallback(
    (next: ConfirmRequest) =>
      new Promise<boolean>((resolve) => {
        resolveRef.current?.(false);
        resolveRef.current = resolve;
        setRequest(next);
      }),
    []
  );

  const close = (confirmed: boolean) => {
    resolveRef.current?.(confirmed);
    resolveRef.current = null;
    setRequest(null);
  };

  const dialog = (
    <Dialog open={request !== null} onClose={() => close(false)} aria-labelledby={titleId}>
      <DialogTitle id={titleId} sx={{ fontSize: 15 }}>
        {request?.title}
      </DialogTitle>
      <DialogContent sx={{ display: 'grid', gap: 1, fontSize: 13 }}>{request?.body}</DialogContent>
      <DialogActions>
        <Button onClick={() => close(false)}>{t('desktop.common.cancel')}</Button>
        <Button
          variant='contained'
          color={request?.danger ? 'warning' : 'primary'}
          onClick={(event) => {
            // アセットのコードが`.click()`で自分の権限付与を承認できないようにする
            if (isTrustedEvent(event)) close(true);
          }}
        >
          {request?.confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
  return [confirm, dialog];
};

import { useIsMobile } from '@/desktop/hooks/use-mobile';
import { INLINE_FRAME_NAME, INLINE_MESSAGE } from '@/desktop/inline-record';
import { detailedDialogAtom, handleDetailedDialogClosedAtom } from '@/desktop/states/detailed-dialog';
import { t } from '@/lib/i18n-plugin';
import { useAtomValue, useSetAtom } from 'jotai';
import type { FC } from 'react';
import { IframeDialog, type InlineDialogMessage } from './iframe-dialog';

const CLOSE_MESSAGE_TYPES = Object.values(INLINE_MESSAGE);

const DetailedDialog: FC = () => {
  const state = useAtomValue(detailedDialogAtom);
  const onClose = useSetAtom(handleDetailedDialogClosedAtom);
  // 全画面表示はkintoneのモバイル版に加えて、幅の狭いPCブラウザでも行う(見た目の判定)。
  // 読み込むURL(PC版/モバイル版)は`isMobile()`(kintoneのモバイル版かどうか)で別途決まる
  const isMobile = useIsMobile();

  const title =
    state?.mode === 'edit'
      ? t('desktop.detailedDialog.editTitle')
      : t('desktop.detailedDialog.createTitle');

  const handleClose = (message?: InlineDialogMessage) => {
    onClose(message);
  };

  return (
    <IframeDialog
      open={state !== null}
      title={title}
      loadingText={t('desktop.detailedDialog.loading')}
      editUrl={state?.url ?? ''}
      closeMessageTypes={CLOSE_MESSAGE_TYPES}
      fullScreen={isMobile}
      frameName={state?.mode === 'edit' ? INLINE_FRAME_NAME.edit : INLINE_FRAME_NAME.create}
      onClose={handleClose}
    />
  );
};

export default DetailedDialog;

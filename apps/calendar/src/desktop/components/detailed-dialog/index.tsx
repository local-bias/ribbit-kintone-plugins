import { useIsMobile } from '@/desktop/hooks/use-mobile';
import { INLINE_FRAME_NAME, INLINE_MESSAGE } from '@/desktop/inline-record';
import {
  type DetailedDialogState,
  detailedDialogAtom,
  handleDetailedDialogClosedAtom,
  handleDetailedDialogMessageAtom,
} from '@/desktop/states/detailed-dialog';
import { t } from '@/lib/i18n-plugin';
import { useAtomValue, useSetAtom } from 'jotai';
import type { FC } from 'react';
import { IframeDialog, type InlineDialogMessage } from './iframe-dialog';

/** 受信したらダイアログを閉じるメッセージ */
const CLOSE_MESSAGE_TYPES: string[] = [
  INLINE_MESSAGE.editSubmitSuccess,
  INLINE_MESSAGE.editCancelled,
  INLINE_MESSAGE.createSubmitSuccess,
  INLINE_MESSAGE.createCancelled,
  INLINE_MESSAGE.viewClosed,
];

/** 受信してもダイアログは閉じず、状態の記録だけを行うメッセージ */
const NOTIFY_MESSAGE_TYPES: string[] = [INLINE_MESSAGE.viewRecordSaved];

type DialogMode = NonNullable<DetailedDialogState>['mode'];

/** ダイアログの種類ごとのタイトルと、iframeの`name`(画面遷移後もiframe内の判定に使う) */
const DIALOG_SETTINGS: Record<
  DialogMode,
  { titleKey: Parameters<typeof t>[0]; frameName: string }
> = {
  create: { titleKey: 'desktop.detailedDialog.createTitle', frameName: INLINE_FRAME_NAME.create },
  edit: { titleKey: 'desktop.detailedDialog.editTitle', frameName: INLINE_FRAME_NAME.edit },
  view: { titleKey: 'desktop.detailedDialog.viewTitle', frameName: INLINE_FRAME_NAME.view },
};

const DetailedDialog: FC = () => {
  const state = useAtomValue(detailedDialogAtom);
  const onClose = useSetAtom(handleDetailedDialogClosedAtom);
  const onNotify = useSetAtom(handleDetailedDialogMessageAtom);
  // 全画面表示はkintoneのモバイル版に加えて、幅の狭いPCブラウザでも行う(見た目の判定)。
  // 読み込むURL(PC版/モバイル版)は`isMobile()`(kintoneのモバイル版かどうか)で別途決まる
  const isMobile = useIsMobile();
  const settings = DIALOG_SETTINGS[state?.mode ?? 'create'];

  const handleClose = (message?: InlineDialogMessage) => {
    onClose(message);
  };

  return (
    <IframeDialog
      open={state !== null}
      title={t(settings.titleKey)}
      loadingText={t('desktop.detailedDialog.loading')}
      editUrl={state?.url ?? ''}
      closeMessageTypes={CLOSE_MESSAGE_TYPES}
      notifyMessageTypes={NOTIFY_MESSAGE_TYPES}
      fullScreen={isMobile}
      frameName={settings.frameName}
      onClose={handleClose}
      onNotify={onNotify}
    />
  );
};

export default DetailedDialog;

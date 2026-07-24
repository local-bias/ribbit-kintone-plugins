import { INLINE_MESSAGE, buildInlineCreateUrl, buildInlineEditUrl } from '@/desktop/inline-record';
import { detailedDialogAtom, handleDetailedDialogClosedAtom } from '@/desktop/states/detailed-dialog';
import { pluginConditionAtom } from '@/desktop/states/kintone';
import { t } from '@/lib/i18n-plugin';
import { useAtomValue, useSetAtom } from 'jotai';
import { FC, useMemo } from 'react';
import { IframeDialog, InlineDialogMessage } from './iframe-dialog';

const CLOSE_MESSAGE_TYPES = Object.values(INLINE_MESSAGE);

const DetailedDialog: FC = () => {
  const state = useAtomValue(detailedDialogAtom);
  const condition = useAtomValue(pluginConditionAtom);
  const onClose = useSetAtom(handleDetailedDialogClosedAtom);

  const editUrl = useMemo(() => {
    if (!state) return '';
    if (state.mode === 'edit') return buildInlineEditUrl(state.recordId);
    if (!condition) return '';
    return buildInlineCreateUrl({ condition, initialValues: state.initialValues });
  }, [state, condition]);

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
      editUrl={editUrl}
      closeMessageTypes={CLOSE_MESSAGE_TYPES}
      onClose={handleClose}
    />
  );
};

export default DetailedDialog;

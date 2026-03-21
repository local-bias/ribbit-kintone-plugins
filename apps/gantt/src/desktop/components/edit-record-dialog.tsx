import { GUEST_SPACE_ID } from '@/lib/global';
import { t } from '@/lib/i18n';
import { getCategoryFieldCodes } from '@/lib/plugin';
import { EditRecordDialog as SharedEditRecordDialog } from '@repo/ui';
import { useAtomValue, useSetAtom } from 'jotai';
import { FC, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { currentConditionAtom, editRecordDialogAtom, ganttAppIdAtom } from '../public-state';
import { refreshSingleRecord } from '../record-operations';

const CLOSE_MESSAGE_TYPES = ['gantt-edit-submit-success', 'gantt-edit-cancelled'];

export const EditRecordDialog: FC = () => {
  const editState = useAtomValue(editRecordDialogAtom);
  const setEditState = useSetAtom(editRecordDialogAtom);
  const condition = useAtomValue(currentConditionAtom);
  const appId = useAtomValue(ganttAppIdAtom);

  const open = editState !== null;
  const taskId = editState?.taskId ?? null;
  const taskTitle = editState?.taskTitle ?? '';

  const handleClose = useCallback(async () => {
    const closingTaskId = taskId;
    setEditState(null);

    // 閉じるときに編集対象レコードを再取得して最新化
    if (closingTaskId && condition && appId) {
      try {
        const fields = [
          condition.titleFieldCode,
          condition.startDateFieldCode,
          condition.endDateFieldCode,
          condition.assigneeFieldCode,
          ...getCategoryFieldCodes(condition),
          condition.progressFieldCode,
          condition.categorySortFieldCode,
          ...(condition.tooltipFieldCodes ?? []),
        ].filter(Boolean);

        await refreshSingleRecord({
          appId,
          taskId: closingTaskId,
          fields,
          guestSpaceId: GUEST_SPACE_ID,
        });
      } catch (error) {
        console.error('[gantt] Failed to refresh record after edit:', error);
        toast.error(t('desktop.toast.editRefreshError'));
      }
    }
  }, [taskId, condition, appId, setEditState]);

  const editUrl = useMemo(
    () => (taskId ? `${location.pathname}show?gantt_inline_edit=1#record=${taskId}&mode=edit` : ''),
    [taskId]
  );

  return (
    <SharedEditRecordDialog
      open={open}
      title={t('desktop.editRecord.title', taskTitle)}
      loadingText={t('desktop.editRecord.loading')}
      editUrl={editUrl}
      closeMessageTypes={CLOSE_MESSAGE_TYPES}
      onClose={handleClose}
    />
  );
};

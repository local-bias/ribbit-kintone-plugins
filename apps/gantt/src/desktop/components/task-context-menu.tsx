import styled from '@emotion/styled';
import {
  ContextMenuContent,
  ContextMenuDestructiveItem,
  ContextMenuIconWrapper,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuRoot,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuSubTriggerArrow,
  ContextMenuTrigger,
} from '@repo/ui';
import { useAtomValue, useSetAtom } from 'jotai';
import { type FC, type ReactNode, useCallback } from 'react';
import { toast } from 'sonner';
import { GUEST_SPACE_ID } from '@/lib/global';
import { t } from '@/lib/i18n';
import { getCategoryFieldCodes } from '@/lib/plugin';
import type { GanttTask } from '../hooks/use-gantt-layout';
import { currentConditionAtom, editRecordDialogAtom, ganttAppIdAtom } from '../public-state';
import {
  deleteTask,
  duplicateTask,
  optimisticUpdateRecord,
  refreshRecords,
  updateTaskProgress,
} from '../record-operations';

const ProgressItem = styled(ContextMenuItem)<{ active?: boolean }>`
  font-weight: ${({ active }) => (active ? 600 : 400)};
  color: ${({ active }) => (active ? '#4285f4' : '#333')};

  &[data-highlighted] {
    background-color: #4285f4;
    color: #fff;
  }
`;

interface TaskContextMenuProps {
  task: GanttTask;
  children: ReactNode;
}

export const TaskContextMenu: FC<TaskContextMenuProps> = ({ task, children }) => {
  const condition = useAtomValue(currentConditionAtom);
  const appId = useAtomValue(ganttAppIdAtom);
  const setEditRecordDialog = useSetAtom(editRecordDialogAtom);

  const handleOpenRecord = useCallback(() => {
    if (task.id) {
      const url = `${location.pathname}show#record=${task.id}`;
      window.open(url, '_blank');
    }
  }, [task.id]);

  const handleEditRecord = useCallback(() => {
    if (task.id) {
      setEditRecordDialog({ taskId: task.id, taskTitle: task.title });
    }
  }, [task.id, task.title, setEditRecordDialog]);

  const handleDeleteRecord = useCallback(async () => {
    if (!task.id || !condition || !appId) {
      return;
    }

    const confirmed = window.confirm(t('desktop.contextMenu.deleteConfirm', task.title));
    if (!confirmed) {
      return;
    }

    try {
      await deleteTask({
        appId,
        taskId: task.id,
        guestSpaceId: GUEST_SPACE_ID,
      });

      const fields = [
        condition.titleFieldCode,
        condition.startDateFieldCode,
        condition.endDateFieldCode,
        condition.assigneeFieldCode,
        ...getCategoryFieldCodes(condition),
        condition.progressFieldCode,
        condition.categorySortFieldCode,
      ].filter(Boolean);

      await refreshRecords({
        appId,
        fields,
        guestSpaceId: GUEST_SPACE_ID,
      });

      toast.success(t('desktop.toast.deleteSuccess'));
    } catch (error) {
      console.error('[gantt] Failed to delete task:', error);
      toast.error(t('desktop.toast.deleteError'));
    }
  }, [task, condition, appId]);

  const handleDuplicateRecord = useCallback(async () => {
    if (!task.id || !condition || !appId) {
      return;
    }

    try {
      await duplicateTask({
        appId,
        record: task.record as Record<string, { value: unknown }>,
        guestSpaceId: GUEST_SPACE_ID,
      });

      const fields = [
        condition.titleFieldCode,
        condition.startDateFieldCode,
        condition.endDateFieldCode,
        condition.assigneeFieldCode,
        ...getCategoryFieldCodes(condition),
        condition.progressFieldCode,
        condition.categorySortFieldCode,
      ].filter(Boolean);

      await refreshRecords({
        appId,
        fields,
        guestSpaceId: GUEST_SPACE_ID,
      });

      toast.success(t('desktop.toast.duplicateSuccess'));
    } catch (error) {
      console.error('[gantt] Failed to duplicate task:', error);
      toast.error(t('desktop.toast.duplicateError'));
    }
  }, [task, condition, appId]);

  const handleUpdateProgress = useCallback(
    async (progress: number) => {
      if (!task.id || !condition?.progressFieldCode || !appId) {
        return;
      }

      // 楽観的更新
      optimisticUpdateRecord(task.id, {
        [condition.progressFieldCode]: { value: String(progress) },
      });

      try {
        await updateTaskProgress({
          appId,
          taskId: task.id,
          progressFieldCode: condition.progressFieldCode,
          progress,
          guestSpaceId: GUEST_SPACE_ID,
        });
        toast.success(t('desktop.toast.progressUpdateSuccess', String(progress)));
      } catch (error) {
        console.error('[gantt] Failed to update progress:', error);
        toast.error(t('desktop.toast.progressUpdateError'));

        const fields = [
          condition.titleFieldCode,
          condition.startDateFieldCode,
          condition.endDateFieldCode,
          condition.assigneeFieldCode,
          ...getCategoryFieldCodes(condition),
          condition.progressFieldCode,
          condition.categorySortFieldCode,
        ].filter(Boolean);

        await refreshRecords({
          appId,
          fields,
          guestSpaceId: GUEST_SPACE_ID,
        });
      }
    },
    [task, condition, appId]
  );

  const progressOptions = [0, 10, 25, 50, 75, 90, 100];
  const hasProgressField = !!condition?.progressFieldCode;

  return (
    <ContextMenuRoot>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuPortal>
        <ContextMenuContent>
          <ContextMenuItem onSelect={handleOpenRecord}>
            <ContextMenuIconWrapper>📄</ContextMenuIconWrapper>
            {t('desktop.contextMenu.openRecord')}
          </ContextMenuItem>
          <ContextMenuItem onSelect={handleEditRecord}>
            <ContextMenuIconWrapper>✏️</ContextMenuIconWrapper>
            {t('desktop.contextMenu.editRecord')}
          </ContextMenuItem>
          <ContextMenuSeparator />
          {hasProgressField && (
            <>
              <ContextMenuSub>
                <ContextMenuSubTrigger>
                  <ContextMenuIconWrapper>📊</ContextMenuIconWrapper>
                  {t('desktop.contextMenu.updateProgress')}
                  <ContextMenuSubTriggerArrow>▶</ContextMenuSubTriggerArrow>
                </ContextMenuSubTrigger>
                <ContextMenuPortal>
                  <ContextMenuSubContent sideOffset={2} alignOffset={-5}>
                    {progressOptions.map((value) => (
                      <ProgressItem
                        key={value}
                        active={task.progress === value}
                        onSelect={() => handleUpdateProgress(value)}
                      >
                        {value}%
                      </ProgressItem>
                    ))}
                  </ContextMenuSubContent>
                </ContextMenuPortal>
              </ContextMenuSub>
              <ContextMenuSeparator />
            </>
          )}
          <ContextMenuItem onSelect={handleDuplicateRecord}>
            <ContextMenuIconWrapper>📋</ContextMenuIconWrapper>
            {t('desktop.contextMenu.duplicateRecord')}
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuDestructiveItem onSelect={handleDeleteRecord}>
            <ContextMenuIconWrapper>🗑️</ContextMenuIconWrapper>
            {t('desktop.contextMenu.deleteRecord')}
          </ContextMenuDestructiveItem>
        </ContextMenuContent>
      </ContextMenuPortal>
    </ContextMenuRoot>
  );
};

import styled from '@emotion/styled';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { FC, ReactNode, useCallback } from 'react';
import { useAtomValue } from 'jotai';
import { toast } from 'sonner';
import { GanttTask } from '../hooks/use-gantt-layout';
import { currentConditionAtom, ganttAppIdAtom } from '../public-state';
import {
  deleteTask,
  duplicateTask,
  optimisticUpdateRecord,
  refreshRecords,
  updateTaskProgress,
} from '../record-operations';
import { GUEST_SPACE_ID } from '@/lib/global';
import { t } from '@/lib/i18n';

const StyledContent = styled(ContextMenu.Content)`
  min-width: 180px;
  background-color: #fff;
  border-radius: 6px;
  padding: 4px;
  box-shadow:
    0 10px 38px -10px rgba(22, 23, 24, 0.35),
    0 10px 20px -15px rgba(22, 23, 24, 0.2);
  z-index: 100;
  animation: fadeIn 0.1s ease-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(0.96);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
`;

const StyledItem = styled(ContextMenu.Item)`
  font-size: 13px;
  line-height: 1;
  color: #333;
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 12px;
  position: relative;
  user-select: none;
  outline: none;
  border-radius: 4px;
  cursor: pointer;
  gap: 8px;

  &[data-highlighted] {
    background-color: #4285f4;
    color: #fff;
  }

  &[data-disabled] {
    color: #aaa;
    pointer-events: none;
  }
`;

const StyledSeparator = styled(ContextMenu.Separator)`
  height: 1px;
  background-color: #e0e0e0;
  margin: 4px 0;
`;

const DestructiveItem = styled(StyledItem)`
  color: #ea4335;

  &[data-highlighted] {
    background-color: #ea4335;
    color: #fff;
  }
`;

const StyledSubTrigger = styled(ContextMenu.SubTrigger)`
  font-size: 13px;
  line-height: 1;
  color: #333;
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 12px;
  position: relative;
  user-select: none;
  outline: none;
  border-radius: 4px;
  cursor: pointer;
  gap: 8px;

  &[data-highlighted] {
    background-color: #4285f4;
    color: #fff;
  }

  &[data-disabled] {
    color: #aaa;
    pointer-events: none;
  }
`;

const StyledSubContent = styled(ContextMenu.SubContent)`
  min-width: 140px;
  background-color: #fff;
  border-radius: 6px;
  padding: 4px;
  box-shadow:
    0 10px 38px -10px rgba(22, 23, 24, 0.35),
    0 10px 20px -15px rgba(22, 23, 24, 0.2);
  z-index: 101;
  animation: fadeIn 0.1s ease-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(0.96);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
`;

const SubTriggerArrow = styled.span`
  margin-left: auto;
  font-size: 11px;
`;

const ProgressItem = styled(StyledItem)<{ active?: boolean }>`
  font-weight: ${({ active }) => (active ? 600 : 400)};
  color: ${({ active }) => (active ? '#4285f4' : '#333')};

  &[data-highlighted] {
    background-color: #4285f4;
    color: #fff;
  }
`;

const IconWrapper = styled.span`
  display: inline-flex;
  width: 16px;
  height: 16px;
  align-items: center;
  justify-content: center;
  font-size: 14px;
`;

interface TaskContextMenuProps {
  task: GanttTask;
  children: ReactNode;
}

export const TaskContextMenu: FC<TaskContextMenuProps> = ({ task, children }) => {
  const condition = useAtomValue(currentConditionAtom);
  const appId = useAtomValue(ganttAppIdAtom);

  const handleOpenRecord = useCallback(() => {
    if (task.id) {
      const url = `${location.pathname}show#record=${task.id}`;
      window.open(url, '_blank');
    }
  }, [task.id]);

  const handleEditRecord = useCallback(() => {
    if (task.id) {
      const url = `${location.pathname}show#record=${task.id}&mode=edit`;
      window.open(url, '_blank');
    }
  }, [task.id]);

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
        condition.categoryFieldCode,
        condition.progressFieldCode,
        condition.colorFieldCode,
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
        condition.categoryFieldCode,
        condition.progressFieldCode,
        condition.colorFieldCode,
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
          condition.categoryFieldCode,
          condition.progressFieldCode,
          condition.colorFieldCode,
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
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>
      <ContextMenu.Portal>
        <StyledContent>
          <StyledItem onSelect={handleOpenRecord}>
            <IconWrapper>📄</IconWrapper>
            {t('desktop.contextMenu.openRecord')}
          </StyledItem>
          <StyledItem onSelect={handleEditRecord}>
            <IconWrapper>✏️</IconWrapper>
            {t('desktop.contextMenu.editRecord')}
          </StyledItem>
          <StyledSeparator />
          {hasProgressField && (
            <>
              <ContextMenu.Sub>
                <StyledSubTrigger>
                  <IconWrapper>📊</IconWrapper>
                  {t('desktop.contextMenu.updateProgress')}
                  <SubTriggerArrow>▶</SubTriggerArrow>
                </StyledSubTrigger>
                <ContextMenu.Portal>
                  <StyledSubContent sideOffset={2} alignOffset={-5}>
                    {progressOptions.map((value) => (
                      <ProgressItem
                        key={value}
                        active={task.progress === value}
                        onSelect={() => handleUpdateProgress(value)}
                      >
                        {value}%
                      </ProgressItem>
                    ))}
                  </StyledSubContent>
                </ContextMenu.Portal>
              </ContextMenu.Sub>
              <StyledSeparator />
            </>
          )}
          <StyledItem onSelect={handleDuplicateRecord}>
            <IconWrapper>📋</IconWrapper>
            {t('desktop.contextMenu.duplicateRecord')}
          </StyledItem>
          <StyledSeparator />
          <DestructiveItem onSelect={handleDeleteRecord}>
            <IconWrapper>🗑️</IconWrapper>
            {t('desktop.contextMenu.deleteRecord')}
          </DestructiveItem>
        </StyledContent>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
};

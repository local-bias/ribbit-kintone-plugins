import styled from '@emotion/styled';
import { useAtomValue } from 'jotai';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from '@dnd-kit/core';
import { toast } from 'sonner';
import {
  HEADER_HEIGHT,
  SIDEBAR_WIDTH,
  GanttTask,
  useGanttLayout,
  COLUMN_WIDTH,
} from '../hooks/use-gantt-layout';
import {
  currentConditionAtom,
  ganttAppIdAtom,
  ganttGroupByAtom,
  ganttRecordsAtom,
  ganttScaleAtom,
  ganttViewDateAtom,
} from '../public-state';
import {
  updateTaskDates,
  updateTaskCategory,
  updateTaskAssignee,
  updateTaskStartDate,
  updateTaskEndDate,
  refreshRecords,
  formatDate,
  optimisticUpdateRecord,
  getRecordsSnapshot,
  restoreRecordsSnapshot,
} from '../record-operations';
import { getCategoryFieldCodes } from '@/lib/plugin';
import { GanttBody } from './gantt-body';
import { GanttHeader } from './gantt-header';
import { GanttSidebar } from './gantt-sidebar';
import { GUEST_SPACE_ID } from '@/lib/global';
import { t } from '@/lib/i18n';

const ChartWrapper = styled.div`
  display: flex;
  flex-direction: row;
  overflow: hidden;
  position: relative;
  border-top: 1px solid #e0e0e0;
`;

const SidebarContainer = styled.div`
  width: ${SIDEBAR_WIDTH}px;
  min-width: ${SIDEBAR_WIDTH}px;
  flex-shrink: 0;
  border-right: 2px solid #e0e0e0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const SidebarHeader = styled.div`
  height: ${HEADER_HEIGHT}px;
  min-height: ${HEADER_HEIGHT}px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  border-bottom: 1px solid #e0e0e0;
  font-weight: 600;
  font-size: 12px;
  color: #666;
  background-color: #fafafa;
`;

const SidebarBody = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;

  &::-webkit-scrollbar {
    width: 0;
  }
`;

const TimelineContainer = styled.div`
  flex: 1;
  overflow: auto;
  position: relative;

  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }
`;

const TimelineInner = styled.div<{ width: number }>`
  min-width: ${({ width }) => width}px;
  position: relative;
`;

const BAR_HEIGHT = 22;

const OverlayBar = styled.div<{ width: number; color: string }>`
  width: ${({ width }) => width}px;
  height: ${BAR_HEIGHT}px;
  background-color: ${({ color }) => color}55;
  border: 1px solid ${({ color }) => color};
  border-radius: 4px;
  display: flex;
  align-items: center;
  padding: 0 6px;
  font-size: 11px;
  color: #333;
  font-weight: 500;
  cursor: grabbing;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
`;

export const GanttChart: FC = () => {
  const records = useAtomValue(ganttRecordsAtom);
  const condition = useAtomValue(currentConditionAtom);
  const scale = useAtomValue(ganttScaleAtom);
  const viewDate = useAtomValue(ganttViewDateAtom);
  const groupBy = useAtomValue(ganttGroupByAtom);
  const appId = useAtomValue(ganttAppIdAtom);

  const layout = useGanttLayout({ records, condition, scale, viewDate, groupBy });

  const sidebarBodyRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const [activeTask, setActiveTask] = useState<GanttTask | null>(null);
  const [activeDragType, setActiveDragType] = useState<string | null>(null);
  const [overGroupKey, setOverGroupKey] = useState<string | null>(null);

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 5 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 5 },
  });
  const sensors = useSensors(mouseSensor, touchSensor);

  // 縦スクロール同期
  const handleTimelineScroll = useCallback(() => {
    if (timelineRef.current && sidebarBodyRef.current) {
      sidebarBodyRef.current.scrollTop = timelineRef.current.scrollTop;
    }
  }, []);

  const handleSidebarScroll = useCallback(() => {
    if (sidebarBodyRef.current && timelineRef.current) {
      timelineRef.current.scrollTop = sidebarBodyRef.current.scrollTop;
    }
  }, []);

  // 初期スクロール → 今日が見える位置に
  useEffect(() => {
    if (timelineRef.current && layout.todayX > 0) {
      const containerWidth = timelineRef.current.clientWidth;
      timelineRef.current.scrollLeft = Math.max(0, layout.todayX - containerWidth / 2);
    }
  }, [layout.todayX, scale]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current;
    if (data?.type === 'BAR' || data?.type === 'RESIZE_START' || data?.type === 'RESIZE_END') {
      setActiveTask(data.task as GanttTask);
      setActiveDragType(data.type as string);
      setOverGroupKey(null);
    }
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    if (over?.data.current?.type === 'GROUP') {
      setOverGroupKey(over.data.current.group.key as string);
    } else if (over?.data.current?.type === 'TASK_ROW') {
      setOverGroupKey(over.data.current.groupKey as string);
    }
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const currentActiveTask = activeTask;
      const currentOverGroupKey = overGroupKey;
      const currentDragType = activeDragType;
      setActiveTask(null);
      setOverGroupKey(null);
      setActiveDragType(null);

      const { active, delta } = event;
      const data = active.data.current;

      if (!data || !condition || !appId || !currentActiveTask) {
        return;
      }

      const columnWidth = COLUMN_WIDTH[scale] ?? 40;

      // リサイズ処理（開始日または終了日の変更）
      if (currentDragType === 'RESIZE_START' || currentDragType === 'RESIZE_END') {
        let daysDelta: number;
        if (scale === 'day') {
          daysDelta = Math.round(delta.x / columnWidth);
        } else if (scale === 'week') {
          daysDelta = Math.round((delta.x / columnWidth) * 7);
        } else {
          daysDelta = Math.round((delta.x / columnWidth) * 30);
        }

        if (daysDelta === 0) {
          return;
        }

        const task = currentActiveTask;

        const snapshot = getRecordsSnapshot();

        const resizeLabel = currentDragType === 'RESIZE_START' ? '開始日' : '終了日';

        const resizePromise = (async () => {
          const fields = [
            condition.titleFieldCode,
            condition.startDateFieldCode,
            condition.endDateFieldCode,
            condition.assigneeFieldCode,
            ...getCategoryFieldCodes(condition),
            condition.progressFieldCode,
          ].filter(Boolean);

          if (currentDragType === 'RESIZE_START') {
            const newStart = new Date(task.startDate);
            newStart.setDate(newStart.getDate() + daysDelta);

            // 開始日が終了日を超えないようにする
            if (newStart >= task.endDate) {
              toast.warning(t('desktop.toast.resizeValidationError'));
              return;
            }

            optimisticUpdateRecord(task.id, {
              [condition.startDateFieldCode]: { value: formatDate(newStart) },
            });

            await updateTaskStartDate({
              appId,
              taskId: task.id,
              startDateFieldCode: condition.startDateFieldCode,
              newStartDate: newStart,
              guestSpaceId: GUEST_SPACE_ID,
            });
          } else {
            const newEnd = new Date(task.endDate);
            newEnd.setDate(newEnd.getDate() + daysDelta);

            // 終了日が開始日より前にならないようにする
            if (newEnd <= task.startDate) {
              toast.warning(t('desktop.toast.resizeValidationError'));
              return;
            }

            optimisticUpdateRecord(task.id, {
              [condition.endDateFieldCode]: { value: formatDate(newEnd) },
            });

            await updateTaskEndDate({
              appId,
              taskId: task.id,
              endDateFieldCode: condition.endDateFieldCode,
              newEndDate: newEnd,
              guestSpaceId: GUEST_SPACE_ID,
            });
          }

          await refreshRecords({
            appId,
            fields,
            guestSpaceId: GUEST_SPACE_ID,
          });
        })();

        toast.promise(resizePromise, {
          loading: `${resizeLabel}を更新中…`,
          success: `${resizeLabel}を更新しました`,
          error: () => {
            restoreRecordsSnapshot(snapshot);
            return '日付の更新に失敗しました';
          },
        });
        return;
      }

      // ガントバーのドラッグ → 日付変更 + グループ変更
      if (data.type === 'BAR') {
        const task = data.task as GanttTask;
        const columnWidth = COLUMN_WIDTH[scale] ?? 40;

        let daysDelta: number;
        if (scale === 'day') {
          daysDelta = Math.round(delta.x / columnWidth);
        } else if (scale === 'week') {
          daysDelta = Math.round((delta.x / columnWidth) * 7);
        } else {
          daysDelta = Math.round((delta.x / columnWidth) * 30);
        }

        // ドロップ先のグループを特定
        const targetGroup = currentOverGroupKey
          ? layout.groups.find((g) => g.key === currentOverGroupKey)
          : null;

        // 元のグループを特定
        const sourceGroupKey =
          groupBy === 'assignee' ? (task.assignees[0] ?? '') : task.categoryValues.join('|') || '';

        const groupChanged =
          targetGroup !== null && targetGroup !== undefined && targetGroup.key !== sourceGroupKey;
        const dateChanged = daysDelta !== 0;

        if (!groupChanged && !dateChanged) {
          return;
        }

        // 楽観的更新（API完了前にUI即時反映）
        const snapshot = getRecordsSnapshot();
        const opt: Record<string, { value: unknown }> = {};
        if (dateChanged) {
          const s = new Date(task.startDate);
          s.setDate(s.getDate() + daysDelta);
          const e = new Date(task.endDate);
          e.setDate(e.getDate() + daysDelta);
          opt[condition.startDateFieldCode] = { value: formatDate(s) };
          opt[condition.endDateFieldCode] = { value: formatDate(e) };
        }
        if (groupChanged && targetGroup) {
          if (groupBy === 'category' && targetGroup.categoryPath.length > 0) {
            for (const entry of targetGroup.categoryPath) {
              opt[entry.fieldCode] = { value: entry.value };
            }
          } else if (groupBy === 'assignee' && condition.assigneeFieldCode) {
            opt[condition.assigneeFieldCode] = {
              value: targetGroup.code ? [{ code: targetGroup.code }] : [],
            };
          }
        }
        optimisticUpdateRecord(task.id, opt);

        const updatePromise = (async () => {
          const updates: Promise<void>[] = [];

          // 日付変更
          if (dateChanged) {
            const newStart = new Date(task.startDate);
            newStart.setDate(newStart.getDate() + daysDelta);
            const newEnd = new Date(task.endDate);
            newEnd.setDate(newEnd.getDate() + daysDelta);

            updates.push(
              updateTaskDates({
                appId,
                taskId: task.id,
                startDateFieldCode: condition.startDateFieldCode,
                endDateFieldCode: condition.endDateFieldCode,
                newStartDate: newStart,
                newEndDate: newEnd,
                guestSpaceId: GUEST_SPACE_ID,
              })
            );
          }

          // グループ変更
          if (groupChanged && targetGroup) {
            if (groupBy === 'category' && targetGroup.categoryPath.length > 0) {
              for (const entry of targetGroup.categoryPath) {
                updates.push(
                  updateTaskCategory({
                    appId,
                    taskId: task.id,
                    categoryFieldCode: entry.fieldCode,
                    newCategory: entry.value,
                    guestSpaceId: GUEST_SPACE_ID,
                  })
                );
              }
            } else if (groupBy === 'assignee' && condition.assigneeFieldCode) {
              updates.push(
                updateTaskAssignee({
                  appId,
                  taskId: task.id,
                  assigneeFieldCode: condition.assigneeFieldCode,
                  newAssigneeCode: targetGroup.code,
                  guestSpaceId: GUEST_SPACE_ID,
                })
              );
            }
          }

          await Promise.all(updates);

          const fields = [
            condition.titleFieldCode,
            condition.startDateFieldCode,
            condition.endDateFieldCode,
            condition.assigneeFieldCode,
            ...getCategoryFieldCodes(condition),
            condition.progressFieldCode,
          ].filter(Boolean);

          await refreshRecords({
            appId,
            fields,
            guestSpaceId: GUEST_SPACE_ID,
          });
        })();

        const messages: string[] = [];
        if (dateChanged) {
          messages.push('日付');
        }
        if (groupChanged) {
          messages.push(groupBy === 'category' ? 'カテゴリ' : '担当者');
        }
        const label = messages.join('と');

        toast.promise(updatePromise, {
          loading: `タスクの${label}を更新中…`,
          success: `タスクの${label}を更新しました`,
          error: () => {
            restoreRecordsSnapshot(snapshot);
            return 'タスクの更新に失敗しました';
          },
        });
      }
    },
    [condition, appId, scale, groupBy, layout.groups, activeTask, activeDragType, overGroupKey]
  );

  const activeBarWidth = activeTask
    ? Math.max(layout.dateToX(activeTask.endDate) - layout.dateToX(activeTask.startDate), 4)
    : 0;

  const activeBarColor = activeTask?.colorValue
    ? (layout.colorMap.get(activeTask.colorValue) ?? '#4285F4')
    : '#4285F4';

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <ChartWrapper>
        <SidebarContainer>
          <SidebarHeader>タスク</SidebarHeader>
          <SidebarBody ref={sidebarBodyRef} onScroll={handleSidebarScroll}>
            <GanttSidebar groups={layout.groups} />
          </SidebarBody>
        </SidebarContainer>
        <TimelineContainer ref={timelineRef} onScroll={handleTimelineScroll}>
          <TimelineInner width={layout.totalWidth}>
            <GanttHeader columns={layout.columns} columnWidth={layout.columnWidth} />
            <GanttBody
              groups={layout.groups}
              dateToX={layout.dateToX}
              todayX={layout.todayX}
              columnWidth={layout.columnWidth}
              columns={layout.columns}
              colorMap={layout.colorMap}
            />
          </TimelineInner>
        </TimelineContainer>
      </ChartWrapper>
      <DragOverlay dropAnimation={null}>
        {activeTask && activeDragType === 'BAR' ? (
          <OverlayBar width={activeBarWidth} color={activeBarColor}>
            {activeBarWidth > 60 ? activeTask.title : ''}
          </OverlayBar>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

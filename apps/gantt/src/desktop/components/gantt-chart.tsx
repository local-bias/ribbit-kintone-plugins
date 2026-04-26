import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  MouseSensor,
  pointerWithin,
  TouchSensor,
  useDndMonitor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import styled from '@emotion/styled';
import { store } from '@repo/jotai';
import { useAtomValue } from 'jotai';
import { type FC, useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { GUEST_SPACE_ID } from '@/lib/global';
import { t } from '@/lib/i18n';
import { getCategoryFieldCodes } from '@/lib/plugin';
import type { GanttScale } from '@/schema/plugin-config';
import {
  COLUMN_WIDTH,
  type GanttTask,
  HEADER_HEIGHT,
  useGanttLayout,
} from '../hooks/use-gantt-layout';
import {
  allGroupKeysAtom,
  currentConditionAtom,
  ganttAppIdAtom,
  ganttFormFieldTypeMapAtom,
  ganttGroupByAtom,
  ganttRecordsAtom,
  ganttScaleAtom,
  ganttScrollMaxAtom,
  ganttScrollXAtom,
  ganttViewDateAtom,
  sidebarWidthAtom,
} from '../public-state';
import {
  buildCategoryFieldValue,
  formatDate,
  getRecordsSnapshot,
  optimisticUpdateRecord,
  refreshRecords,
  restoreRecordsSnapshot,
  updateTaskAssignee,
  updateTaskCategory,
  updateTaskDates,
  updateTaskEndDate,
  updateTaskStartDate,
} from '../record-operations';
import { GanttBody } from './gantt-body';
import { GanttHeader } from './gantt-header';
import { GanttSidebar } from './gantt-sidebar';

const ChartWrapper = styled.div`
  display: flex;
  flex-direction: row;
  overflow: hidden;
  position: relative;
  border-top: 1px solid #e0e0e0;
`;

const SidebarContainer = styled.div<{ width: number }>`
  width: ${({ width }) => width}px;
  min-width: ${({ width }) => width}px;
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
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

const ResizeDivider = styled.div<{ isDragging: boolean }>`
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  width: 4px;
  cursor: col-resize;
  z-index: 20;
  background-color: ${({ isDragging }) => (isDragging ? 'rgba(66, 133, 244, 0.5)' : 'transparent')};
  transition: background-color 0.1s;

  &:hover {
    background-color: rgba(66, 133, 244, 0.3);
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 2px;
    height: 100%;
    background-color: #e0e0e0;
  }
`;

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

const OverlayDateLabel = styled.div<{ changed: boolean }>`
  margin-top: 4px;
  padding: 2px 8px;
  background-color: ${({ changed }) =>
    changed ? 'rgba(25, 118, 210, 0.95)' : 'rgba(0, 0, 0, 0.75)'};
  color: #fff;
  font-size: 11px;
  font-weight: 500;
  border-radius: 4px;
  white-space: nowrap;
  text-align: center;
  pointer-events: none;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
`;

function formatDisplayDate(date: Date): string {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${m}/${d}`;
}

function calcDaysDelta(deltaX: number, scale: GanttScale): number {
  const columnWidth = COLUMN_WIDTH[scale] ?? 40;
  if (scale === 'day') {
    return Math.round(deltaX / columnWidth);
  } else if (scale === 'week') {
    return Math.round((deltaX / columnWidth) * 7);
  } else {
    return Math.round((deltaX / columnWidth) * 30);
  }
}

/** DragOverlay内で日付プレビューを表示するコンポーネント */
const DragOverlayContent: FC<{
  task: GanttTask;
  barWidth: number;
  color: string;
  scale: GanttScale;
}> = ({ task, barWidth, color, scale }) => {
  const [deltaX, setDeltaX] = useState(0);

  useDndMonitor({
    onDragMove(event) {
      const data = event.active.data.current;
      if (data?.type === 'BAR' && (data.task as GanttTask)?.id === task.id) {
        setDeltaX(event.delta.x);
      }
    },
  });

  const daysDelta = calcDaysDelta(deltaX, scale);

  const newStart = new Date(task.startDate);
  newStart.setDate(newStart.getDate() + daysDelta);
  const newEnd = new Date(task.endDate);
  newEnd.setDate(newEnd.getDate() + daysDelta);

  const dateChanged = daysDelta !== 0;

  return (
    <div>
      <OverlayBar width={barWidth} color={color}>
        {barWidth > 60 ? task.title : ''}
      </OverlayBar>
      <OverlayDateLabel changed={dateChanged}>
        {formatDisplayDate(newStart)} 〜 {formatDisplayDate(newEnd)}
      </OverlayDateLabel>
    </div>
  );
};

export const GanttChart: FC = () => {
  const records = useAtomValue(ganttRecordsAtom);
  const condition = useAtomValue(currentConditionAtom);
  const scale = useAtomValue(ganttScaleAtom);
  const viewDate = useAtomValue(ganttViewDateAtom);
  const groupBy = useAtomValue(ganttGroupByAtom);
  const appId = useAtomValue(ganttAppIdAtom);
  const formFieldTypeMap = useAtomValue(ganttFormFieldTypeMapAtom);

  const layout = useGanttLayout({
    records,
    condition,
    scale,
    viewDate,
    groupBy,
    formFieldTypeMap,
  });

  // 全グループキーを同期（ツールバーの全展開/折りたたみ用）
  useEffect(() => {
    store.set(
      allGroupKeysAtom,
      layout.groups.map((g) => g.key)
    );
  }, [layout.groups]);

  const sidebarBodyRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const [activeTask, setActiveTask] = useState<GanttTask | null>(null);
  const [activeDragType, setActiveDragType] = useState<string | null>(null);
  const [overGroupKey, setOverGroupKey] = useState<string | null>(null);

  // サイドバーリサイズ
  const sidebarWidth = useAtomValue(sidebarWidthAtom);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingSidebar(true);
    const startX = e.clientX;
    const startWidth = store.get(sidebarWidthAtom);

    const handleMouseMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startX;
      const newWidth = Math.min(500, Math.max(150, startWidth + delta));
      store.set(sidebarWidthAtom, newWidth);
    };

    const handleMouseUp = () => {
      setIsResizingSidebar(false);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 5 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 200, tolerance: 5 },
  });
  const sensors = useSensors(mouseSensor, touchSensor);

  // 縦スクロール同期 + 横スクロール位置をatomに同期
  // isApplyingFromAtom フラグが立っている間はatom更新をスキップ（ループ防止）
  const isApplyingFromAtom = useRef(false);
  const handleTimelineScroll = useCallback(() => {
    const el = timelineRef.current;
    if (!el) return;
    if (sidebarBodyRef.current) {
      sidebarBodyRef.current.scrollTop = el.scrollTop;
    }
    if (!isApplyingFromAtom.current) {
      store.set(ganttScrollXAtom, el.scrollLeft);
    }
  }, []);

  const handleSidebarScroll = useCallback(() => {
    if (sidebarBodyRef.current && timelineRef.current) {
      timelineRef.current.scrollTop = sidebarBodyRef.current.scrollTop;
    }
  }, []);

  // ツールバースライダーからのスクロール命令を受け取る
  const scrollXAtomValue = useAtomValue(ganttScrollXAtom);
  useEffect(() => {
    const el = timelineRef.current;
    if (!el) return;
    if (Math.abs(el.scrollLeft - scrollXAtomValue) > 1) {
      isApplyingFromAtom.current = true;
      el.scrollLeft = scrollXAtomValue;
      requestAnimationFrame(() => {
        isApplyingFromAtom.current = false;
      });
    }
  }, [scrollXAtomValue]);

  // scrollMax を更新（タイムライン幅変化時）
  useEffect(() => {
    const el = timelineRef.current;
    if (!el) return;
    const updateMax = () => {
      store.set(ganttScrollMaxAtom, Math.max(0, el.scrollWidth - el.clientWidth));
    };
    updateMax();
    const ro = new ResizeObserver(updateMax);
    ro.observe(el);
    return () => ro.disconnect();
  }, [layout.totalWidth]);

  // 初期スクロール → 今日が見える位置に
  const initialScrollDone = useRef(false);
  useEffect(() => {
    if (timelineRef.current && layout.todayX > 0 && !initialScrollDone.current) {
      const containerWidth = timelineRef.current.clientWidth;
      const targetX = Math.max(0, layout.todayX - containerWidth / 2);
      timelineRef.current.scrollLeft = targetX;
      store.set(ganttScrollXAtom, targetX);
      store.set(ganttScrollMaxAtom, Math.max(0, timelineRef.current.scrollWidth - containerWidth));
      initialScrollDone.current = true;
    }
  }, [layout.todayX]);

  // viewDate 変更時 → viewDateX までスクロール
  const prevViewDateRef = useRef(viewDate);
  useEffect(() => {
    if (prevViewDateRef.current === viewDate) {
      return;
    }
    prevViewDateRef.current = viewDate;
    if (timelineRef.current) {
      const containerWidth = timelineRef.current.clientWidth;
      const targetX = Math.max(0, layout.viewDateX - containerWidth / 2);
      timelineRef.current.scrollLeft = targetX;
      store.set(ganttScrollXAtom, targetX);
    }
  }, [viewDate, layout.viewDateX]);

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

        const resizeLabel =
          currentDragType === 'RESIZE_START'
            ? t('desktop.field.startDate')
            : t('desktop.field.endDate');

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
          loading: t('desktop.toast.dateUpdateLoading', resizeLabel),
          success: t('desktop.toast.dateUpdateSuccess', resizeLabel),
          error: () => {
            restoreRecordsSnapshot(snapshot);
            return t('desktop.toast.dateUpdateError');
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
              opt[entry.fieldCode] = buildCategoryFieldValue(entry.code, entry.fieldType);
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
                    newCategory: entry.code,
                    fieldType: entry.fieldType,
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
          messages.push(t('desktop.field.date'));
        }
        if (groupChanged) {
          messages.push(
            groupBy === 'category' ? t('desktop.groupBy.category') : t('desktop.groupBy.assignee')
          );
        }
        const label = messages.join(', ');

        toast.promise(updatePromise, {
          loading: t('desktop.toast.taskUpdateLoading', label),
          success: t('desktop.toast.taskUpdateSuccess', label),
          error: () => {
            restoreRecordsSnapshot(snapshot);
            return t('desktop.toast.taskUpdateError');
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
        <SidebarContainer width={sidebarWidth}>
          <SidebarHeader>{t('desktop.sidebar.header')}</SidebarHeader>
          <SidebarBody ref={sidebarBodyRef} onScroll={handleSidebarScroll}>
            <GanttSidebar groups={layout.groups} />
          </SidebarBody>
          <ResizeDivider isDragging={isResizingSidebar} onMouseDown={handleResizeStart} />
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
          <DragOverlayContent
            task={activeTask}
            barWidth={activeBarWidth}
            color={activeBarColor}
            scale={scale}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

import styled from '@emotion/styled';
import { Tooltip } from '@mui/material';
import { FC, useCallback, useState } from 'react';
import { useDndMonitor, useDraggable } from '@dnd-kit/core';
import { COLOR_PALETTE, GanttTask, TASK_ROW_HEIGHT } from '../hooks/use-gantt-layout';
import { TaskContextMenu } from './task-context-menu';

const BAR_HEIGHT = 22;
const BAR_TOP = (TASK_ROW_HEIGHT - BAR_HEIGHT) / 2;
const RESIZE_HANDLE_WIDTH = 6;

const BarWrapper = styled.div<{
  left: number;
  width: number;
}>`
  position: absolute;
  top: ${BAR_TOP}px;
  left: ${({ left }) => left}px;
  width: ${({ width }) => width}px;
  height: ${BAR_HEIGHT}px;
  z-index: 2;
`;

const BarContainer = styled.div<{
  color: string;
  isDragging: boolean;
}>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${({ color }) => color}33;
  border: 1px solid ${({ color }) => color};
  border-radius: 4px;
  cursor: grab;
  overflow: hidden;
  transition: box-shadow 0.15s;
  opacity: ${({ isDragging }) => (isDragging ? 0.4 : 1)};

  &:hover {
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  }

  &:active {
    cursor: grabbing;
  }
`;

const ResizeHandle = styled.div<{ side: 'left' | 'right' }>`
  position: absolute;
  top: 0;
  ${({ side }) => side}: 0;
  width: ${RESIZE_HANDLE_WIDTH}px;
  height: 100%;
  cursor: ${({ side }) => (side === 'left' ? 'w-resize' : 'e-resize')};
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s;

  &::after {
    content: '';
    width: 2px;
    height: 60%;
    border-radius: 1px;
    background-color: rgba(0, 0, 0, 0.3);
  }

  ${BarWrapper}:hover &,
  ${BarWrapper}[data-resizing] & {
    opacity: 1;
  }
`;

const ResizeEdgeIndicator = styled.div<{ side: 'left' | 'right'; color: string }>`
  position: absolute;
  top: -1px;
  bottom: -1px;
  ${({ side }) => side}: -1px;
  width: 3px;
  background-color: ${({ color }) => color};
  border-radius: ${({ side }) => (side === 'left' ? '4px 0 0 4px' : '0 4px 4px 0')};
  z-index: 4;
  pointer-events: none;
`;

const ProgressFill = styled.div<{ progress: number; color: string }>`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: ${({ progress }) => progress}%;
  background-color: ${({ color }) => color}88;
  border-radius: 3px 0 0 3px;
  transition: width 0.2s ease;
`;

const BarLabel = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  padding: 0 8px;
  font-size: 11px;
  color: #333;
  font-weight: 500;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  z-index: 1;
  pointer-events: none;
`;

function getColor(colorValue: string, colorMap: Map<string, string>): string {
  if (!colorValue) {
    return COLOR_PALETTE[0]!;
  }
  return colorMap.get(colorValue) ?? COLOR_PALETTE[0]!;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
}

interface GanttBarProps {
  task: GanttTask;
  left: number;
  width: number;
  colorMap: Map<string, string>;
}

const ResizeStartHandle: FC<{ task: GanttTask }> = ({ task }) => {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `resize-start-${task.id}`,
    data: { type: 'RESIZE_START', task },
  });

  return <ResizeHandle ref={setNodeRef} side='left' {...attributes} {...listeners} />;
};

const ResizeEndHandle: FC<{ task: GanttTask }> = ({ task }) => {
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: `resize-end-${task.id}`,
    data: { type: 'RESIZE_END', task },
  });

  return <ResizeHandle ref={setNodeRef} side='right' {...attributes} {...listeners} />;
};

export const GanttBar: FC<GanttBarProps> = ({ task, left, width, colorMap }) => {
  const color = getColor(task.colorValue, colorMap);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `bar-${task.id}`,
    data: { type: 'BAR', task },
  });

  // リサイズ中のリアルタイムビジュアルトラッキング
  const [resizeDelta, setResizeDelta] = useState(0);
  const [resizeSide, setResizeSide] = useState<'start' | 'end' | null>(null);

  useDndMonitor({
    onDragStart(event) {
      const data = event.active.data.current;
      if (!data || data.task?.id !== task.id) {
        return;
      }
      if (data.type === 'RESIZE_START') {
        setResizeSide('start');
      } else if (data.type === 'RESIZE_END') {
        setResizeSide('end');
      }
    },
    onDragMove(event) {
      const data = event.active.data.current;
      if (!data || data.task?.id !== task.id) {
        return;
      }
      if (data.type === 'RESIZE_START' || data.type === 'RESIZE_END') {
        setResizeDelta(event.delta.x);
      }
    },
    onDragEnd() {
      setResizeSide(null);
      setResizeDelta(0);
    },
    onDragCancel() {
      setResizeSide(null);
      setResizeDelta(0);
    },
  });

  const isResizing = resizeSide !== null;

  // リサイズ中のビジュアル調整
  let visualLeft = left;
  let visualWidth = width;
  if (resizeSide === 'start') {
    const clampedDelta = Math.min(resizeDelta, width - 4);
    visualLeft = left + clampedDelta;
    visualWidth = width - clampedDelta;
  } else if (resizeSide === 'end') {
    const clampedDelta = Math.max(resizeDelta, -(width - 4));
    visualWidth = width + clampedDelta;
  }

  const tooltipContent = (
    <div style={{ padding: 4, fontSize: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{task.title}</div>
      <div>
        {formatDate(task.startDate)} 〜 {formatDate(task.endDate)}
      </div>
      {task.assignees.length > 0 && <div>担当: {task.assignees.join(', ')}</div>}
      {task.categoryValues.filter(Boolean).length > 0 && (
        <div>カテゴリ: {task.categoryValues.filter(Boolean).join(' > ')}</div>
      )}
      {task.progress > 0 && <div>進捗: {task.progress}%</div>}
    </div>
  );

  const handleDoubleClick = useCallback(() => {
    if (task.id) {
      const url = `${location.pathname}show#record=${task.id}`;
      window.open(url, '_blank');
    }
  }, [task.id]);

  return (
    <TaskContextMenu task={task}>
      <Tooltip title={tooltipContent} placement='top' arrow>
        <BarWrapper
          left={visualLeft}
          width={visualWidth}
          {...(isResizing ? { 'data-resizing': '' } : {})}
        >
          <BarContainer
            ref={setNodeRef}
            color={color}
            isDragging={isDragging}
            onDoubleClick={handleDoubleClick}
            {...attributes}
            {...listeners}
          >
            <ProgressFill progress={task.progress} color={color} />
            <BarLabel>{visualWidth > 60 ? task.title : ''}</BarLabel>
          </BarContainer>
          {isResizing && (
            <ResizeEdgeIndicator side={resizeSide === 'start' ? 'left' : 'right'} color={color} />
          )}
          <ResizeStartHandle task={task} />
          <ResizeEndHandle task={task} />
        </BarWrapper>
      </Tooltip>
    </TaskContextMenu>
  );
};

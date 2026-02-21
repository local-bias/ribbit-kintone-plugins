import styled from '@emotion/styled';
import { FC, Fragment } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useAtomValue } from 'jotai';
import {
  DateColumn,
  GanttGroup,
  GROUP_HEADER_HEIGHT,
  TASK_ROW_HEIGHT,
} from '../hooks/use-gantt-layout';
import { GanttBar } from './gantt-bar';
import { collapsedGroupsAtom } from '../public-state';

const BodyContainer = styled.div`
  position: relative;
`;

const GroupSection = styled.div`
  position: relative;
`;

const GroupHeaderRow = styled.div`
  height: ${GROUP_HEADER_HEIGHT}px;
  display: flex;
  align-items: center;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  position: relative;
`;

const TaskRow = styled.div<{ isOver?: boolean }>`
  height: ${TASK_ROW_HEIGHT}px;
  position: relative;
  border-bottom: 1px solid #f0f0f0;
  background-color: ${({ isOver }) => (isOver ? 'rgba(66, 133, 244, 0.08)' : 'transparent')};

  &:hover {
    background-color: ${({ isOver }) =>
      isOver ? 'rgba(66, 133, 244, 0.12)' : 'rgba(66, 133, 244, 0.04)'};
  }
`;

const GridLine = styled.div<{ left: number; isWeekend: boolean }>`
  position: absolute;
  top: 0;
  bottom: 0;
  left: ${({ left }) => left}px;
  width: 1px;
  background-color: ${({ isWeekend }) => (isWeekend ? '#f0f0f0' : '#f5f5f5')};
  pointer-events: none;
`;

const TodayLine = styled.div<{ left: number }>`
  position: absolute;
  top: 0;
  bottom: 0;
  left: ${({ left }) => left}px;
  width: 2px;
  background-color: #ea4335;
  z-index: 5;
  pointer-events: none;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -3px;
    width: 8px;
    height: 8px;
    background-color: #ea4335;
    border-radius: 50%;
  }
`;

const WeekendBg = styled.div<{ left: number; width: number }>`
  position: absolute;
  top: 0;
  bottom: 0;
  left: ${({ left }) => left}px;
  width: ${({ width }) => width}px;
  background-color: rgba(0, 0, 0, 0.02);
  pointer-events: none;
`;

interface GanttBodyProps {
  groups: GanttGroup[];
  dateToX: (date: Date) => number;
  todayX: number;
  columnWidth: number;
  columns: DateColumn[];
  colorMap: Map<string, string>;
}

const DroppableGroupSection: FC<{
  group: GanttGroup;
  children: React.ReactNode;
}> = ({ group, children }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `timeline-group-${group.key}`,
    data: { type: 'GROUP', group },
  });

  return (
    <GroupSection
      ref={setNodeRef}
      style={isOver ? { backgroundColor: 'rgba(66, 133, 244, 0.04)' } : undefined}
    >
      {children}
    </GroupSection>
  );
};

export const GanttBody: FC<GanttBodyProps> = ({
  groups,
  dateToX,
  todayX,
  columnWidth,
  columns,
  colorMap,
}) => {
  const collapsedGroups = useAtomValue(collapsedGroupsAtom);

  return (
    <BodyContainer>
      {/* グリッド線と週末背景 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
        }}
      >
        {columns.map((col, i) => (
          <Fragment key={i}>
            <GridLine left={i * columnWidth} isWeekend={col.isWeekend} />
            {col.isWeekend && <WeekendBg left={i * columnWidth} width={columnWidth} />}
          </Fragment>
        ))}
        {todayX > 0 && <TodayLine left={todayX} />}
      </div>

      {/* グループとタスク */}
      {groups.map((group) => {
        const isCollapsed = collapsedGroups.has(group.key);
        return (
          <DroppableGroupSection key={group.key} group={group}>
            <GroupHeaderRow>
              <div
                style={{
                  position: 'absolute',
                  left: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#555',
                  zIndex: 2,
                }}
              >
                {group.label}（{group.tasks.length}）
              </div>
            </GroupHeaderRow>
            {!isCollapsed &&
              group.tasks.map((task) => {
                const barLeft = dateToX(task.startDate);
                const barRight = dateToX(task.endDate);
                const barWidth = Math.max(barRight - barLeft, 4);

                return (
                  <TaskRow key={task.id}>
                    <GanttBar task={task} left={barLeft} width={barWidth} colorMap={colorMap} />
                  </TaskRow>
                );
              })}
          </DroppableGroupSection>
        );
      })}
    </BodyContainer>
  );
};

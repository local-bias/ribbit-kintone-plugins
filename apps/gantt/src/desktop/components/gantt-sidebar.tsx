import styled from '@emotion/styled';
import { FC, ReactNode, useCallback } from 'react';
import { useAtom } from 'jotai';
import {
  GanttGroup,
  GanttTask,
  GROUP_HEADER_HEIGHT,
  TASK_ROW_HEIGHT,
} from '../hooks/use-gantt-layout';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { collapsedGroupsAtom } from '../public-state';
import { TaskContextMenu } from './task-context-menu';

const SidebarGroup = styled.div``;

const GroupHeader = styled.div`
  height: ${GROUP_HEADER_HEIGHT}px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  font-size: 12px;
  font-weight: 600;
  color: #555;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  cursor: pointer;
  user-select: none;
  gap: 4px;

  &:hover {
    background-color: #eee;
  }
`;

const CollapseIcon = styled.span<{ collapsed: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 10px;
  color: #888;
  transition: transform 0.15s ease;
  transform: ${({ collapsed }) => (collapsed ? 'rotate(-90deg)' : 'rotate(0deg)')};
  flex-shrink: 0;
`;

const TaskItem = styled.div`
  height: ${TASK_ROW_HEIGHT}px;
  display: flex;
  align-items: center;
  padding: 0 8px 0 16px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 12px;
  color: #333;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  cursor: grab;
  user-select: none;

  &:hover {
    background-color: rgba(66, 133, 244, 0.04);
  }

  &:active {
    cursor: grabbing;
  }
`;

interface GanttSidebarProps {
  groups: GanttGroup[];
}

const SortableTaskItem: FC<{ task: GanttTask }> = ({ task }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `sort-${task.id}`,
    data: { type: 'SORT_TASK', task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
    position: isDragging ? ('relative' as const) : undefined,
  };

  return (
    <TaskContextMenu task={task}>
      <TaskItem ref={setNodeRef} style={style} {...attributes} {...listeners} title={task.title}>
        {task.title}
      </TaskItem>
    </TaskContextMenu>
  );
};

const DroppableGroup: FC<{ group: GanttGroup; children: ReactNode }> = ({ group, children }) => {
  const { setNodeRef } = useDroppable({
    id: `group-${group.key}`,
    data: { type: 'GROUP', group },
  });
  return <SidebarGroup ref={setNodeRef}>{children}</SidebarGroup>;
};

export const GanttSidebar: FC<GanttSidebarProps> = ({ groups }) => {
  const [collapsedGroups, setCollapsedGroups] = useAtom(collapsedGroupsAtom);

  const toggleCollapse = useCallback(
    (key: string) => {
      setCollapsedGroups((prev: Set<string>) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        return next;
      });
    },
    [setCollapsedGroups]
  );

  return (
    <div>
      {groups.map((group) => {
        const isCollapsed = collapsedGroups.has(group.key);
        return (
          <DroppableGroup key={group.key} group={group}>
            <GroupHeader title={group.label} onClick={() => toggleCollapse(group.key)}>
              <CollapseIcon collapsed={isCollapsed}>▼</CollapseIcon>
              {group.label}（{group.tasks.length}）
            </GroupHeader>
            {!isCollapsed && (
              <SortableContext
                id={group.key}
                items={group.tasks.map((t) => `sort-${t.id}`)}
                strategy={verticalListSortingStrategy}
              >
                {group.tasks.map((task) => (
                  <SortableTaskItem key={task.id} task={task} />
                ))}
              </SortableContext>
            )}
          </DroppableGroup>
        );
      })}
    </div>
  );
};

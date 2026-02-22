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

const INDENT_PER_LEVEL = 16;

const SidebarGroup = styled.div``;

const GroupHeader = styled.div<{ depth: number; isParent: boolean }>`
  height: ${GROUP_HEADER_HEIGHT}px;
  display: flex;
  align-items: center;
  padding: 0 8px 0 ${({ depth }) => 8 + depth * INDENT_PER_LEVEL}px;
  background-color: ${({ isParent }) => (isParent ? '#eee' : '#f5f5f5')};
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
    background-color: ${({ isParent }) => (isParent ? '#e4e4e4' : '#eee')};
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

const TaskItem = styled.div<{ depth: number }>`
  height: ${TASK_ROW_HEIGHT}px;
  display: flex;
  align-items: center;
  padding: 0 8px 0 ${({ depth }) => 16 + depth * INDENT_PER_LEVEL}px;
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

const SortableTaskItem: FC<{ task: GanttTask; depth: number }> = ({ task, depth }) => {
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
      <TaskItem
        ref={setNodeRef}
        style={style}
        depth={depth}
        {...attributes}
        {...listeners}
        title={task.title}
      >
        {task.title}
      </TaskItem>
    </TaskContextMenu>
  );
};

const DroppableGroup: FC<{ group: GanttGroup; children: ReactNode }> = ({ group, children }) => {
  const { setNodeRef } = useDroppable({
    id: `group-${group.key}`,
    data: { type: 'GROUP', group },
    disabled: group.isParent,
  });
  return <SidebarGroup ref={setNodeRef}>{children}</SidebarGroup>;
};

/** タスク数をカウント（親グループの場合は再帰的にカウント） */
function countGroupTasks(group: GanttGroup, allGroups: GanttGroup[]): number {
  if (!group.isParent) {
    return group.tasks.length;
  }
  // 親グループの直下の子グループのタスク数を合計
  let count = 0;
  let foundSelf = false;
  for (const g of allGroups) {
    if (g.key === group.key) {
      foundSelf = true;
      continue;
    }
    if (foundSelf) {
      if (g.depth <= group.depth) {
        break;
      }
      if (!g.isParent) {
        count += g.tasks.length;
      }
    }
  }
  return count;
}

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

  // 折りたたまれた親の子グループを非表示にする
  const isGroupVisible = useCallback(
    (group: GanttGroup, index: number): boolean => {
      // 親グループの折りたたみチェック
      for (let i = index - 1; i >= 0; i--) {
        const ancestor = groups[i]!;
        if (ancestor.depth < group.depth) {
          if (collapsedGroups.has(ancestor.key)) {
            return false;
          }
          if (ancestor.depth === 0) {
            break;
          }
        }
      }
      return true;
    },
    [groups, collapsedGroups]
  );

  return (
    <div>
      {groups.map((group, index) => {
        if (!isGroupVisible(group, index)) {
          return null;
        }
        const isCollapsed = collapsedGroups.has(group.key);
        const taskCount = countGroupTasks(group, groups);
        return (
          <DroppableGroup key={group.key} group={group}>
            <GroupHeader
              depth={group.depth}
              isParent={group.isParent}
              title={group.label}
              onClick={() => toggleCollapse(group.key)}
            >
              <CollapseIcon collapsed={isCollapsed}>▼</CollapseIcon>
              {group.label}（{taskCount}）
            </GroupHeader>
            {!isCollapsed && !group.isParent && (
              <SortableContext
                id={group.key}
                items={group.tasks.map((t) => `sort-${t.id}`)}
                strategy={verticalListSortingStrategy}
              >
                {group.tasks.map((task) => (
                  <SortableTaskItem key={task.id} task={task} depth={group.depth} />
                ))}
              </SortableContext>
            )}
          </DroppableGroup>
        );
      })}
    </div>
  );
};

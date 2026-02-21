import { GanttScale } from '@/schema/plugin-config';
import styled from '@emotion/styled';
import { useAtom, useSetAtom } from 'jotai';
import { FC } from 'react';
import {
  addTaskDialogOpenAtom,
  ganttGroupByAtom,
  ganttScaleAtom,
  ganttViewDateAtom,
} from '../public-state';

const ToolbarContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #fafafa;
  flex-wrap: wrap;
`;

const ButtonGroup = styled.div`
  display: flex;
  border: 1px solid #ccc;
  border-radius: 4px;
  overflow: hidden;
`;

const GroupButton = styled.button<{ active?: boolean }>`
  padding: 4px 12px;
  border: none;
  border-right: 1px solid #ccc;
  background-color: ${({ active }) => (active ? '#4285F4' : '#fff')};
  color: ${({ active }) => (active ? '#fff' : '#333')};
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  line-height: 20px;
  transition: background-color 0.15s;

  &:last-child {
    border-right: none;
  }

  &:hover {
    background-color: ${({ active }) => (active ? '#3367d6' : '#f0f0f0')};
  }
`;

const ActionButton = styled.button`
  padding: 4px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #fff;
  color: #333;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  line-height: 20px;
  transition: background-color 0.15s;

  &:hover {
    background-color: #f0f0f0;
  }
`;

const AddButton = styled.button`
  padding: 4px 12px;
  border: 1px solid #4285f4;
  border-radius: 4px;
  background-color: #4285f4;
  color: #fff;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  line-height: 20px;
  transition: background-color 0.15s;

  &:hover {
    background-color: #3367d6;
  }
`;

const NavButton = styled.button`
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #fff;
  color: #333;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  transition: background-color 0.15s;
  min-width: 28px;

  &:hover {
    background-color: #f0f0f0;
  }
`;

const Separator = styled.div`
  width: 1px;
  height: 24px;
  background-color: #e0e0e0;
  margin: 0 4px;
`;

const Spacer = styled.div`
  flex: 1;
`;

function getNavigationDelta(scale: GanttScale): number {
  switch (scale) {
    case 'day':
      return 7;
    case 'week':
      return 28;
    case 'month':
      return 90;
  }
}

export const GanttToolbar: FC = () => {
  const [scale, setScale] = useAtom(ganttScaleAtom);
  const [groupBy, setGroupBy] = useAtom(ganttGroupByAtom);
  const [viewDate, setViewDate] = useAtom(ganttViewDateAtom);
  const setDialogOpen = useSetAtom(addTaskDialogOpenAtom);

  const handleToday = () => {
    setViewDate(new Date());
  };

  const handlePrev = () => {
    const delta = getNavigationDelta(scale);
    const newDate = new Date(viewDate);
    newDate.setDate(newDate.getDate() - delta);
    setViewDate(newDate);
  };

  const handleNext = () => {
    const delta = getNavigationDelta(scale);
    const newDate = new Date(viewDate);
    newDate.setDate(newDate.getDate() + delta);
    setViewDate(newDate);
  };

  return (
    <ToolbarContainer>
      <ActionButton onClick={handleToday}>今日</ActionButton>
      <NavButton onClick={handlePrev}>‹</NavButton>
      <NavButton onClick={handleNext}>›</NavButton>
      <Separator />
      <ButtonGroup>
        <GroupButton active={scale === 'day'} onClick={() => setScale('day')}>
          日
        </GroupButton>
        <GroupButton active={scale === 'week'} onClick={() => setScale('week')}>
          週
        </GroupButton>
        <GroupButton active={scale === 'month'} onClick={() => setScale('month')}>
          月
        </GroupButton>
      </ButtonGroup>
      <Separator />
      <ButtonGroup>
        <GroupButton active={groupBy === 'category'} onClick={() => setGroupBy('category')}>
          カテゴリ
        </GroupButton>
        <GroupButton active={groupBy === 'assignee'} onClick={() => setGroupBy('assignee')}>
          担当者
        </GroupButton>
      </ButtonGroup>
      <Spacer />
      <AddButton onClick={() => setDialogOpen(true)}>＋ 新規タスク</AddButton>
    </ToolbarContainer>
  );
};

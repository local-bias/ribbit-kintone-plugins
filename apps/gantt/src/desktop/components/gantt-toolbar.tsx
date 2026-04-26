import styled from '@emotion/styled';
import {
  ToolbarActionButton,
  ToolbarAddButton,
  ToolbarButtonGroup,
  ToolbarContainer,
  ToolbarGroupButton,
  ToolbarNavButton,
  ToolbarSearchClear,
  ToolbarSearchIcon,
  ToolbarSearchInput,
  ToolbarSearchWrapper,
  ToolbarSeparator,
  ToolbarSpacer,
} from '@repo/ui';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { ListChevronsDownUp, ListChevronsUpDown } from 'lucide-react';
import { type FC, useCallback, useRef } from 'react';
import { t } from '@/lib/i18n';
import type { GanttScale } from '@/schema/plugin-config';
import {
  addTaskDialogOpenAtom,
  allGroupKeysAtom,
  collapsedGroupsAtom,
  ganttGroupByAtom,
  ganttScaleAtom,
  ganttScrollMaxAtom,
  ganttScrollXAtom,
  ganttViewDateAtom,
} from '../public-state';

const PeriodLabel = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: #333;
  min-width: 80px;
  text-align: center;
  user-select: none;
`;

const ExpandCollapseButton = styled.button<{ title?: string }>`
  padding: 4px 6px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #fff;
  color: #666;
  cursor: pointer;
  font-size: 14px;
  line-height: 20px;
  transition: background-color 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;

  &:hover {
    background-color: #f0f0f0;
    color: #333;
  }
`;

const ScrollSliderWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 100px;
  max-width: 180px;
  flex: 1 1 100px;
`;

const ScrollSlider = styled.input`
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: #d0d0d0;
  outline: none;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: #b8b8b8;
  }

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #4285f4;
    cursor: pointer;
    transition: background 0.15s;
  }

  &::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border: none;
    border-radius: 50%;
    background: #4285f4;
    cursor: pointer;
  }
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

function getPeriodLabel(viewDate: Date, scale: GanttScale): string {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth() + 1;
  if (scale === 'month') {
    return t('desktop.toolbar.period.year', String(year));
  }
  return t('desktop.toolbar.period.month', String(year), String(month));
}

export const GanttToolbar: FC = () => {
  const [scale, setScale] = useAtom(ganttScaleAtom);
  const [groupBy, setGroupBy] = useAtom(ganttGroupByAtom);
  const [viewDate, setViewDate] = useAtom(ganttViewDateAtom);
  const [scrollX, setScrollX] = useAtom(ganttScrollXAtom);
  const scrollMax = useAtomValue(ganttScrollMaxAtom);
  const setDialogOpen = useSetAtom(addTaskDialogOpenAtom);
  const setCollapsedGroups = useSetAtom(collapsedGroupsAtom);
  const allGroupKeys = useAtomValue(allGroupKeysAtom);

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

  const handleExpandAll = useCallback(() => {
    setCollapsedGroups(new Set<string>());
  }, [setCollapsedGroups]);

  const handleCollapseAll = useCallback(() => {
    setCollapsedGroups(new Set(allGroupKeys));
  }, [setCollapsedGroups, allGroupKeys]);

  return (
    <ToolbarContainer>
      <ToolbarActionButton onClick={handleToday}>{t('desktop.toolbar.today')}</ToolbarActionButton>
      <ToolbarNavButton onClick={handlePrev}>‹</ToolbarNavButton>
      <ToolbarNavButton onClick={handleNext}>›</ToolbarNavButton>
      <PeriodLabel>{getPeriodLabel(viewDate, scale)}</PeriodLabel>
      <ToolbarSeparator />
      <ToolbarButtonGroup>
        <ToolbarGroupButton active={scale === 'day'} onClick={() => setScale('day')}>
          {t('desktop.scale.day')}
        </ToolbarGroupButton>
        <ToolbarGroupButton active={scale === 'week'} onClick={() => setScale('week')}>
          {t('desktop.scale.week')}
        </ToolbarGroupButton>
        <ToolbarGroupButton active={scale === 'month'} onClick={() => setScale('month')}>
          {t('desktop.scale.month')}
        </ToolbarGroupButton>
      </ToolbarButtonGroup>
      <ToolbarSeparator />
      <ToolbarButtonGroup>
        <ToolbarGroupButton active={groupBy === 'category'} onClick={() => setGroupBy('category')}>
          {t('desktop.groupBy.category')}
        </ToolbarGroupButton>
        <ToolbarGroupButton active={groupBy === 'assignee'} onClick={() => setGroupBy('assignee')}>
          {t('desktop.groupBy.assignee')}
        </ToolbarGroupButton>
      </ToolbarButtonGroup>
      <ExpandCollapseButton onClick={handleExpandAll} title={t('desktop.toolbar.expandAll')}>
        <ListChevronsUpDown style={{ width: '1.25em', height: '1.25em' }} />
      </ExpandCollapseButton>
      <ExpandCollapseButton onClick={handleCollapseAll} title={t('desktop.toolbar.collapseAll')}>
        <ListChevronsDownUp style={{ width: '1.25em', height: '1.25em' }} />
      </ExpandCollapseButton>
      <ToolbarSpacer />
      {scrollMax > 0 && (
        <ScrollSliderWrapper>
          <ScrollSlider
            type='range'
            min={0}
            max={scrollMax}
            step={1}
            value={scrollX}
            onChange={(e) => setScrollX(Number(e.target.value))}
            title={t('desktop.toolbar.scrollSlider')}
          />
        </ScrollSliderWrapper>
      )}
      <ToolbarSearchWrapper>
        <ToolbarSearchIcon>🔍</ToolbarSearchIcon>
        <ToolbarSearchInput disabled type='text' placeholder={t('desktop.search.placeholder')} />
      </ToolbarSearchWrapper>
      <ToolbarAddButton onClick={() => setDialogOpen(true)}>
        {t('desktop.toolbar.addTask')}
      </ToolbarAddButton>
    </ToolbarContainer>
  );
};

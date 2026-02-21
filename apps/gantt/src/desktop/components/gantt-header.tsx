import styled from '@emotion/styled';
import { FC } from 'react';
import { DateColumn, HEADER_HEIGHT } from '../hooks/use-gantt-layout';

const HeaderContainer = styled.div`
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: #fafafa;
  border-bottom: 1px solid #e0e0e0;
  height: ${HEADER_HEIGHT}px;
  display: flex;
  flex-direction: column;
`;

const MonthRow = styled.div`
  display: flex;
  height: 24px;
  position: relative;
`;

const MonthLabel = styled.div<{ width: number }>`
  width: ${({ width }) => width}px;
  min-width: ${({ width }) => width}px;
  display: flex;
  align-items: center;
  padding-left: 8px;
  font-size: 11px;
  font-weight: 600;
  color: #555;
  border-right: 1px solid #e0e0e0;
  border-bottom: 1px solid #eee;
  box-sizing: border-box;
  overflow: hidden;
  white-space: nowrap;
`;

const DayRow = styled.div`
  display: flex;
  flex: 1;
`;

const DayCell = styled.div<{ width: number; isToday: boolean; isWeekend: boolean }>`
  width: ${({ width }) => width}px;
  min-width: ${({ width }) => width}px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: ${({ isToday, isWeekend }) => (isToday ? '#4285F4' : isWeekend ? '#999' : '#666')};
  font-weight: ${({ isToday }) => (isToday ? 700 : 400)};
  border-right: 1px solid #eee;
  box-sizing: border-box;
  background-color: ${({ isToday }) => (isToday ? 'rgba(66, 133, 244, 0.08)' : 'transparent')};
`;

interface GanttHeaderProps {
  columns: DateColumn[];
  columnWidth: number;
}

export const GanttHeader: FC<GanttHeaderProps> = ({ columns, columnWidth }) => {
  // 月ラベルのスパン計算
  const monthSpans: Array<{ label: string; span: number }> = [];
  let currentMonthLabel = '';
  let currentSpan = 0;

  for (const col of columns) {
    if (col.monthLabel && col.monthLabel !== currentMonthLabel) {
      if (currentSpan > 0) {
        monthSpans.push({ label: currentMonthLabel, span: currentSpan });
      }
      currentMonthLabel = col.monthLabel;
      currentSpan = 1;
    } else {
      currentSpan++;
    }
  }
  if (currentSpan > 0) {
    monthSpans.push({ label: currentMonthLabel, span: currentSpan });
  }

  return (
    <HeaderContainer>
      <MonthRow>
        {monthSpans.map((ms, i) => (
          <MonthLabel key={i} width={ms.span * columnWidth}>
            {ms.label}
          </MonthLabel>
        ))}
      </MonthRow>
      <DayRow>
        {columns.map((col, i) => (
          <DayCell key={i} width={columnWidth} isToday={col.isToday} isWeekend={col.isWeekend}>
            {col.label}
          </DayCell>
        ))}
      </DayRow>
    </HeaderContainer>
  );
};

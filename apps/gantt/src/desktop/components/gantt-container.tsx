import styled from '@emotion/styled';
import { useAtomValue } from 'jotai';
import { FC } from 'react';
import { currentConditionAtom, ganttLoadingAtom, ganttRecordsAtom } from '../public-state';
import { AddTaskDialog } from './add-task-dialog';
import { GanttChart } from './gantt-chart';
import { GanttToolbar } from './gantt-toolbar';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 400px;
  background-color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
  color: #333;
`;

const LoadingOverlay = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 64px 0;
  color: #888;
  font-size: 14px;
`;

const EmptyMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 64px 0;
  color: #888;
  font-size: 14px;
`;

export const GanttContainer: FC = () => {
  const condition = useAtomValue(currentConditionAtom);
  const records = useAtomValue(ganttRecordsAtom);
  const loading = useAtomValue(ganttLoadingAtom);

  if (!condition) {
    return null;
  }

  return (
    <Container className='🐸'>
      <GanttToolbar />
      {loading ? (
        <LoadingOverlay>レコードを読み込んでいます...</LoadingOverlay>
      ) : records.length === 0 ? (
        <EmptyMessage>表示するレコードがありません</EmptyMessage>
      ) : (
        <GanttChart />
      )}
      <AddTaskDialog />
    </Container>
  );
};

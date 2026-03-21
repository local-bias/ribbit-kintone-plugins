import { t } from '@/lib/i18n';
import styled from '@emotion/styled';
import { EmptyState } from '@repo/ui';
import { useAtomValue } from 'jotai';
import { FC } from 'react';
import { currentConditionAtom, ganttLoadingAtom, ganttRecordsAtom } from '../public-state';
import { AddTaskDialog } from './add-task-dialog';
import { EditRecordDialog } from './edit-record-dialog';
import { GanttChart } from './gantt-chart';
import { GanttToolbar } from './gantt-toolbar';
import { SkeletonLoader } from './skeleton-loader';

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

function GanttContent() {
  const records = useAtomValue(ganttRecordsAtom);
  const loading = useAtomValue(ganttLoadingAtom);

  if (loading) {
    return <SkeletonLoader />;
  }
  if (records.length === 0) {
    return <EmptyState message={t('desktop.noRecords')} />;
  }
  return <GanttChart />;
}

export const GanttContainer: FC = () => {
  const condition = useAtomValue(currentConditionAtom);

  if (!condition) {
    return null;
  }

  return (
    <Container className='🐸'>
      <GanttToolbar />
      <GanttContent />
      <AddTaskDialog />
      <EditRecordDialog />
    </Container>
  );
};

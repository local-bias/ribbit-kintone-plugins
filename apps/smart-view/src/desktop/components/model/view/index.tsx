import { errorAtom, viewTypeAtom } from '@/desktop/states/plugin';
import { isOriginalTableShownAtom } from '@/desktop/states/records';
import { useAtomValue } from 'jotai';
import { PropsWithChildren } from 'react';
import TableView from '../table';
import CardView from '../view-card';
import EmptyStateView from './empty';
import ErrorNofitication from './error';

function ErrorGuard({ children }: PropsWithChildren) {
  const error = useAtomValue(errorAtom);
  if (error) {
    return <ErrorNofitication />;
  }
  return children;
}

function EmptyGuard({ children }: PropsWithChildren) {
  const isOriginalTableShown = useAtomValue(isOriginalTableShownAtom);
  if (!isOriginalTableShown) {
    return <EmptyStateView />;
  }
  return children;
}

function ViewTypeSwitcher() {
  const viewType = useAtomValue(viewTypeAtom);
  if (viewType === 'card') {
    return <CardView />;
  }
  return <TableView />;
}

export default function View() {
  return (
    <ErrorGuard>
      <EmptyGuard>
        <ViewTypeSwitcher />
      </EmptyGuard>
    </ErrorGuard>
  );
}

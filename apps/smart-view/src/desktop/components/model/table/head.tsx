import { Skeleton } from '@mui/material';
import { useAtomValue } from 'jotai';
import { Suspense } from 'react';
import { headerCellsAtom } from '../../../states/header-cells';
import { errorAtom, pluginConditionAtom } from '../../../states/plugin';
import { MyTableHead } from './layout';

function RecordTableHeaderComponent() {
  const cells = useAtomValue(headerCellsAtom);

  return (
    <>
      {cells.map(({ label }, i) => (
        <th key={i}>{label}</th>
      ))}
    </>
  );
}

function RecordTableHeaderPlaceholder() {
  const condition = useAtomValue(pluginConditionAtom);

  let colCount = condition?.viewFields.length ?? 6;

  return (
    <>
      {new Array(colCount).fill('').map((_, i) => (
        <th key={i}>
          <Skeleton variant='text' />
        </th>
      ))}
    </>
  );
}

export default function RecordTableHead() {
  const error = useAtomValue(errorAtom);

  if (error) {
    return null;
  }

  return (
    <MyTableHead sticky={48}>
      <tr>
        <th></th>
        <Suspense fallback={<RecordTableHeaderPlaceholder />}>
          <RecordTableHeaderComponent />
        </Suspense>
      </tr>
    </MyTableHead>
  );
}

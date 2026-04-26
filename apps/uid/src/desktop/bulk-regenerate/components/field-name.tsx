import { useAtomValue } from 'jotai';
import { type FC, Suspense } from 'react';
import { currentAppFieldsAtom } from '@/desktop/public-state';
import { useCondition } from './condition-context';

const FieldNameComponent: FC = () => {
  const { condition } = useCondition();
  const fields = useAtomValue(currentAppFieldsAtom);
  return (
    <>{fields.find((field) => field.code === condition.fieldCode)?.label ?? condition.fieldCode}</>
  );
};

export const FieldName: FC = () => {
  const { condition } = useCondition();

  return (
    <Suspense fallback={<>{condition.fieldCode}</>}>
      <FieldNameComponent />
    </Suspense>
  );
};

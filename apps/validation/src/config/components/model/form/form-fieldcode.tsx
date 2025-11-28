import { currentAppFieldsAtom } from '@/config/states/kintone';
import { getConditionPropertyAtom } from '@/config/states/plugin';
import { JotaiFieldSelect } from '@konomi-app/kintone-utilities-jotai';
import { Skeleton } from '@mui/material';
import { useAtomValue } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import { Suspense, useCallback } from 'react';

const fieldCodeAtom = getConditionPropertyAtom('fieldCode');

function FieldCodeFormContent() {
  const value = useAtomValue(fieldCodeAtom);

  const onChange = useAtomCallback(
    useCallback((_, set, value: string) => {
      set(fieldCodeAtom, value);
    }, [])
  );

  return (
    <JotaiFieldSelect
      fieldPropertiesAtom={currentAppFieldsAtom}
      fieldCode={value}
      onChange={onChange}
    />
  );
}

function FieldCodeFormPlaceholder() {
  return <Skeleton variant='rounded' width={350} height={56} />;
}

export default function FieldCodeForm() {
  return (
    <Suspense fallback={<FieldCodeFormPlaceholder />}>
      <FieldCodeFormContent />
    </Suspense>
  );
}

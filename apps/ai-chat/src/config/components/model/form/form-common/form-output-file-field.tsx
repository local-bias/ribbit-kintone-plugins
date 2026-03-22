import { outputAppFilePropertiesState } from '@/config/states/kintone';
import { outputFileFieldCodeAtom } from '@/config/states/plugin';
import { Skeleton } from '@mui/material';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { Suspense } from 'react';
import { AutocompleteFieldInput } from './autocomplete-field-input';

const handleFieldCodeChangeAtom = atom(null, (_, set, value: string) => {
  set(outputFileFieldCodeAtom, value);
});

function FormOutputFileFieldComponent() {
  const fields = useAtomValue(outputAppFilePropertiesState);
  const fieldCode = useAtomValue(outputFileFieldCodeAtom);
  const onFieldChange = useSetAtom(handleFieldCodeChangeAtom);

  return (
    <AutocompleteFieldInput fields={fields} fieldCode={fieldCode ?? ''} onChange={onFieldChange} />
  );
}

export default function FormOutputFileField() {
  return (
    <Suspense fallback={<Skeleton variant='rounded' width={350} height={56} />}>
      <FormOutputFileFieldComponent />
    </Suspense>
  );
}

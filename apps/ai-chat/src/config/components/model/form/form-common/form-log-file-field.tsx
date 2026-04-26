import { Skeleton } from '@mui/material';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { Suspense } from 'react';
import { logAppFilePropertiesState } from '@/config/states/kintone';
import { logAppFileFieldCodeAtom } from '@/config/states/plugin';
import { AutocompleteFieldInput } from './autocomplete-field-input';

const handleFieldCodeChangeAtom = atom(null, (_, set, value: string) => {
  set(logAppFileFieldCodeAtom, value);
});

function FormLogFileFieldComponent() {
  const fields = useAtomValue(logAppFilePropertiesState);
  const fieldCode = useAtomValue(logAppFileFieldCodeAtom);
  const onFieldChange = useSetAtom(handleFieldCodeChangeAtom);

  return (
    <AutocompleteFieldInput fields={fields} fieldCode={fieldCode ?? ''} onChange={onFieldChange} />
  );
}

export default function FormLogFileField() {
  return (
    <Suspense fallback={<Skeleton variant='rounded' width={350} height={56} />}>
      <FormLogFileFieldComponent />
    </Suspense>
  );
}

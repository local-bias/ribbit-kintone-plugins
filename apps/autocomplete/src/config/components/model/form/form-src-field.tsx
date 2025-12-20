import { JotaiFieldSelect } from '@konomi-app/kintone-utilities-jotai';
import { Skeleton, TextField } from '@mui/material';
import { useAtom } from 'jotai';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { srcAppFieldsState } from '../../../states/kintone';
import { srcFieldCodeAtom } from '../../../states/plugin';

function SrcFieldFormComponent() {
  const [fieldCode, onChange] = useAtom(srcFieldCodeAtom);

  return (
    <JotaiFieldSelect
      fieldPropertiesAtom={srcAppFieldsState}
      fieldCode={fieldCode}
      onChange={onChange}
    />
  );
}

function SrcFieldForm() {
  return (
    <ErrorBoundary
      FallbackComponent={({ error }) => (
        <TextField
          error
          label='対象フィールド'
          variant='outlined'
          color='primary'
          helperText={`フィールド情報の取得に失敗しました: ${error.message}`}
        />
      )}
    >
      <Suspense fallback={<Skeleton variant='rounded' width={350} height={56} />}>
        <SrcFieldFormComponent />
      </Suspense>
    </ErrorBoundary>
  );
}

export default SrcFieldForm;

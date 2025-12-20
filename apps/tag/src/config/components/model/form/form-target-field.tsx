import { Autocomplete, Skeleton, TextField } from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import { FC, memo, Suspense } from 'react';
import { textFieldsAtom } from '../../../states/kintone';
import { getConditionPropertyAtom } from '../../../states/plugin';

const state = getConditionPropertyAtom('targetField');

const Component: FC = () => {
  const targetField = useAtomValue(state);
  const setTargetField = useSetAtom(state);
  const fields = useAtomValue(textFieldsAtom);

  const onFieldChange = (value: string) => {
    setTargetField(value);
  };

  return (
    <div>
      <Autocomplete
        value={fields.find((field) => field.code === targetField) ?? null}
        sx={{ width: '350px' }}
        options={fields}
        isOptionEqualToValue={(option, v) => option.code === v.code}
        getOptionLabel={(option) => `${option.label}(${option.code})`}
        onChange={(_, field) => onFieldChange(field?.code ?? '')}
        renderInput={(params) => (
          <TextField
            {...params}
            label='フィールド名(フィールドコード)'
            variant='outlined'
            color='primary'
          />
        )}
      />
    </div>
  );
};

const Container: FC = () => {
  return (
    <Suspense
      fallback={
        <div>
          <Skeleton variant='rounded' width={360} height={56} />
        </div>
      }
    >
      <Component />
    </Suspense>
  );
};

export default memo(Container);

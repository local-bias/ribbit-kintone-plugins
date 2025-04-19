import { currentAppSpaceFieldsAtom } from '@/config/states/kintone';
import { getConditionPropertyAtom } from '@/config/states/plugin';
import { Autocomplete, Skeleton, TextField } from '@mui/material';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { FC, Suspense } from 'react';

const spaceIdAtom = getConditionPropertyAtom('targetSpaceId');

const handleSpaceIdChange = atom(null, (_, set, newValue: string) => {
  set(spaceIdAtom, newValue);
});

const Component: FC = () => {
  const spaces = useAtomValue(currentAppSpaceFieldsAtom);
  const spaceId = useAtomValue(spaceIdAtom);
  const onChange = useSetAtom(handleSpaceIdChange);

  return (
    <Autocomplete
      value={spaces.find((field) => field.elementId === spaceId) ?? null}
      sx={{ width: '350px' }}
      options={spaces}
      isOptionEqualToValue={(option, v) => option.elementId === v.elementId}
      getOptionLabel={(option) => `${option.elementId}`}
      onChange={(_, field) => onChange(field?.elementId ?? '')}
      renderInput={(params) => (
        <TextField {...params} label='対象スペース' variant='outlined' color='primary' />
      )}
    />
  );
};

const PlaceHolder: FC = () => {
  return <Skeleton variant='rounded' width={350} height={56} />;
};

const TargetSpaceIdForm: FC = () => {
  return (
    <Suspense fallback={<PlaceHolder />}>
      <Component />
    </Suspense>
  );
};

export default TargetSpaceIdForm;

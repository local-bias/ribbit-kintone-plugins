import { Autocomplete, Skeleton, TextField } from '@mui/material';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { Suspense } from 'react';
import { getConditionPropertyAtom } from '@/config/states/plugin';
import { OPENAI_MODELS } from '@/lib/constants';

const aiModelAtom = getConditionPropertyAtom('aiModel');

const handleModelChangeAtom = atom(null, (_, set, __: unknown, value: string | null) => {
  if (!value) {
    return;
  }
  set(aiModelAtom, value);
});

function AiModelFormComponent() {
  const aiModel = useAtomValue(aiModelAtom);
  const onModelChange = useSetAtom(handleModelChangeAtom);

  return (
    <Autocomplete
      value={aiModel}
      freeSolo
      sx={{ width: '350px' }}
      options={[...OPENAI_MODELS]}
      getOptionLabel={(option) => option}
      onChange={onModelChange}
      renderInput={(params) => (
        <TextField
          {...params}
          label='モデル名'
          onChange={(e) => onModelChange(null, e.target.value)}
          variant='outlined'
          color='primary'
        />
      )}
    />
  );
}

export default function AiModelForm() {
  return (
    <Suspense fallback={<Skeleton variant='rounded' height={56} width={350} />}>
      <AiModelFormComponent />
    </Suspense>
  );
}

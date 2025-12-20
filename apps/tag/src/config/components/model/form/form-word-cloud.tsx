import { customizeViewsAtom } from '@/config/states/kintone';
import { getConditionPropertyAtom } from '@/config/states/plugin';
import { Autocomplete, Skeleton, TextField } from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import { FC, memo, Suspense } from 'react';

const state = getConditionPropertyAtom('wordCloudViewId');

const Component: FC = () => {
  const views = useAtomValue(customizeViewsAtom);
  const viewId = useAtomValue(state);
  const setViewId = useSetAtom(state);

  const onViewIdChange = (value: string) => {
    setViewId(value);
  };

  return (
    <div>
      <Autocomplete
        value={views.find((view) => view.id === viewId) ?? null}
        sx={{ width: '250px' }}
        options={views}
        isOptionEqualToValue={(view, v) => view.id === v.id}
        getOptionLabel={(view) => `${view.name}`}
        onChange={(_, view) => onViewIdChange(view?.id ?? '')}
        renderInput={(params) => (
          <TextField {...params} label='一覧の名前' variant='outlined' color='primary' />
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
          <Skeleton variant='rounded' width={250} height={56} />
        </div>
      }
    >
      <Component />
    </Suspense>
  );
};

export default memo(Container);

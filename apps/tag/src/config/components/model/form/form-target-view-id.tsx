import { allViewsAtom } from '@/config/states/kintone';
import { getConditionPropertyAtom } from '@/config/states/plugin';
import { MenuItem, Skeleton, TextField } from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import { ChangeEventHandler, FC, memo, Suspense } from 'react';

const state = getConditionPropertyAtom('targetViewId');

const Component: FC = () => {
  const views = useAtomValue(allViewsAtom);
  const viewId = useAtomValue(state);
  const setViewId = useSetAtom(state);

  const onChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setViewId(e.target.value);
  };

  return (
    <div>
      <TextField select label='一覧の名前' value={viewId} {...{ onChange }} sx={{ width: '250px' }}>
        {Object.entries(views).map(([name, { id }], i) => (
          <MenuItem key={i} value={id}>
            {name}
          </MenuItem>
        ))}
      </TextField>
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

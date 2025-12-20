import { FormControlLabel, Skeleton, Switch } from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import { FC, memo, Suspense } from 'react';
import { getConditionPropertyAtom } from '../../../states/plugin';

const state = getConditionPropertyAtom('hideConfigField');

const Component: FC = () => {
  const hideConfigField = useAtomValue(state);
  const setHideConfigField = useSetAtom(state);

  const onChange = (value: boolean) => {
    setHideConfigField(value);
  };

  return (
    <div>
      <FormControlLabel
        control={<Switch color='primary' checked={!!hideConfigField} />}
        onChange={(_, checked) => onChange(checked)}
        label='タグの設定情報フィールドを非表示にする'
      />
    </div>
  );
};

const Container: FC = () => {
  return (
    <Suspense
      fallback={
        <div>
          <Skeleton width={360} height={56} />
        </div>
      }
    >
      <Component />
    </Suspense>
  );
};

export default memo(Container);

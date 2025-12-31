import { FormControlLabel, Skeleton, Switch } from '@mui/material';
import { useAtomValue, useSetAtom } from 'jotai';
import { FC, memo, Suspense } from 'react';
import { getConditionPropertyAtom } from '../../../states/plugin';

const state = getConditionPropertyAtom('enableSuggestion');

const Component: FC = () => {
  const enableSuggestion = useAtomValue(state);
  const setEnableSuggestion = useSetAtom(state);

  const onChange = (value: boolean) => {
    setEnableSuggestion(value);
  };

  return (
    <div>
      <FormControlLabel
        control={<Switch color='primary' checked={!!enableSuggestion} />}
        onChange={(_, checked) => onChange(checked)}
        label='タグサジェスト機能を有効にする'
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

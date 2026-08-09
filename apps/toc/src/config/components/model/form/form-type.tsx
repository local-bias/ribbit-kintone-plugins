import styled from '@emotion/styled';
import { FormControl, FormControlLabel, Radio, RadioGroup, Skeleton } from '@mui/material';
import { useAtom } from 'jotai';
import { ChangeEvent, FC, FCX, memo, Suspense } from 'react';

import { typeAtom } from '../../../states/plugin';

const Component: FCX = ({ className }) => {
  const [value, setValue] = useAtom(typeAtom);

  const onChange = (_: ChangeEvent<HTMLInputElement>, newValue: string) => {
    if (newValue === 'sticky-left' || newValue === 'sidebar-right') {
      setValue(newValue);
    }
  };

  return (
    <div className={className}>
      <FormControl>
        <RadioGroup value={value} onChange={onChange}>
          <FormControlLabel value='sticky-left' control={<Radio />} label='左固定表示' />
          <FormControlLabel value='sidebar-right' control={<Radio />} label='右サイドバー表示' />
        </RadioGroup>
      </FormControl>
    </div>
  );
};

const Placeholder: FCX = ({ className }) => (
  <div className={className}>
    <Skeleton variant='rounded' width={200} height={80} />
  </div>
);

const Styling = (Component: FC) => styled(Component)`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const StyledComponent = Styling(Component);
const StyledPlaceHolder = Styling(Placeholder);

const Container: FC = () => {
  return (
    <Suspense fallback={<StyledPlaceHolder />}>
      <StyledComponent />
    </Suspense>
  );
};

export default memo(Container);

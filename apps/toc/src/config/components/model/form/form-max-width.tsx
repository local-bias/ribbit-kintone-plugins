import styled from '@emotion/styled';
import { InputAdornment, Skeleton, TextField } from '@mui/material';
import { useAtom } from 'jotai';
import { ChangeEventHandler, FC, FCX, memo, Suspense } from 'react';
import { maxWidthAtom } from '../../../states/plugin';

const Component: FCX = ({ className }) => {
  const [value, setValue] = useAtom(maxWidthAtom);

  const onChange: ChangeEventHandler<HTMLInputElement> = ({ target }) => {
    setValue(target.value ? Number(target.value) : null);
  };

  return (
    <div className={className}>
      <TextField
        type='number'
        sx={{ width: '150px' }}
        variant='outlined'
        color='primary'
        value={value ?? ''}
        onChange={onChange}
        InputProps={{
          endAdornment: <InputAdornment position='start'>px</InputAdornment>,
        }}
      />
    </div>
  );
};

const Placeholder: FCX = ({ className }) => (
  <div className={className}>
    <Skeleton variant='rounded' width={160} height={56} />
  </div>
);

const Styling = (Component: FC) => styled(Component)`
  display: flex;
  flex-direction: column;
  gap: 16px;

  .row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
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

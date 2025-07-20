import styled from '@emotion/styled';
import { TextField, TextFieldProps } from '@mui/material';
import { PrimitiveAtom, useAtomValue } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import React, { ChangeEventHandler, FC, FCX, Suspense, useCallback } from 'react';

type Props = {
  atom: PrimitiveAtom<string>;
  width?: number;
} & Omit<TextFieldProps, 'value' | 'onChange'>;

const Component: FCX<Props> = ({ className, atom, ...textFieldProps }) => {
  const query = useAtomValue(atom);

  const onChange: ChangeEventHandler<HTMLInputElement> = useAtomCallback(
    useCallback((_, set, event) => {
      set(atom, event.target.value);
    }, [])
  );

  return (
    <div className={className}>
      <TextField {...textFieldProps} value={query} onChange={onChange} />
      <TextField {...textFieldProps} type='color' value={query} onChange={onChange} />
    </div>
  );
};
Component.displayName = 'JotaiColorPickerComponent';

const PlaceHolder: FCX<Props> = ({ className, label, placeholder, width }) => (
  <div className={className}>
    <TextField label={label} placeholder={placeholder} value='' sx={{ width }} disabled />
    <TextField label={label} placeholder={placeholder} value='' sx={{ width }} disabled />
  </div>
);
PlaceHolder.displayName = 'JotaiColorPickerPlaceHolder';

const Styled = (component: FC<any>) => styled(component)`
  display: flex;
  gap: 8px;
`;

const StyledPlaceHolder = Styled(PlaceHolder);
const StyledComponent = Styled(Component);

const Container: FC<Props> = (props) => {
  const completed: Props = { ...props, sx: { width: 120, ...props.sx } };

  return (
    <Suspense fallback={<StyledPlaceHolder {...completed} />}>
      <StyledComponent {...completed} />
    </Suspense>
  );
};
Container.displayName = 'JotaiColorPickerContainer';

export const JotaiColorPicker = Container;

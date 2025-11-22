import styled from '@emotion/styled';
import { TextField, TextFieldProps } from '@mui/material';
import { PrimitiveAtom, useAtomValue } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import { ChangeEventHandler, ComponentType, Suspense, useCallback } from 'react';

type Props = {
  atom: PrimitiveAtom<string>;
  width?: number;
} & Omit<TextFieldProps, 'value' | 'onChange'>;

function ColorPickerContent({
  className,
  atom,
  ...textFieldProps
}: Props & { className?: string }) {
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
}

function ColorPickerPlaceholder({
  className,
  label,
  placeholder,
  width,
}: Props & { className?: string }) {
  return (
    <div className={className}>
      <TextField label={label} placeholder={placeholder} value='' sx={{ width }} disabled />
      <TextField label={label} placeholder={placeholder} value='' sx={{ width }} disabled />
    </div>
  );
}

const Styled = (component: ComponentType<any>) => styled(component)`
  display: flex;
  gap: 8px;
`;

const StyledPlaceHolder = Styled(ColorPickerPlaceholder);
const StyledComponent = Styled(ColorPickerContent);

export function JotaiColorPicker(props: Props) {
  const completed: Props = { ...props, sx: { width: 120, ...props.sx } };

  return (
    <Suspense fallback={<StyledPlaceHolder {...completed} />}>
      <StyledComponent {...completed} />
    </Suspense>
  );
}

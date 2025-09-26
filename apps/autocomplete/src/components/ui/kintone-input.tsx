import styled from '@emotion/styled';
import { ComponentProps, forwardRef, ReactNode } from 'react';

type Props = ComponentProps<'input'> & { label?: string; icon?: ReactNode; };

const Component = forwardRef<HTMLInputElement, Props>((props, ref) => {
  const { label, icon, className, ...inputProps } = props;

  return (
    <div className={className}>
      <input {...inputProps} ref={ref}></input>
    </div>
  );
});

const StyledComponent = styled(Component)`
  position: relative;
  display: inline-block;
  vertical-align: top;
  width: 100%;

  input {
    transition: all 250ms ease;
    width: 100%;
    display: inline-block;
    box-sizing: border-box;
    margin: 0;
    padding: 0 8px;
    height: 40px;
    outline: none;
    border: 1px solid #e3e7e8;
    background-color: #fff;
    box-shadow: 0 1px 4px -2px #0003 inset;
    font-size: 14px;
    color: hsl(var(--foreground));

    &:focus {
      border: 1px solid #3498db;
      box-shadow: none;
    }
  }
`;

export const KintoneInput = StyledComponent;

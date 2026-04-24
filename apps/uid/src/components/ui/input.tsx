import * as React from 'react';
import { css, cx } from '@emotion/css';

const inputStyles = css`
  display: flex;
  height: 40px;
  width: 100%;
  border-radius: calc(var(--ribbit-radius) - 2px);
  border: 1px solid hsl(var(--ribbit-input));
  background-color: hsl(var(--ribbit-background));
  padding: 8px 12px;
  font-size: 14px;
  line-height: 20px;

  &::placeholder {
    color: hsl(var(--ribbit-muted-foreground));
  }

  &:focus-visible {
    outline: 2px solid hsl(var(--ribbit-ring));
    outline-offset: 2px;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  &[type='file'] {
    border: 0;
    background: transparent;
    font-size: 14px;
    font-weight: 500;
  }
`;

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return <input type={type} className={cx(inputStyles, className)} ref={ref} {...props} />;
  }
);
Input.displayName = 'Input';

export { Input };

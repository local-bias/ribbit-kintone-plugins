import styled from '@emotion/styled';
import type * as React from 'react';

const StyledInput = styled.input`
  height: 2.25rem;
  width: 100%;
  min-width: 0;
  border-radius: calc(var(--🐸radius) - 6px);
  border: 1px solid var(--🐸input);
  background-color: transparent;
  padding: 0.25rem 0.75rem;
  font-size: 1rem;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  transition: color 0.15s ease, box-shadow 0.15s ease;
  outline: none;

  &::placeholder {
    color: var(--🐸muted-foreground);
  }

  &::selection {
    background-color: var(--🐸primary);
    color: var(--🐸primary-foreground);
  }

  &::file-selector-button {
    display: inline-flex;
    height: 1.75rem;
    border: 0;
    background-color: transparent;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--🐸foreground);
  }

  &:disabled {
    pointer-events: none;
    cursor: not-allowed;
    opacity: 0.5;
  }

  &:focus-visible {
    border-color: var(--🐸ring);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--🐸ring) 50%, transparent);
  }

  &[aria-invalid='true'] {
    border-color: var(--🐸destructive);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--🐸destructive) 20%, transparent);
  }

  @media (min-width: 768px) {
    font-size: 0.875rem;
  }

  @media (prefers-color-scheme: dark) {
    background-color: color-mix(in srgb, var(--🐸input) 30%, transparent);

    &[aria-invalid='true'] {
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--🐸destructive) 40%, transparent);
    }
  }
`;

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return <StyledInput type={type} data-slot='input' className={className} {...props} />;
}

export { Input };

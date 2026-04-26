import styled from '@emotion/styled';
import type * as React from 'react';

const StyledTextarea = styled.textarea`
  display: flex;
  field-sizing: content;
  min-height: 4rem;
  width: 100%;
  border-radius: calc(var(--🐸radius) - 6px);
  border: 1px solid var(--🐸input);
  background-color: transparent;
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  transition: color 0.15s ease, box-shadow 0.15s ease;
  outline: none;

  &::placeholder {
    color: var(--🐸muted-foreground);
  }

  &:focus-visible {
    border-color: var(--🐸ring);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--🐸ring) 50%, transparent);
  }

  &[aria-invalid='true'] {
    border-color: var(--🐸destructive);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--🐸destructive) 20%, transparent);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
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

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return <StyledTextarea data-slot='textarea' className={className} {...props} />;
}

export { Textarea };

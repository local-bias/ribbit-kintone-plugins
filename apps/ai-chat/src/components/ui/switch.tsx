import styled from '@emotion/styled';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import type * as React from 'react';

const StyledSwitch = styled(SwitchPrimitive.Root)`
  display: inline-flex;
  height: 1.15rem;
  width: 2rem;
  flex-shrink: 0;
  align-items: center;
  border-radius: 9999px;
  border: 1px solid transparent;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  transition: all 0.15s ease;
  outline: none;

  &[data-state='checked'] {
    background-color: var(--🐸primary);
  }

  &[data-state='unchecked'] {
    background-color: var(--🐸input);
  }

  &:focus-visible {
    border-color: var(--🐸ring);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--🐸ring) 50%, transparent);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  @media (prefers-color-scheme: dark) {
    &[data-state='unchecked'] {
      background-color: color-mix(in srgb, var(--🐸input) 80%, transparent);
    }
  }
`;

const StyledThumb = styled(SwitchPrimitive.Thumb)`
  pointer-events: none;
  display: block;
  width: 1rem;
  height: 1rem;
  border-radius: 9999px;
  background-color: var(--🐸background);
  box-shadow: none;
  transition: transform 0.15s ease;

  &[data-state='checked'] {
    transform: translateX(calc(100% - 2px));
  }

  &[data-state='unchecked'] {
    transform: translateX(0);
  }

  @media (prefers-color-scheme: dark) {
    &[data-state='unchecked'] {
      background-color: var(--🐸foreground);
    }

    &[data-state='checked'] {
      background-color: var(--🐸primary-foreground);
    }
  }
`;

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <StyledSwitch data-slot='switch' className={className} {...props}>
      <StyledThumb data-slot='switch-thumb' />
    </StyledSwitch>
  );
}

export { Switch };

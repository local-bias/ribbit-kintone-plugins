import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import styled from '@emotion/styled';
import { css } from '@emotion/react';

type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg';

interface ButtonStyleProps {
  $variant?: ButtonVariant;
  $size?: ButtonSize;
}

const baseStyles = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  white-space: nowrap;
  border-radius: calc(var(--🐸radius) - 6px);
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.15s ease;
  outline: none;
  flex-shrink: 0;

  &:disabled {
    pointer-events: none;
    opacity: 0.5;
  }

  & svg {
    pointer-events: none;
    flex-shrink: 0;
  }

  & svg:not([class*='size-']) {
    width: 1rem;
    height: 1rem;
  }

  &:focus-visible {
    border-color: var(--🐸ring);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--🐸ring) 50%, transparent);
  }

  &[aria-invalid='true'] {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--🐸destructive) 20%, transparent);
    border-color: var(--🐸destructive);
  }

  @media (prefers-color-scheme: dark) {
    &[aria-invalid='true'] {
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--🐸destructive) 40%, transparent);
    }
  }
`;

const variantStyles = {
  default: css`
    background-color: var(--🐸primary);
    color: var(--🐸primary-foreground);
    &:hover {
      background-color: color-mix(in srgb, var(--🐸primary) 90%, transparent);
    }
  `,
  destructive: css`
    background-color: var(--🐸destructive);
    color: white;
    &:hover {
      background-color: color-mix(in srgb, var(--🐸destructive) 90%, transparent);
    }
    &:focus-visible {
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--🐸destructive) 20%, transparent);
    }
    @media (prefers-color-scheme: dark) {
      background-color: color-mix(in srgb, var(--🐸destructive) 60%, transparent);
      &:focus-visible {
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--🐸destructive) 40%, transparent);
      }
    }
  `,
  outline: css`
    border: 1px solid var(--🐸border);
    background-color: var(--🐸background);
    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    &:hover {
      background-color: var(--🐸accent);
      color: var(--🐸accent-foreground);
    }
    @media (prefers-color-scheme: dark) {
      background-color: color-mix(in srgb, var(--🐸input) 30%, transparent);
      border-color: var(--🐸input);
      &:hover {
        background-color: color-mix(in srgb, var(--🐸input) 50%, transparent);
      }
    }
  `,
  secondary: css`
    background-color: var(--🐸secondary);
    color: var(--🐸secondary-foreground);
    &:hover {
      background-color: color-mix(in srgb, var(--🐸secondary) 80%, transparent);
    }
  `,
  ghost: css`
    &:hover {
      background-color: var(--🐸accent);
      color: var(--🐸accent-foreground);
    }
    @media (prefers-color-scheme: dark) {
      &:hover {
        background-color: color-mix(in srgb, var(--🐸accent) 50%, transparent);
      }
    }
  `,
  link: css`
    color: var(--🐸primary);
    text-underline-offset: 4px;
    &:hover {
      text-decoration: underline;
    }
  `,
};

const sizeStyles = {
  default: css`
    height: 2.25rem;
    padding: 0.5rem 1rem;
    &:has(> svg) {
      padding-left: 0.75rem;
      padding-right: 0.75rem;
    }
  `,
  sm: css`
    height: 2rem;
    border-radius: calc(var(--🐸radius) - 6px);
    gap: 0.375rem;
    padding: 0 0.75rem;
    &:has(> svg) {
      padding-left: 0.625rem;
      padding-right: 0.625rem;
    }
  `,
  lg: css`
    height: 2.5rem;
    border-radius: calc(var(--🐸radius) - 6px);
    padding: 0 1.5rem;
    &:has(> svg) {
      padding-left: 1rem;
      padding-right: 1rem;
    }
  `,
  icon: css`
    width: 2.25rem;
    height: 2.25rem;
  `,
  'icon-sm': css`
    width: 2rem;
    height: 2rem;
  `,
  'icon-lg': css`
    width: 2.5rem;
    height: 2.5rem;
  `,
};

const StyledButton = styled.button<ButtonStyleProps>`
  ${baseStyles}
  ${({ $variant = 'default' }) => variantStyles[$variant]}
  ${({ $size = 'default' }) => sizeStyles[$size]}
`;

const StyledSlot = styled(Slot)<ButtonStyleProps>`
  ${baseStyles}
  ${({ $variant = 'default' }) => variantStyles[$variant]}
  ${({ $size = 'default' }) => sizeStyles[$size]}
`;

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
}) {
  const Comp = asChild ? StyledSlot : StyledButton;

  return (
    <Comp data-slot='button' $variant={variant} $size={size} className={className} {...props} />
  );
}

export { Button };
export type { ButtonVariant, ButtonSize };

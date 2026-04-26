import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { css, cx } from '@emotion/css';

const buttonBase = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  border-radius: calc(var(--ribbit-radius) - 2px);
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
  transition:
    background-color 0.15s,
    color 0.15s;
  cursor: pointer;
  border: none;

  &:focus-visible {
    outline: 2px solid hsl(var(--ribbit-ring));
    outline-offset: 2px;
  }

  &:disabled {
    pointer-events: none;
    opacity: 0.5;
  }
`;

const variantStyles: Record<string, string> = {
  default: css`
    background-color: hsl(var(--ribbit-primary));
    color: hsl(var(--ribbit-primary-foreground));
    &:hover {
      background-color: hsl(var(--ribbit-primary) / 0.9);
    }
  `,
  destructive: css`
    background-color: hsl(var(--ribbit-destructive));
    color: hsl(var(--ribbit-destructive-foreground));
    &:hover {
      background-color: hsl(var(--ribbit-destructive) / 0.9);
    }
  `,
  outline: css`
    border: 1px solid hsl(var(--ribbit-input));
    background-color: hsl(var(--ribbit-background));
    &:hover {
      background-color: hsl(var(--ribbit-accent));
      color: hsl(var(--ribbit-accent-foreground));
    }
  `,
  secondary: css`
    background-color: hsl(var(--ribbit-secondary));
    color: hsl(var(--ribbit-secondary-foreground));
    &:hover {
      background-color: hsl(var(--ribbit-secondary) / 0.8);
    }
  `,
  ghost: css`
    background-color: transparent;
    border: none;
    &:hover {
      background-color: hsl(var(--ribbit-accent));
      color: hsl(var(--ribbit-accent-foreground));
    }
  `,
  link: css`
    background-color: transparent;
    border: none;
    color: hsl(var(--ribbit-primary));
    text-underline-offset: 4px;
    &:hover {
      text-decoration: underline;
    }
  `,
};

const sizeStyles: Record<string, string> = {
  default: css`
    height: 40px;
    padding: 8px 16px;
  `,
  sm: css`
    height: 36px;
    border-radius: calc(var(--ribbit-radius) - 2px);
    padding: 0 12px;
  `,
  lg: css`
    height: 44px;
    border-radius: calc(var(--ribbit-radius) - 2px);
    padding: 0 32px;
  `,
  icon: css`
    height: 40px;
    width: 40px;
  `,
};

export type ButtonVariant = keyof typeof variantStyles;
export type ButtonSize = keyof typeof sizeStyles;

export function buttonVariants({
  variant = 'default',
  size = 'default',
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cx(
    buttonBase,
    variantStyles[variant] ?? variantStyles.default,
    sizeStyles[size] ?? sizeStyles.default,
    className
  );
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={buttonVariants({ variant, size, className })} ref={ref} {...props} />;
  }
);
Button.displayName = 'Button';

export { Button };

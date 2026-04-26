import styled from '@emotion/styled';
import type * as React from 'react';

type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

interface ButtonStyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  default: `
    background-color: #1976d2;
    color: #fff;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    &:hover { background-color: #1565c0; }
  `,
  destructive: `
    background-color: #d32f2f;
    color: #fff;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    &:hover { background-color: #c62828; }
  `,
  outline: `
    border: 1px solid #bdbdbd;
    background-color: #fff;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    &:hover {
      background-color: #f5f5f5;
      color: #212121;
    }
  `,
  secondary: `
    background-color: #f5f5f5;
    color: #424242;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    &:hover { background-color: #e0e0e0; }
  `,
  ghost: `
    background-color: transparent;
    &:hover {
      background-color: #f5f5f5;
      color: #212121;
    }
  `,
  link: `
    background-color: transparent;
    color: #1976d2;
    text-decoration-offset: 4px;
    &:hover { text-decoration: underline; }
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  default: `
    height: 36px;
    padding: 8px 16px;
  `,
  sm: `
    height: 32px;
    padding: 6px 12px;
    gap: 6px;
    font-size: 13px;
  `,
  lg: `
    height: 40px;
    padding: 8px 24px;
  `,
  icon: `
    width: 36px;
    height: 36px;
    padding: 0;
  `,
};

const StyledButton = styled.button<ButtonStyleProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  white-space: nowrap;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  cursor: pointer;
  outline: none;
  flex-shrink: 0;
  transition: all 0.15s ease;
  text-decoration: none;
  line-height: 1;

  &:focus-visible {
    outline: 2px solid #1976d2;
    outline-offset: 2px;
  }

  &:disabled {
    pointer-events: none;
    opacity: 0.5;
  }

  & svg {
    pointer-events: none;
    flex-shrink: 0;
    width: 16px;
    height: 16px;
  }

  ${({ variant = 'default' }) => variantStyles[variant]}
  ${({ size = 'default' }) => sizeStyles[size]}
`;

interface ButtonProps extends React.ComponentProps<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

function Button({ variant = 'default', size = 'default', ...props }: ButtonProps) {
  return <StyledButton data-slot='button' variant={variant} size={size} {...props} />;
}

export type { ButtonProps, ButtonSize, ButtonVariant };
export { Button };

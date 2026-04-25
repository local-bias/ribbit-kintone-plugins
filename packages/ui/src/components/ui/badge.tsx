import styled from '@emotion/styled';
import * as React from 'react';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

interface BadgeStyleProps {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: `
    background-color: #1976d2;
    color: #fff;
    border-color: transparent;
    &:hover { background-color: #1565c0; }
  `,
  secondary: `
    background-color: #f5f5f5;
    color: #424242;
    border-color: transparent;
    &:hover { background-color: #eeeeee; }
  `,
  destructive: `
    background-color: #d32f2f;
    color: #fff;
    border-color: transparent;
    &:hover { background-color: #c62828; }
  `,
  outline: `
    background-color: transparent;
    color: #212121;
    border-color: #bdbdbd;
    &:hover { background-color: #f5f5f5; }
  `,
};

const StyledBadge = styled.span<BadgeStyleProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  border: 1px solid;
  padding: 2px 12px;
  font-size: 12px;
  font-weight: 500;
  width: fit-content;
  white-space: nowrap;
  flex-shrink: 0;
  gap: 4px;
  overflow: hidden;
  transition:
    color 0.15s ease,
    background-color 0.15s ease,
    box-shadow 0.15s ease;
  line-height: 1.5;

  & > svg {
    width: 12px;
    height: 12px;
    pointer-events: none;
  }

  ${({ variant = 'default' }) => variantStyles[variant]}
`;

interface BadgeProps extends React.ComponentProps<'span'> {
  variant?: BadgeVariant;
}

function Badge({ variant = 'default', ...props }: BadgeProps) {
  return <StyledBadge data-slot='badge' variant={variant} {...props} />;
}

export { Badge };
export type { BadgeVariant, BadgeProps };

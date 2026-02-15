'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import styled from '@emotion/styled';
import { css } from '@emotion/react';

function Select({ ...props }: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot='select' {...props} />;
}

function SelectGroup({ ...props }: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot='select-group' {...props} />;
}

function SelectValue({ ...props }: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot='select-value' {...props} />;
}

interface SelectTriggerStyleProps {
  $size?: 'sm' | 'default';
}

const StyledSelectTrigger = styled(SelectPrimitive.Trigger)<SelectTriggerStyleProps>`
  display: flex;
  width: fit-content;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  border-radius: 0.375rem;
  border: 1px solid var(--🐸input);
  background-color: transparent;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  white-space: nowrap;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  transition: color 0.15s ease, box-shadow 0.15s ease;
  outline: none;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  &[data-placeholder] {
    color: var(--🐸muted-foreground);
  }

  & svg:not([class*='text-']) {
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

  ${({ $size }) =>
    $size === 'sm'
      ? css`
          height: 2rem;
        `
      : css`
          height: 2.25rem;
        `}

  & [data-slot='select-value'] {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
  }

  & svg {
    pointer-events: none;
    flex-shrink: 0;
  }

  & svg:not([class*='size-']) {
    width: 1rem;
    height: 1rem;
  }

  @media (prefers-color-scheme: dark) {
    background-color: color-mix(in srgb, var(--🐸input) 30%, transparent);

    &:hover {
      background-color: color-mix(in srgb, var(--🐸input) 50%, transparent);
    }

    &[aria-invalid='true'] {
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--🐸destructive) 40%, transparent);
    }
  }
`;

const TriggerIcon = styled(ChevronDownIcon)`
  width: 1rem;
  height: 1rem;
  opacity: 0.5;
`;

function SelectTrigger({
  className,
  size = 'default',
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: 'sm' | 'default';
}) {
  return (
    <StyledSelectTrigger
      data-slot='select-trigger'
      data-size={size}
      $size={size}
      className={className}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <TriggerIcon />
      </SelectPrimitive.Icon>
    </StyledSelectTrigger>
  );
}

const StyledSelectContent = styled(SelectPrimitive.Content)<{ $position?: string }>`
  position: relative;
  z-index: 50;
  max-height: var(--radix-select-content-available-height);
  min-width: 8rem;
  overflow-x: hidden;
  overflow-y: auto;
  border-radius: 0.375rem;
  border: 1px solid var(--🐸border);
  background-color: var(--🐸popover);
  color: var(--🐸popover-foreground);
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  transform-origin: var(--radix-select-content-transform-origin);

  &[data-state='open'] {
    animation: fadeIn 0.15s ease, zoomIn 0.15s ease;
  }

  &[data-state='closed'] {
    animation: fadeOut 0.15s ease, zoomOut 0.15s ease;
  }

  &[data-side='bottom'] {
    animation: slideInFromTop 0.15s ease;
  }

  &[data-side='left'] {
    animation: slideInFromRight 0.15s ease;
  }

  &[data-side='right'] {
    animation: slideInFromLeft 0.15s ease;
  }

  &[data-side='top'] {
    animation: slideInFromBottom 0.15s ease;
  }

  ${({ $position }) =>
    $position === 'popper' &&
    css`
      &[data-side='bottom'] {
        transform: translateY(0.25rem);
      }
      &[data-side='left'] {
        transform: translateX(-0.25rem);
      }
      &[data-side='right'] {
        transform: translateX(0.25rem);
      }
      &[data-side='top'] {
        transform: translateY(-0.25rem);
      }
    `}

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes fadeOut {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }

  @keyframes zoomIn {
    from {
      transform: scale(0.95);
    }
    to {
      transform: scale(1);
    }
  }

  @keyframes zoomOut {
    from {
      transform: scale(1);
    }
    to {
      transform: scale(0.95);
    }
  }

  @keyframes slideInFromTop {
    from {
      transform: translateY(-0.5rem);
    }
    to {
      transform: translateY(0);
    }
  }

  @keyframes slideInFromRight {
    from {
      transform: translateX(0.5rem);
    }
    to {
      transform: translateX(0);
    }
  }

  @keyframes slideInFromLeft {
    from {
      transform: translateX(-0.5rem);
    }
    to {
      transform: translateX(0);
    }
  }

  @keyframes slideInFromBottom {
    from {
      transform: translateY(0.5rem);
    }
    to {
      transform: translateY(0);
    }
  }
`;

const StyledViewport = styled(SelectPrimitive.Viewport)<{ $position?: string }>`
  padding: 0.25rem;

  ${({ $position }) =>
    $position === 'popper' &&
    css`
      height: var(--radix-select-trigger-height);
      width: 100%;
      min-width: var(--radix-select-trigger-width);
      scroll-margin: 0.25rem;
    `}
`;

function SelectContent({
  className,
  children,
  position = 'popper',
  align = 'center',
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <StyledSelectContent
        data-slot='select-content'
        $position={position}
        position={position}
        align={align}
        className={className}
        {...props}
      >
        <SelectScrollUpButton />
        <StyledViewport $position={position}>{children}</StyledViewport>
        <SelectScrollDownButton />
      </StyledSelectContent>
    </SelectPrimitive.Portal>
  );
}

const StyledSelectLabel = styled(SelectPrimitive.Label)`
  padding: 0.375rem 0.5rem;
  font-size: 0.75rem;
  color: var(--🐸muted-foreground);
`;

function SelectLabel({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return <StyledSelectLabel data-slot='select-label' className={className} {...props} />;
}

const StyledSelectItem = styled(SelectPrimitive.Item)`
  position: relative;
  display: flex;
  width: 100%;
  cursor: default;
  align-items: center;
  gap: 0.5rem;
  border-radius: 0.125rem;
  padding: 0.375rem 2rem 0.375rem 0.5rem;
  font-size: 0.875rem;
  outline: none;
  user-select: none;

  &:focus {
    background-color: var(--🐸accent);
    color: var(--🐸accent-foreground);
  }

  &[data-disabled] {
    pointer-events: none;
    opacity: 0.5;
  }

  & svg:not([class*='text-']) {
    color: var(--🐸muted-foreground);
  }

  & svg {
    pointer-events: none;
    flex-shrink: 0;
  }

  & svg:not([class*='size-']) {
    width: 1rem;
    height: 1rem;
  }

  & > span:last-child {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

const ItemIndicatorWrapper = styled.span`
  position: absolute;
  right: 0.5rem;
  display: flex;
  width: 0.875rem;
  height: 0.875rem;
  align-items: center;
  justify-content: center;
`;

const CheckIconStyled = styled(CheckIcon)`
  width: 1rem;
  height: 1rem;
`;

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <StyledSelectItem data-slot='select-item' className={className} {...props}>
      <ItemIndicatorWrapper>
        <SelectPrimitive.ItemIndicator>
          <CheckIconStyled />
        </SelectPrimitive.ItemIndicator>
      </ItemIndicatorWrapper>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </StyledSelectItem>
  );
}

const StyledSelectSeparator = styled(SelectPrimitive.Separator)`
  pointer-events: none;
  margin: 0.25rem -0.25rem;
  height: 1px;
  background-color: var(--🐸border);
`;

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return <StyledSelectSeparator data-slot='select-separator' className={className} {...props} />;
}

const StyledScrollButton = styled.div`
  display: flex;
  cursor: default;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
`;

const ScrollIcon = styled.svg`
  width: 1rem;
  height: 1rem;
`;

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton asChild {...props}>
      <StyledScrollButton data-slot='select-scroll-up-button' className={className}>
        <ChevronUpIcon className='size-4' />
      </StyledScrollButton>
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton asChild {...props}>
      <StyledScrollButton data-slot='select-scroll-down-button' className={className}>
        <ChevronDownIcon className='size-4' />
      </StyledScrollButton>
    </SelectPrimitive.ScrollDownButton>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};

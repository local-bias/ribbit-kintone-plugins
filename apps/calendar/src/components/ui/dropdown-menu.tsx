'use client';

import * as React from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Check, ChevronRight, Circle } from 'lucide-react';
import { css } from '@emotion/css';

const DropdownMenu = DropdownMenuPrimitive.Root;

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

const DropdownMenuGroup = DropdownMenuPrimitive.Group;

const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

const DropdownMenuSub = DropdownMenuPrimitive.Sub;

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={css`
      display: flex;
      cursor: default;
      user-select: none;
      align-items: center;
      gap: 0.5rem;
      border-radius: 0.125rem;
      padding: 0.375rem 0.5rem;
      font-size: 0.875rem;
      outline: none;
      &:focus {
        background-color: hsl(var(--ribbit-accent));
      }
      &[data-state='open'] {
        background-color: hsl(var(--ribbit-accent));
      }
      & svg {
        pointer-events: none;
        width: 1rem;
        height: 1rem;
        flex-shrink: 0;
      }
      ${inset ? 'padding-left: 2rem;' : ''}
      ${className}
    `}
    {...props}
  >
    {children}
    <ChevronRight
      className={css`
        margin-left: auto;
      `}
    />
  </DropdownMenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={css`
      z-index: 50;
      min-width: 8rem;
      overflow: hidden;
      border-radius: 0.375rem;
      border: 1px solid;
      background-color: hsl(var(--ribbit-popover));
      padding: 0.25rem;
      color: hsl(var(--ribbit-popover-foreground));
      box-shadow:
        0 10px 15px -3px rgba(0, 0, 0, 0.1),
        0 4px 6px -2px rgba(0, 0, 0, 0.05);

      &[data-state='open'] {
        animation: fadeIn 150ms ease;
      }
      &[data-state='closed'] {
        animation: fadeOut 150ms ease;
      }
      &[data-side='bottom'] {
        animation-name: slideFromTop;
      }
      &[data-side='left'] {
        animation-name: slideFromRight;
      }
      &[data-side='right'] {
        animation-name: slideFromLeft;
      }
      &[data-side='top'] {
        animation-name: slideFromBottom;
      }
      transform-origin: var(--radix-dropdown-menu-content-transform-origin);
      ${className}
    `}
    {...props}
  />
));
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={css`
        z-index: 50;
        max-height: var(--radix-dropdown-menu-content-available-height);
        min-width: 8rem;
        overflow-y: auto;
        overflow-x: hidden;
        border-radius: 0.375rem;
        border: 1px solid;
        background-color: hsl(var(--ribbit-popover));
        padding: 0.25rem;
        color: hsl(var(--ribbit-popover-foreground));
        box-shadow:
          0 4px 6px -1px rgba(0, 0, 0, 0.1),
          0 2px 4px -1px rgba(0, 0, 0, 0.06);

        &[data-state='open'] {
          animation: fadeIn 150ms ease;
        }
        &[data-state='closed'] {
          animation: fadeOut 150ms ease;
        }
        &[data-state='closed'] {
          opacity: 0;
        }
        &[data-state='open'] {
          opacity: 1;
        }
        &[data-state='closed'] {
          transform: scale(0.95);
        }
        &[data-state='open'] {
          transform: scale(1);
        }
        &[data-side='bottom'] {
          animation-name: slideFromTop;
        }
        &[data-side='left'] {
          animation-name: slideFromRight;
        }
        &[data-side='right'] {
          animation-name: slideFromLeft;
        }
        &[data-side='top'] {
          animation-name: slideFromBottom;
        }
        transform-origin: var(--radix-dropdown-menu-content-transform-origin);
        ${className}
      `}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={css`
      position: relative;
      display: flex;
      cursor: default;
      user-select: none;
      align-items: center;
      gap: 0.5rem;
      border-radius: 0.125rem;
      padding: 0.375rem 0.5rem;
      font-size: 0.875rem;
      outline: none;
      transition: colors 200ms ease;

      &:focus {
        background-color: hsl(var(--ribbit-accent));
        color: hsl(var(--ribbit-accent-foreground));
      }
      &[data-disabled] {
        pointer-events: none;
        opacity: 0.5;
      }
      & svg {
        pointer-events: none;
        width: 1rem;
        height: 1rem;
        flex-shrink: 0;
      }
      ${inset ? 'padding-left: 2rem;' : ''}
      ${className}
    `}
    {...props}
  />
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={css`
      position: relative;
      display: flex;
      cursor: default;
      user-select: none;
      align-items: center;
      border-radius: 0.125rem;
      padding: 0.375rem 0.5rem;
      padding-left: 2rem;
      padding-right: 0.5rem;
      font-size: 0.875rem;
      outline: none;
      transition: colors 200ms ease;

      &:focus {
        background-color: hsl(var(--ribbit-accent));
        color: hsl(var(--ribbit-accent-foreground));
      }
      &[data-disabled] {
        pointer-events: none;
        opacity: 0.5;
      }
      ${className}
    `}
    checked={checked}
    {...props}
  >
    <span
      className={css`
        position: absolute;
        left: 0.5rem;
        display: flex;
        height: 0.875rem;
        width: 0.875rem;
        align-items: center;
        justify-content: center;
      `}
    >
      <DropdownMenuPrimitive.ItemIndicator>
        <Check
          className={css`
            height: 1rem;
            width: 1rem;
          `}
        />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={css`
      position: relative;
      display: flex;
      cursor: default;
      user-select: none;
      align-items: center;
      border-radius: 0.125rem;
      padding: 0.375rem 0.5rem;
      padding-left: 2rem;
      padding-right: 0.5rem;
      font-size: 0.875rem;
      outline: none;
      transition: colors 200ms ease;

      &:focus {
        background-color: hsl(var(--ribbit-accent));
        color: hsl(var(--ribbit-accent-foreground));
      }
      &[data-disabled] {
        pointer-events: none;
        opacity: 0.5;
      }
      ${className}
    `}
    {...props}
  >
    <span
      className={css`
        position: absolute;
        left: 0.5rem;
        display: flex;
        height: 0.875rem;
        width: 0.875rem;
        align-items: center;
        justify-content: center;
      `}
    >
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle
          className={css`
            height: 0.5rem;
            width: 0.5rem;
            fill: currentColor;
          `}
        />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={css`
      padding: 0.375rem 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      ${inset ? 'padding-left: 2rem;' : ''}
      ${className}
    `}
    {...props}
  />
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={css`
      margin: 0.25rem -0.25rem;
      height: 1px;
      background-color: hsl(var(--ribbit-muted));
      ${className}
    `}
    {...props}
  />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

const DropdownMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={css`
        margin-left: auto;
        font-size: 0.75rem;
        letter-spacing: 0.05em;
        opacity: 0.6;
        ${className}
      `}
      {...props}
    />
  );
};
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
};

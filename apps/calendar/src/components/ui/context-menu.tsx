'use client';

import * as React from 'react';
import * as ContextMenuPrimitive from '@radix-ui/react-context-menu';
import { Check, ChevronRight, Circle } from 'lucide-react';
import { css } from '@emotion/css';

const ContextMenu = ContextMenuPrimitive.Root;

const ContextMenuTrigger = ContextMenuPrimitive.Trigger;

const ContextMenuGroup = ContextMenuPrimitive.Group;

const ContextMenuPortal = ContextMenuPrimitive.Portal;

const ContextMenuSub = ContextMenuPrimitive.Sub;

const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup;

const ContextMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <ContextMenuPrimitive.SubTrigger
    ref={ref}
    className={css`
      display: flex;
      cursor: default;
      user-select: none;
      align-items: center;
      border-radius: 0.125rem;
      padding: 0.375rem 0.5rem;
      font-size: 0.875rem;
      outline: none;

      &:focus {
        background-color: hsl(var(--ribbit-accent));
        color: hsl(var(--ribbit-accent-foreground));
      }

      &[data-state='open'] {
        background-color: hsl(var(--ribbit-accent));
        color: hsl(var(--ribbit-accent-foreground));
      }

      ${inset && `padding-left: 2rem;`}
      ${className}
    `}
    {...props}
  >
    {children}
    <ChevronRight
      className={css`
        margin-left: auto;
        height: 1rem;
        width: 1rem;
      `}
    />
  </ContextMenuPrimitive.SubTrigger>
));
ContextMenuSubTrigger.displayName = ContextMenuPrimitive.SubTrigger.displayName;

const ContextMenuSubContent = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.SubContent
    ref={ref}
    className={css`
      z-index: 50;
      min-width: 8rem;
      overflow: hidden;
      border-radius: 0.375rem;
      border: 1px solid hsl(var(--ribbit-border));
      background-color: hsl(var(--ribbit-popover));
      padding: 0.25rem;
      color: hsl(var(--ribbit-popover-foreground));
      box-shadow:
        0 10px 15px -3px rgba(0, 0, 0, 0.1),
        0 4px 6px -2px rgba(0, 0, 0, 0.05);

      &[data-state='open'] {
        animation: fadeIn 0.2s ease;
      }

      &[data-state='closed'] {
        animation: fadeOut 0.2s ease;
      }

      &[data-side='bottom'] {
        transform: translateY(0.5rem);
      }

      &[data-side='left'] {
        transform: translateX(-0.5rem);
      }

      &[data-side='right'] {
        transform: translateX(0.5rem);
      }

      &[data-side='top'] {
        transform: translateY(-0.5rem);
      }

      transform-origin: var(--radix-context-menu-content-transform-origin);
      ${className}
    `}
    {...props}
  />
));
ContextMenuSubContent.displayName = ContextMenuPrimitive.SubContent.displayName;

const ContextMenuContent = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Portal>
    <ContextMenuPrimitive.Content
      ref={ref}
      className={css`
        z-index: 50;
        max-height: var(--radix-context-menu-content-available-height);
        min-width: 8rem;
        overflow-y: auto;
        overflow-x: hidden;
        border-radius: 0.375rem;
        border: 1px solid hsl(var(--ribbit-border));
        background-color: hsl(var(--ribbit-popover));
        padding: 0.25rem;
        color: hsl(var(--ribbit-popover-foreground));
        box-shadow:
          0 4px 6px -1px rgba(0, 0, 0, 0.1),
          0 2px 4px -1px rgba(0, 0, 0, 0.06);

        &[data-state='open'] {
          animation: fadeIn 0.2s ease;
        }

        &[data-state='closed'] {
          animation: fadeOut 0.2s ease;
        }

        &[data-side='bottom'] {
          transform: translateY(0.5rem);
        }

        &[data-side='left'] {
          transform: translateX(-0.5rem);
        }

        &[data-side='right'] {
          transform: translateX(0.5rem);
        }

        &[data-side='top'] {
          transform: translateY(-0.5rem);
        }

        transform-origin: var(--radix-context-menu-content-transform-origin);
        ${className}
      `}
      {...props}
    />
  </ContextMenuPrimitive.Portal>
));
ContextMenuContent.displayName = ContextMenuPrimitive.Content.displayName;

const ContextMenuItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <ContextMenuPrimitive.Item
    ref={ref}
    className={css`
      position: relative;
      display: flex;
      cursor: default;
      user-select: none;
      align-items: center;
      border-radius: 0.125rem;
      padding: 0.375rem 0.5rem;
      font-size: 0.875rem;
      outline: none;

      &:focus {
        background-color: hsl(var(--ribbit-accent));
        color: hsl(var(--ribbit-accent-foreground));
      }

      &[data-disabled] {
        pointer-events: none;
        opacity: 0.5;
      }

      ${inset && `padding-left: 2rem;`}
      ${className}
    `}
    {...props}
  />
));
ContextMenuItem.displayName = ContextMenuPrimitive.Item.displayName;

const ContextMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <ContextMenuPrimitive.CheckboxItem
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
      <ContextMenuPrimitive.ItemIndicator>
        <Check
          className={css`
            height: 1rem;
            width: 1rem;
          `}
        />
      </ContextMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </ContextMenuPrimitive.CheckboxItem>
));
ContextMenuCheckboxItem.displayName = ContextMenuPrimitive.CheckboxItem.displayName;

const ContextMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <ContextMenuPrimitive.RadioItem
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
      <ContextMenuPrimitive.ItemIndicator>
        <Circle
          className={css`
            height: 1rem;
            width: 1rem;
            fill: currentColor;
          `}
        />
      </ContextMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </ContextMenuPrimitive.RadioItem>
));
ContextMenuRadioItem.displayName = ContextMenuPrimitive.RadioItem.displayName;

const ContextMenuLabel = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <ContextMenuPrimitive.Label
    ref={ref}
    className={css`
      padding: 0.375rem 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: hsl(var(--ribbit-foreground));
      ${inset && `padding-left: 2rem;`}
      ${className}
    `}
    {...props}
  />
));
ContextMenuLabel.displayName = ContextMenuPrimitive.Label.displayName;

const ContextMenuSeparator = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Separator
    ref={ref}
    className={css`
      margin: 0.25rem -0.25rem;
      height: 1px;
      background-color: hsl(var(--ribbit-border));
      ${className}
    `}
    {...props}
  />
));
ContextMenuSeparator.displayName = ContextMenuPrimitive.Separator.displayName;

const ContextMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={css`
        margin-left: auto;
        font-size: 0.75rem;
        letter-spacing: 0.05em;
        color: hsl(var(--ribbit-muted-foreground));
        ${className}
      `}
      {...props}
    />
  );
};
ContextMenuShortcut.displayName = 'ContextMenuShortcut';

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
};

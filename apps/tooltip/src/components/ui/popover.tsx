import * as PopoverPrimitive from '@radix-ui/react-popover';
import * as React from 'react';

import { cn } from '@/lib/utils';
import { css } from '@emotion/css';

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = React.forwardRef<
  React.ComponentRef<typeof PopoverPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <PopoverPrimitive.Trigger
    ref={ref}
    className={cn(
      css`
        box-sizing: border-box;
        border: 0;
        outline: none;
        background-color: transparent;
        cursor: default;
      `,
      className
    )}
    {...props}
  />
));
PopoverTrigger.displayName = PopoverPrimitive.Trigger.displayName;

const PopoverContent = React.forwardRef<
  React.ComponentRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = 'center', sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        css`
          z-index: 50;
          border-radius: calc(var(--🐸radius) - 2px);
          border-width: 1px;
          background-color: hsl(var(--🐸popover));
          color: hsl(var(--🐸popover-foreground));
          padding-left: 12px;
          padding-right: 12px;
          padding-top: 6px;
          padding-bottom: 6px;
          --tw-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
          --tw-shadow-colored:
            0 4px 6px -1px var(--tw-shadow-color), 0 2px 4px -2px var(--tw-shadow-color);
          box-shadow:
            var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000),
            var(--tw-shadow);
          outline: 2px solid transparent;
          outline-offset: 2px;

          &[data-state='open'] {
            animation-name: enter;
            animation-duration: 150ms;
            --tw-enter-opacity: 0;
            --tw-enter-scale: 0.95;
            --tw-enter-rotate: initial;
            --tw-enter-translate-x: initial;
            --tw-enter-translate-y: initial;
          }
          &[data-state='closed'] {
            animation-name: exit;
            animation-duration: 150ms;
            --tw-exit-opacity: 0;
            --tw-exit-scale: 0.95;
            --tw-exit-rotate: initial;
            --tw-exit-translate-x: initial;
            --tw-exit-translate-y: initial;
          }
          &[data-side='bottom'] {
            --tw-enter-translate-y: -8px;
          }
          &[data-side='left'] {
            --tw-enter-translate-x: 8px;
          }
          &[data-side='right'] {
            --tw-enter-translate-x: -8px;
          }
          &[data-side='top'] {
            --tw-enter-translate-y: 8px;
          }
        `,
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverContent, PopoverTrigger };

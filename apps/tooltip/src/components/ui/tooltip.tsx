import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

import { cn, withPrefix } from '@/lib/utils';
import { css } from '@emotion/css';

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TooltipPrimitive.Trigger
    ref={ref}
    className={cn(
      css`
        border-width: 0;
        outline: none;
        background-color: transparent;
        cursor: default;
      `,
      className
    )}
    {...props}
  />
));
TooltipTrigger.displayName = TooltipPrimitive.Trigger.displayName;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      css`
        z-index: 50;
        overflow: hidden;
        border-radius: calc(var(--🐸radius) - 4px);
        background-color: var(--🐸popover);
        padding-inline: calc(var(--🐸spacing) * 3);
        padding-block: calc(var(--🐸spacing) * 1.5);
        font-size: var(--text-sm) /* 0.875rem = 14px */;
        line-height: var(
          --tw-leading,
          var(--text-sm--line-height) /* calc(1.25 / 0.875) ≈ 1.4286 */
        );
        color: var(--🐸popover-foreground);
      `,
      'shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
      withPrefix(
        'z-50 overflow-hidden rounded-sm bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2'
      ),
      className
    )}
    {...props}
  />
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };

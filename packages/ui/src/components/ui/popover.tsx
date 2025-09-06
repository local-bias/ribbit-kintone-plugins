import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';

import { cn } from '@repo/utils';

function Popover({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot='popover' {...props} />;
}

function PopoverTrigger({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot='popover-trigger' {...props} />;
}

function PopoverContent({
  className,
  align = 'center',
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot='popover-content'
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'rui:bg-popover rui:text-popover-foreground rui:data-[state=open]:animate-in rui:data-[state=closed]:animate-out rui:data-[state=closed]:fade-out-0 rui:data-[state=open]:fade-in-0 rui:data-[state=closed]:zoom-out-95 rui:data-[state=open]:zoom-in-95 rui:data-[side=bottom]:slide-in-from-top-2 rui:data-[side=left]:slide-in-from-right-2 rui:data-[side=right]:slide-in-from-left-2 rui:data-[side=top]:slide-in-from-bottom-2 rui:z-50 rui:w-72 rui:origin-(--radix-popover-content-transform-origin) rui:rounded-md rui:border rui:p-4 rui:shadow-md rui:outline-hidden',
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

function PopoverAnchor({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot='popover-anchor' {...props} />;
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };

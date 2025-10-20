import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

import { cn } from '@repo/utils';

function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot='tooltip-provider'
      delayDuration={delayDuration}
      {...props}
    />
  );
}

function Tooltip({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot='tooltip' {...props} />
    </TooltipProvider>
  );
}

function TooltipTrigger({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot='tooltip-trigger' {...props} />;
}

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot='tooltip-content'
        sideOffset={sideOffset}
        className={cn(
          'rui:bg-foreground rui:text-background rui:animate-in rui:fade-in-0 rui:zoom-in-95 rui:data-[state=closed]:animate-out rui:data-[state=closed]:fade-out-0 rui:data-[state=closed]:zoom-out-95 rui:data-[side=bottom]:slide-in-from-top-2 rui:data-[side=left]:slide-in-from-right-2 rui:data-[side=right]:slide-in-from-left-2 rui:data-[side=top]:slide-in-from-bottom-2 rui:z-50 rui:w-fit rui:origin-(--radix-tooltip-content-transform-origin) rui:rounded-md rui:px-3 rui:py-1.5 rui:text-xs rui:text-balance',
          className
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className='rui:bg-foreground rui:fill-foreground rui:z-50 rui:size-2.5 rui:translate-y-[calc(-50%_-_2px)] rui:rotate-45 rui:rounded-[2px]' />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };

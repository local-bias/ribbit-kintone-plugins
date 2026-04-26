import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import type * as React from 'react';

const tooltipEnter = keyframes`
  from {
    opacity: 0;
    transform: translate(var(--tooltip-enter-x, 0), var(--tooltip-enter-y, 0)) scale(0.95);
  }

  to {
    opacity: 1;
    transform: translate(0, 0) scale(1);
  }
`;

const tooltipExit = keyframes`
  from {
    opacity: 1;
    transform: translate(0, 0) scale(1);
  }

  to {
    opacity: 0;
    transform: translate(var(--tooltip-enter-x, 0), var(--tooltip-enter-y, 0)) scale(0.95);
  }
`;

const StyledTooltipContent = styled(TooltipPrimitive.Content)`
  --tooltip-enter-x: 0px;
  --tooltip-enter-y: 0px;

  z-index: 50;
  width: fit-content;
  transform-origin: var(--radix-tooltip-content-transform-origin);
  border-radius: 0.375rem;
  background-color: hsl(var(--foreground));
  padding: 0.375rem 0.75rem;
  color: hsl(var(--background));
  font-size: 0.75rem;
  line-height: 1rem;
  text-wrap: balance;

  &[data-side='top'] {
    --tooltip-enter-y: 0.5rem;
  }

  &[data-side='right'] {
    --tooltip-enter-x: -0.5rem;
  }

  &[data-side='bottom'] {
    --tooltip-enter-y: -0.5rem;
  }

  &[data-side='left'] {
    --tooltip-enter-x: 0.5rem;
  }

  &[data-state='delayed-open'],
  &[data-state='instant-open'] {
    animation: ${tooltipEnter} 150ms ease-out;
  }

  &[data-state='closed'] {
    animation: ${tooltipExit} 100ms ease-in;
  }
`;

const StyledTooltipArrow = styled(TooltipPrimitive.Arrow)`
  z-index: 50;
  width: 0.625rem;
  height: 0.625rem;
  transform: translateY(calc(-50% - 2px)) rotate(45deg);
  border-radius: 2px;
  background-color: hsl(var(--foreground));
  fill: hsl(var(--foreground));
`;

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
      <StyledTooltipContent
        data-slot='tooltip-content'
        sideOffset={sideOffset}
        className={className}
        {...props}
      >
        {children}
        <StyledTooltipArrow />
      </StyledTooltipContent>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };

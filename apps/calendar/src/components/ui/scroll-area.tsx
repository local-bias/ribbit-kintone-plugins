'use client';

import * as React from 'react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { css } from '@emotion/css';

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={css`
      position: relative;
      overflow: hidden;
      ${className}
    `}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport
      className={css`
        height: 100%;
        width: 100%;
        border-radius: inherit;
      `}
    >
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
));
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = 'vertical', ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={css`
      display: flex;
      touch-action: none;
      user-select: none;
      transition-property: colors;
      ${orientation === 'vertical'
        ? `
        height: 100%;
        width: 0.625rem;
        border-left: 1px solid;
        border-left-color: transparent;
        padding: 1px;
      `
        : `
        height: 0.625rem;
        flex-direction: column;
        border-top: 1px solid;
        border-top-color: transparent;
        padding: 1px;
      `}
      ${className}
    `}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb
      className={css`
        position: relative;
        flex: 1;
        border-radius: 9999px;
        background-color: hsl(var(--ribbit-border));
      `}
    />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar };

import { css, cx } from '@emotion/css';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import * as React from 'react';

const scrollAreaRootStyles = css`
  position: relative;
  overflow: hidden;
`;

const scrollAreaViewportStyles = css`
  height: 100%;
  width: 100%;
  border-radius: inherit;
`;

const scrollbarBaseStyles = css`
  display: flex;
  touch-action: none;
  user-select: none;
  transition: background-color 0.15s;
`;

const scrollbarVerticalStyles = css`
  height: 100%;
  width: 10px;
  border-left: 1px solid transparent;
  padding: 1px;
`;

const scrollbarHorizontalStyles = css`
  height: 10px;
  flex-direction: column;
  border-top: 1px solid transparent;
  padding: 1px;
`;

const scrollThumbStyles = css`
  position: relative;
  flex: 1;
  border-radius: 9999px;
  background-color: hsl(var(--ribbit-border));
`;

const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root ref={ref} className={cx(scrollAreaRootStyles, className)} {...props}>
    <ScrollAreaPrimitive.Viewport className={scrollAreaViewportStyles}>
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
    className={cx(
      scrollbarBaseStyles,
      orientation === 'vertical' ? scrollbarVerticalStyles : scrollbarHorizontalStyles,
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className={scrollThumbStyles} />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar };

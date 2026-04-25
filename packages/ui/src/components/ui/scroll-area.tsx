import styled from '@emotion/styled';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import * as React from 'react';

const StyledScrollAreaRoot = styled(ScrollAreaPrimitive.Root)`
  position: relative;
`;

const StyledViewport = styled(ScrollAreaPrimitive.Viewport)`
  width: 100%;
  height: 100%;
  border-radius: inherit;
  outline: none;

  &:focus-visible {
    outline: 2px solid #1976d2;
    outline-offset: -2px;
  }
`;

const StyledScrollbar = styled(ScrollAreaPrimitive.ScrollAreaScrollbar)<{
  orientation?: 'vertical' | 'horizontal';
}>`
  display: flex;
  touch-action: none;
  padding: 1px;
  transition: background-color 0.15s ease;
  user-select: none;

  ${({ orientation }) =>
    orientation === 'horizontal'
      ? `
    height: 10px;
    flex-direction: column;
    border-top: 1px solid transparent;
  `
      : `
    height: 100%;
    width: 10px;
    border-left: 1px solid transparent;
  `}
`;

const StyledThumb = styled(ScrollAreaPrimitive.ScrollAreaThumb)`
  position: relative;
  flex: 1;
  border-radius: 9999px;
  background-color: #bdbdbd;
`;

function ScrollArea({ children, ...props }: React.ComponentProps<typeof ScrollAreaPrimitive.Root>) {
  return (
    <StyledScrollAreaRoot data-slot='scroll-area' {...props}>
      <StyledViewport data-slot='scroll-area-viewport'>{children}</StyledViewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </StyledScrollAreaRoot>
  );
}

function ScrollBar({
  orientation = 'vertical',
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <StyledScrollbar data-slot='scroll-area-scrollbar' orientation={orientation} {...props}>
      <StyledThumb data-slot='scroll-area-thumb' />
    </StyledScrollbar>
  );
}

export { ScrollArea, ScrollBar };

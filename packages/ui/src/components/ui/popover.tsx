import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import * as React from 'react';

function Popover({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot='popover' {...props} />;
}

function PopoverTrigger({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot='popover-trigger' {...props} />;
}

const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
`;

const fadeOut = keyframes`
  from { opacity: 1; transform: scale(1); }
  to { opacity: 0; transform: scale(0.95); }
`;

const StyledPopoverContent = styled(PopoverPrimitive.Content)`
  z-index: 50;
  width: 288px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  background-color: #fff;
  padding: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  outline: none;
  animation: ${fadeIn} 0.15s ease-out;

  &[data-state='closed'] {
    animation: ${fadeOut} 0.1s ease-in;
  }
`;

function PopoverContent({
  align = 'center',
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <StyledPopoverContent
        data-slot='popover-content'
        align={align}
        sideOffset={sideOffset}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

function PopoverAnchor({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot='popover-anchor' {...props} />;
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };

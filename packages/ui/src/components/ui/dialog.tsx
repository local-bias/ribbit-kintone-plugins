import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { XIcon } from 'lucide-react';
import type * as React from 'react';

function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot='dialog' {...props} />;
}

function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot='dialog-trigger' {...props} />;
}

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot='dialog-portal' {...props} />;
}

function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot='dialog-close' {...props} />;
}

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

const zoomIn = keyframes`
  from { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
  to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
`;

const zoomOut = keyframes`
  from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  to { opacity: 0; transform: translate(-50%, -50%) scale(0.95); }
`;

const StyledOverlay = styled(DialogPrimitive.Overlay)`
  position: fixed;
  inset: 0;
  z-index: 50;
  background-color: rgba(0, 0, 0, 0.5);
  animation: ${fadeIn} 0.15s ease-out;

  &[data-state='closed'] {
    animation: ${fadeOut} 0.15s ease-in;
  }
`;

function DialogOverlay(props: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return <StyledOverlay data-slot='dialog-overlay' {...props} />;
}

const StyledDialogContent = styled(DialogPrimitive.Content)`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 50;
  display: grid;
  width: calc(100% - 32px);
  max-width: 512px;
  gap: 16px;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  background-color: #fff;
  padding: 24px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.16);
  animation: ${zoomIn} 0.2s ease-out;

  &[data-state='closed'] {
    animation: ${zoomOut} 0.15s ease-in;
  }
`;

const StyledCloseButton = styled(DialogPrimitive.Close)`
  position: absolute;
  top: 16px;
  right: 16px;
  border-radius: 4px;
  opacity: 0.7;
  transition: opacity 0.15s ease;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    opacity: 1;
  }

  &:focus-visible {
    outline: 2px solid #1976d2;
    outline-offset: 2px;
  }

  &:disabled {
    pointer-events: none;
  }

  & svg {
    width: 16px;
    height: 16px;
    pointer-events: none;
    flex-shrink: 0;
  }
`;

function DialogContent({
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
}) {
  return (
    <DialogPortal data-slot='dialog-portal'>
      <DialogOverlay />
      <StyledDialogContent data-slot='dialog-content' {...props}>
        {children}
        {showCloseButton && (
          <StyledCloseButton data-slot='dialog-close'>
            <XIcon />
          </StyledCloseButton>
        )}
      </StyledDialogContent>
    </DialogPortal>
  );
}

const StyledDialogHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

function DialogHeader(props: React.ComponentProps<'div'>) {
  return <StyledDialogHeader data-slot='dialog-header' {...props} />;
}

const StyledDialogFooter = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  gap: 8px;
`;

function DialogFooter(props: React.ComponentProps<'div'>) {
  return <StyledDialogFooter data-slot='dialog-footer' {...props} />;
}

const StyledDialogTitle = styled(DialogPrimitive.Title)`
  font-size: 18px;
  font-weight: 600;
  line-height: 1.2;
  color: #212121;
`;

function DialogTitle(props: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <StyledDialogTitle data-slot='dialog-title' {...props} />;
}

const StyledDialogDescription = styled(DialogPrimitive.Description)`
  font-size: 14px;
  color: #757575;
  line-height: 1.5;
`;

function DialogDescription(props: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return <StyledDialogDescription data-slot='dialog-description' {...props} />;
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};

import { css, cx, keyframes } from '@emotion/css';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import * as React from 'react';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

const contentIn = keyframes`
  from {
    opacity: 0;
    transform: translate(-50%, -48%) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
`;

const contentOut = keyframes`
  from {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  to {
    opacity: 0;
    transform: translate(-50%, -48%) scale(0.95);
  }
`;

const overlayStyles = css`
  position: fixed;
  inset: 0;
  z-index: 50;
  background-color: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(4px);

  &[data-state='open'] {
    animation: ${fadeIn} 200ms ease-out;
  }
  &[data-state='closed'] {
    animation: ${fadeOut} 200ms ease-out;
  }
`;

const contentStyles = css`
  position: fixed;
  left: 50%;
  top: 50%;
  z-index: 50;
  display: grid;
  width: 100%;
  max-width: 512px;
  transform: translate(-50%, -50%);
  gap: 16px;
  border: 1px solid hsl(var(--ribbit-border));
  background-color: hsl(var(--ribbit-background));
  padding: 24px;
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
  border-radius: var(--ribbit-radius);

  &[data-state='open'] {
    animation: ${contentIn} 200ms ease-out;
  }
  &[data-state='closed'] {
    animation: ${contentOut} 200ms ease-out;
  }
`;

const closeButtonStyles = css`
  position: absolute;
  right: 16px;
  top: 16px;
  border: 0;
  background: transparent;
  border-radius: calc(var(--ribbit-radius) - 4px);
  opacity: 0.7;
  transition: opacity 0.15s;
  cursor: pointer;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover {
    opacity: 1;
  }

  &:focus {
    outline: 2px solid hsl(var(--ribbit-ring));
    outline-offset: 2px;
  }

  &:disabled {
    pointer-events: none;
  }
`;

const srOnlyStyles = css`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
`;

const iconSmallStyles = css`
  height: 16px;
  width: 16px;
`;

const headerStyles = css`
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: center;

  @media (min-width: 640px) {
    text-align: left;
  }
`;

const footerStyles = css`
  display: flex;
  flex-direction: column-reverse;
  gap: 8px;

  @media (min-width: 640px) {
    flex-direction: row;
    justify-content: flex-end;
  }
`;

const titleStyles = css`
  font-size: 18px;
  line-height: 28px;
  font-weight: 600;
  letter-spacing: -0.025em;
`;

const descriptionStyles = css`
  font-size: 14px;
  line-height: 20px;
  color: hsl(var(--ribbit-muted-foreground));
`;

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay ref={ref} className={cx('🐸', overlayStyles, className)} {...props} />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content ref={ref} className={cx('🐸', contentStyles, className)} {...props}>
      {children}
      <DialogPrimitive.Close className={closeButtonStyles}>
        <X className={iconSmallStyles} />
        <span className={srOnlyStyles}>Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cx(headerStyles, className)} {...props} />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cx(footerStyles, className)} {...props} />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cx(titleStyles, className)} {...props} />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cx(descriptionStyles, className)} {...props} />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

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

'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { css } from '@emotion/css';

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={css`
      position: fixed;
      inset: 0;
      z-index: 50;
      background-color: hsl(var(--ribbit-black) / 0.8);
      &[data-state='open'] {
        animation: fadeIn 150ms cubic-bezier(0.16, 1, 0.3, 1);
      }
      &[data-state='closed'] {
        animation: fadeOut 150ms cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      @keyframes fadeOut {
        from {
          opacity: 1;
        }
        to {
          opacity: 0;
        }
      }
      ${className}
    `}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={css`
        position: fixed;
        left: 50%;
        top: 50%;
        z-index: 50;
        display: grid;
        width: 100%;
        max-width: 32rem;
        transform: translate(-50%, -50%);
        gap: 1rem;
        border: 1px solid hsl(var(--ribbit-border));
        background-color: hsl(var(--ribbit-background));
        padding: 1.5rem;
        box-shadow:
          0 10px 15px -3px hsl(var(--ribbit-shadow) / 0.1),
          0 4px 6px -4px hsl(var(--ribbit-shadow) / 0.1);
        transition-duration: 200ms;

        &[data-state='open'] {
          animation: contentShow 150ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        &[data-state='closed'] {
          animation: contentHide 150ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        @media (min-width: 640px) {
          border-radius: 0.5rem;
        }

        @keyframes contentShow {
          from {
            opacity: 0;
            transform: translate(-50%, -48%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        @keyframes contentHide {
          from {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          to {
            opacity: 0;
            transform: translate(-50%, -48%) scale(0.95);
          }
        }

        ${className}
      `}
      {...props}
    >
      {children}
      <DialogPrimitive.Close
        className={css`
          position: absolute;
          right: 1rem;
          top: 1rem;
          border-radius: 0.125rem;
          opacity: 0.7;
          transition-property: opacity;

          &:hover {
            opacity: 1;
          }

          &:focus {
            outline: none;
            ring: 2px solid hsl(var(--ribbit-ring));
            ring-offset: 2px hsl(var(--ribbit-ring-offset));
          }

          &:disabled {
            pointer-events: none;
          }

          &[data-state='open'] {
            background-color: hsl(var(--ribbit-accent));
            color: hsl(var(--ribbit-muted-foreground));
          }
        `}
      >
        <X
          className={css`
            height: 1rem;
            width: 1rem;
          `}
        />
        <span
          className={css`
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border-width: 0;
          `}
        >
          Close
        </span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={css`
      display: flex;
      flex-direction: column;
      margin-bottom: 0.375rem;
      text-align: center;

      @media (min-width: 640px) {
        text-align: left;
      }

      ${className}
    `}
    {...props}
  />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={css`
      display: flex;
      flex-direction: column-reverse;

      @media (min-width: 640px) {
        flex-direction: row;
        justify-content: flex-end;

        & > * + * {
          margin-left: 0.5rem;
        }
      }

      ${className}
    `}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={css`
      font-size: 1.125rem;
      line-height: 1;
      font-weight: 600;
      letter-spacing: -0.025em;

      ${className}
    `}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={css`
      font-size: 0.875rem;
      color: hsl(var(--ribbit-muted-foreground));

      ${className}
    `}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { XIcon } from 'lucide-react';

import { cn } from '@repo/utils';

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

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot='dialog-overlay'
      className={cn(
        'rui:data-[state=open]:animate-in rui:data-[state=closed]:animate-out rui:data-[state=closed]:fade-out-0 rui:data-[state=open]:fade-in-0 rui:fixed rui:inset-0 rui:z-50 rui:bg-black/50',
        className
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
}) {
  return (
    <DialogPortal data-slot='dialog-portal'>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot='dialog-content'
        className={cn(
          'rui:bg-background rui:data-[state=open]:animate-in rui:data-[state=closed]:animate-out rui:data-[state=closed]:fade-out-0 rui:data-[state=open]:fade-in-0 rui:data-[state=closed]:zoom-out-95 rui:data-[state=open]:zoom-in-95 rui:fixed rui:top-[50%] rui:left-[50%] rui:z-50 rui:grid rui:w-full rui:max-w-[calc(100%-2rem)] rui:translate-x-[-50%] rui:translate-y-[-50%] rui:gap-4 rui:rounded-lg rui:border rui:p-6 rui:shadow-lg rui:duration-200 rui:sm:max-w-lg',
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot='dialog-close'
            className='rui:ring-offset-background rui:focus:ring-ring rui:data-[state=open]:bg-accent rui:data-[state=open]:text-muted-foreground rui:absolute rui:top-4 rui:right-4 rui:rounded-xs rui:opacity-70 rui:transition-opacity rui:hover:opacity-100 rui:focus:ring-2 rui:focus:ring-offset-2 rui:focus:outline-hidden rui:disabled:pointer-events-none rui:[&_svg]:pointer-events-none rui:[&_svg]:shrink-0 rui:[&_svg:not([class*=size-])]:size-4'
          >
            <XIcon />
            <span className='rui:sr-only'>Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='dialog-header'
      className={cn('rui:flex rui:flex-col rui:gap-2 rui:text-center rui:sm:text-left', className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='dialog-footer'
      className={cn(
        'rui:flex rui:flex-col-reverse rui:gap-2 rui:sm:flex-row rui:sm:justify-end',
        className
      )}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot='dialog-title'
      className={cn('rui:text-lg rui:leading-none rui:font-semibold', className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot='dialog-description'
      className={cn('rui:text-muted-foreground rui:text-sm', className)}
      {...props}
    />
  );
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

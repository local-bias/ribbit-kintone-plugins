import * as React from 'react';
import { cn } from '@repo/utils';

function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='card'
      className={cn(
        'rui:bg-card rui:text-card-foreground rui:flex rui:flex-col rui:gap-6 rui:rounded-xl rui:border rui:border-border rui:py-6 rui:shadow-sm',
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='card-header'
      className={cn(
        'rui:@container/card-header rui:grid rui:auto-rows-min rui:grid-rows-[auto_auto] rui:items-start rui:gap-1.5 rui:px-6 rui:has-data-[slot=card-action]:grid-cols-[1fr_auto] rui:[.border-b]:pb-6',
        className
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='card-title'
      className={cn('rui:leading-none rui:font-semibold', className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='card-description'
      className={cn('rui:text-muted-foreground rui:text-sm', className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='card-action'
      className={cn(
        'rui:col-start-2 rui:row-span-2 rui:row-start-1 rui:self-start rui:justify-self-end',
        className
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot='card-content' className={cn('rui:px-6', className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot='card-footer'
      className={cn('rui:flex rui:items-center rui:px-6 rui:[.border-t]:pt-6', className)}
      {...props}
    />
  );
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };

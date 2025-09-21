import * as React from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDownIcon } from 'lucide-react';

import { cn } from '@repo/utils';

function Accordion({ ...props }: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot='accordion' {...props} />;
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot='accordion-item'
      className={cn('rui:border-b rui:last:border-b-0', className)}
      {...props}
    />
  );
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className='rui:flex'>
      <AccordionPrimitive.Trigger
        data-slot='accordion-trigger'
        className={cn(
          'rui:focus-visible:border-ring rui:focus-visible:ring-ring/50 rui:flex rui:flex-1 rui:items-start rui:justify-between rui:gap-4 rui:rounded-md rui:py-4 rui:text-left rui:text-sm rui:font-medium rui:transition-all rui:outline-none rui:hover:underline rui:focus-visible:ring-[3px] rui:disabled:pointer-events-none rui:disabled:opacity-50 rui:[&[data-state=open]>svg]:rotate-180',
          className
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon className='rui:text-muted-foreground rui:pointer-events-none rui:size-4 rui:shrink-0 rui:translate-y-0.5 rui:transition-transform rui:duration-200' />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot='accordion-content'
      className='rui:data-[state=closed]:animate-accordion-up rui:data-[state=open]:animate-accordion-down rui:overflow-hidden rui:text-sm'
      {...props}
    >
      <div className={cn('rui:pt-0 rui:pb-4', className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };

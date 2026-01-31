import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@repo/utils';

const badgeVariants = cva(
  'rui:inline-flex rui:items-center rui:justify-center rui:rounded-full rui:border rui:px-3 rui:py-1 rui:text-[11px] rui:md:text-[13px] rui:font-medium rui:w-fit rui:whitespace-nowrap rui:shrink-0 rui:[&>svg]:size-3 rui:gap-1 rui:[&>svg]:pointer-events-none rui:focus-visible:border-ring rui:focus-visible:ring-ring/50 rui:focus-visible:ring-[3px] rui:aria-invalid:ring-destructive/20 rui:dark:aria-invalid:ring-destructive/40 rui:aria-invalid:border-destructive rui:transition-[color,box-shadow] rui:overflow-hidden',
  {
    variants: {
      variant: {
        default:
          'rui:border-transparent rui:bg-primary rui:text-primary-foreground rui:[a&]:hover:bg-primary/90',
        secondary:
          'rui:border-transparent rui:bg-secondary rui:text-secondary-foreground rui:[a&]:hover:bg-secondary/90',
        destructive:
          'rui:border-transparent rui:bg-destructive rui:text-white rui:[a&]:hover:bg-destructive/90 rui:focus-visible:ring-destructive/20 rui:dark:focus-visible:ring-destructive/40 rui:dark:bg-destructive/60',
        outline:
          'rui:text-foreground rui:[a&]:hover:bg-accent rui:[a&]:hover:text-accent-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span';

  return (
    <Comp data-slot='badge' className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

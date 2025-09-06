import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@repo/utils';

const buttonVariants = cva(
  'rui:inline-flex rui:items-center rui:justify-center rui:gap-2 rui:whitespace-nowrap rui:rounded-md rui:text-sm rui:font-medium rui:transition-all rui:disabled:pointer-events-none rui:disabled:opacity-50 rui:[&_svg]:pointer-events-none rui:[&_svg:not([class*=size-])]:size-4 rui:shrink-0 rui:[&_svg]:shrink-0 rui:outline-none rui:focus-visible:border-ring rui:focus-visible:ring-ring/50 rui:focus-visible:ring-[3px] rui:aria-invalid:ring-destructive/20 rui:dark:aria-invalid:ring-destructive/40 rui:aria-invalid:border-destructive',
  {
    variants: {
      variant: {
        default: 'rui:bg-primary rui:text-primary-foreground rui:shadow-xs rui:hover:bg-primary/90',
        destructive:
          'rui:bg-destructive rui:text-white rui:shadow-xs rui:hover:bg-destructive/90 rui:focus-visible:ring-destructive/20 rui:dark:focus-visible:ring-destructive/40 rui:dark:bg-destructive/60',
        outline:
          'rui:border rui:bg-background rui:shadow-xs rui:hover:bg-accent rui:hover:text-accent-foreground rui:dark:bg-input/30 rui:dark:border-input rui:dark:hover:bg-input/50',
        secondary:
          'rui:bg-secondary rui:text-secondary-foreground rui:shadow-xs rui:hover:bg-secondary/80',
        ghost: 'rui:hover:bg-accent rui:hover:text-accent-foreground rui:dark:hover:bg-accent/50',
        link: 'rui:text-primary rui:underline-offset-4 rui:hover:underline',
      },
      size: {
        default: 'rui:h-9 rui:px-4 rui:py-2 rui:has-[>svg]:px-3',
        sm: 'rui:h-8 rui:rounded-md rui:gap-1.5 rui:px-3 rui:has-[>svg]:px-2.5',
        lg: 'rui:h-10 rui:rounded-md rui:px-6 rui:has-[>svg]:px-4',
        icon: 'rui:size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot='button'
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };

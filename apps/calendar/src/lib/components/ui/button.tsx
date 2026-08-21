import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/**
 * デスクトップ(kintoneのレコード一覧・詳細画面)にのみマウントされるため、
 * Tailwindのユーティリティはデスクトップ用エントリ(`src/styles/desktop.css`)の
 * `rad:`プレフィックス付きで記述する。設定画面から読み込む場合はプレフィックス無しの
 * クラスを別途用意する必要がある。
 */
const buttonVariants = cva(
  'rad:inline-flex rad:items-center rad:justify-center rad:gap-2 rad:whitespace-nowrap rad:rounded-md rad:text-sm rad:font-medium rad:transition-colors rad:focus-visible:outline-hidden rad:focus-visible:ring-1 rad:focus-visible:ring-ring rad:disabled:pointer-events-none rad:disabled:opacity-50 rad:[&_svg]:pointer-events-none rad:[&_svg]:size-4 rad:[&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'rad:bg-primary rad:text-primary-foreground rad:shadow-sm rad:hover:bg-primary/90',
        destructive:
          'rad:bg-destructive rad:text-white rad:shadow-xs rad:hover:bg-destructive/90',
        outline:
          'rad:border rad:border-input rad:bg-background rad:shadow-xs rad:hover:bg-accent rad:hover:text-accent-foreground',
        secondary:
          'rad:bg-secondary rad:text-secondary-foreground rad:shadow-xs rad:hover:bg-secondary/80',
        ghost: 'rad:hover:bg-accent rad:hover:text-accent-foreground',
        link: 'rad:text-primary rad:underline-offset-4 rad:hover:underline',
      },
      size: {
        default: 'rad:h-9 rad:px-4 rad:py-2',
        sm: 'rad:h-8 rad:rounded-md rad:px-3 rad:text-xs',
        lg: 'rad:h-10 rad:rounded-md rad:px-8',
        icon: 'rad:h-9 rad:w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };

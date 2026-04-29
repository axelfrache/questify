import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[calc(var(--radius)-2px)] text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-[0_1px_2px_rgba(15,23,42,0.08),0_10px_24px_rgba(15,23,42,0.1)] hover:bg-primary/92 hover:shadow-[0_2px_6px_rgba(15,23,42,0.1),0_16px_36px_rgba(15,23,42,0.12)]',
        destructive:
          'bg-destructive text-white shadow-[0_10px_24px_rgba(220,38,38,0.18)] hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/70 dark:hover:bg-destructive/80',
        outline:
          'border border-border/80 bg-background/85 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(15,23,42,0.04)] backdrop-blur-sm hover:bg-muted/50 hover:text-foreground dark:border-white/10 dark:bg-white/6 dark:text-foreground dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_20px_rgba(0,0,0,0.22)] dark:hover:border-white/16 dark:hover:bg-white/10',
        secondary:
          'bg-secondary text-secondary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] hover:bg-secondary/88',
        ghost:
          'text-foreground/85 hover:bg-accent/80 hover:text-accent-foreground dark:text-foreground/78 dark:hover:bg-white/8 dark:hover:text-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-[calc(var(--radius)-4px)] gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-11 rounded-[calc(var(--radius)-1px)] px-6 has-[>svg]:px-4',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
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
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };

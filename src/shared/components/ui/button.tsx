import { TextClassContext } from '@/shared/components/ui/text';
import { cn } from '@/shared/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';

const buttonVariants = cva(
  cn(
    'group shrink-0 flex-row items-center justify-center gap-2 rounded-full shadow-none',
    Platform.select({
      web: "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive whitespace-nowrap outline-none transition-all focus-visible:ring-[3px] disabled:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
    })
  ),
  {
    variants: {
      variant: {
        default: cn(
          'bg-brand active:bg-brand-deep shadow-sm shadow-black/5',
          Platform.select({ web: 'hover:bg-brand-deep' })
        ),
        destructive: cn(
          'bg-destructive active:bg-destructive/90 dark:bg-destructive/60 shadow-sm shadow-black/5',
          Platform.select({
            web: 'hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
          })
        ),
        outline: cn(
          'border-outline-variant bg-transparent active:bg-accent border shadow-none',
          Platform.select({
            web: 'hover:bg-accent',
          })
        ),
        secondary: cn(
          'border border-white/10 bg-white/5 active:bg-white/10 shadow-none',
          Platform.select({ web: 'hover:bg-white/10' })
        ),
        tonal: cn(
          'shadow-sm shadow-primary/20',
          Platform.select({ web: 'hover:opacity-95' })
        ),
        surface: cn(
          'border-[#272732] bg-surface-container-low active:bg-surface-container border shadow-none',
          Platform.select({ web: 'hover:bg-surface-container' })
        ),
        ghost: cn(
          'active:bg-accent dark:active:bg-accent/50',
          Platform.select({ web: 'hover:bg-accent dark:hover:bg-accent/50' })
        ),
        link: '',
      },
      size: {
        default: cn('h-12 px-5 py-3', Platform.select({ web: 'has-[>svg]:px-4' })),
        sm: cn('h-10 gap-1.5 rounded-lg px-3.5', Platform.select({ web: 'has-[>svg]:px-2.5' })),
        lg: cn('h-14 rounded-xl px-6', Platform.select({ web: 'has-[>svg]:px-5' })),
        icon: 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const buttonTextVariants = cva(
  cn(
    'text-foreground text-[15px] font-semibold',
    Platform.select({ web: 'pointer-events-none transition-colors' })
  ),
  {
    variants: {
      variant: {
        default: 'text-ink',
        destructive: 'text-ink',
        outline: 'text-on-surface-variant',
        secondary: 'text-ink',
        tonal: 'text-on-primary',
        surface: 'text-on-surface',
        ghost: 'text-on-surface group-active:text-accent-foreground',
        link: cn(
          'text-brand group-active:underline',
          Platform.select({ web: 'underline-offset-4 hover:underline group-hover:underline' })
        ),
      },
      size: {
        default: '',
        sm: 'text-xs',
        lg: 'text-base',
        icon: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

type ButtonProps = React.ComponentProps<typeof Pressable> & React.RefAttributes<typeof Pressable> & VariantProps<typeof buttonVariants>;

function Button({ className, variant, size, style, ...props }: ButtonProps) {
  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
      <Pressable
        className={cn(props.disabled && 'opacity-50', buttonVariants({ variant, size }), className)}
        role="button"
        style={
          typeof style === 'function'
            ? (state) => [variant === 'tonal' && styles.tonalGradient, style(state)]
            : [variant === 'tonal' && styles.tonalGradient, style]
        }
        {...props}
      />
    </TextClassContext.Provider>
  );
}

const styles = StyleSheet.create({
  tonalGradient: {
    experimental_backgroundImage:
      'linear-gradient(to right, #A078FF 0%, #D0BCFF 50%, #D0BCFF 100%)',
  },
});

export { Button, buttonTextVariants, buttonVariants };
export type { ButtonProps };

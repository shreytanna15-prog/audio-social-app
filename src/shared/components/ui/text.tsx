import { cn } from '@/shared/lib/utils';
import { Slot } from '@rn-primitives/slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Platform, Text as RNText, type Role } from 'react-native';

const textVariants = cva(
  cn(
    'font-sans text-foreground text-base',
    Platform.select({
      web: 'select-text',
    })
  ),
  {
    variants: {
      variant: {
        default: 'font-sans text-base font-normal leading-6',
        // Studio Noir type scale
        'display-hero': 'font-display text-[48px] font-bold leading-[56px] tracking-tighter',
        'display-hero-mobile': 'font-display text-[32px] font-bold leading-[40px] tracking-tight',
        'headline-lg': 'font-display text-[32px] font-semibold leading-[40px] tracking-tight',
        'headline-lg-mobile': 'font-display text-2xl font-semibold leading-8 tracking-tight',
        'headline-md': 'font-display text-[22px] font-semibold leading-7 tracking-tight',
        'title-lg': 'font-sans text-[20px] font-semibold leading-7 tracking-tight',
        'title-md': 'font-sans text-base font-semibold leading-[22px]',
        'body-lg': 'font-sans text-base font-normal leading-6',
        'body-md': 'font-sans text-sm font-normal leading-5',
        'label-md': 'font-sans text-[13px] font-medium leading-[18px] tracking-wide',
        'label-sm': 'font-sans text-xs font-medium leading-4 tracking-wider',
        'mono-metric': 'font-display text-xs font-bold leading-[14px] tracking-widest',
        caption: 'font-sans text-[11px] font-normal leading-[14px] text-slate',
        // Legacy shadcn aliases
        h1: cn(
          'font-display text-center text-4xl font-bold tracking-tight',
          Platform.select({ web: 'scroll-m-20 text-balance' })
        ),
        h2: cn(
          'font-display border-border border-b pb-2 text-3xl font-semibold tracking-tight',
          Platform.select({ web: 'scroll-m-20 first:mt-0' })
        ),
        h3: cn(
          'font-display text-2xl font-semibold tracking-tight',
          Platform.select({ web: 'scroll-m-20' })
        ),
        h4: cn(
          'font-display text-xl font-semibold tracking-tight',
          Platform.select({ web: 'scroll-m-20' })
        ),
        p: 'font-sans mt-3 leading-7 sm:mt-6',
        blockquote: 'font-sans mt-4 border-l-2 pl-3 italic sm:mt-6 sm:pl-6',
        code: cn(
          'bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold'
        ),
        lead: 'font-sans text-muted-foreground text-xl',
        large: 'font-sans text-lg font-semibold',
        small: 'font-sans text-sm font-medium leading-none',
        muted: 'font-sans text-muted-foreground text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

type TextVariantProps = VariantProps<typeof textVariants>;

type TextVariant = NonNullable<TextVariantProps['variant']>;

const ROLE: Partial<Record<TextVariant, Role>> = {
  h1: 'heading',
  h2: 'heading',
  h3: 'heading',
  h4: 'heading',
  'display-hero': 'heading',
  'display-hero-mobile': 'heading',
  'headline-lg': 'heading',
  'headline-lg-mobile': 'heading',
  'headline-md': 'heading',
  'title-lg': 'heading',
  'title-md': 'heading',
  blockquote: Platform.select({ web: 'blockquote' as Role }),
  code: Platform.select({ web: 'code' as Role }),
};

const ARIA_LEVEL: Partial<Record<TextVariant, string>> = {
  h1: '1',
  h2: '2',
  h3: '3',
  h4: '4',
  'display-hero': '1',
  'display-hero-mobile': '1',
  'headline-lg': '2',
  'headline-lg-mobile': '2',
  'headline-md': '2',
  'title-lg': '3',
  'title-md': '3',
};

const TextClassContext = React.createContext<string | undefined>(undefined);

function Text({
  className,
  asChild = false,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof RNText> &
  React.RefAttributes<typeof RNText> &
  TextVariantProps & {
    asChild?: boolean;
  }) {
  const textClass = React.useContext(TextClassContext);
  const Component = asChild ? Slot : RNText;
  return (
    <Component
      className={cn(textVariants({ variant }), textClass, className)}
      role={variant ? ROLE[variant] : undefined}
      aria-level={variant ? ARIA_LEVEL[variant] : undefined}
      {...props}
    />
  );
}

export { Text, TextClassContext };

import { cn } from '@/shared/lib/utils';
import type * as React from 'react';
import { Platform, TextInput } from 'react-native';

/**
 * Multiline text field — same visual language as `Input` (React Native Reusables pattern).
 */
function Textarea({
  className,
  multiline = true,
  numberOfLines = Platform.select({ web: 4, native: 6 }),
  ...props
}: React.ComponentProps<typeof TextInput> & React.RefAttributes<TextInput>) {
  return (
    <TextInput
      className={cn(
        'border-hairline bg-canvas text-foreground w-full rounded-2xl border p-4 text-[16px] font-sans',
        Platform.select({
          native: 'min-h-28',
          web: 'min-h-24 outline-none transition-[color,box-shadow] md:text-sm',
        }),
        props.editable === false &&
          cn(
            'opacity-50',
            Platform.select({
              web: 'disabled:pointer-events-none disabled:cursor-not-allowed',
            }),
          ),
        Platform.select({
          web: cn(
            'placeholder:text-slate selection:bg-brand selection:text-ink',
            'focus-visible:border-brand focus-visible:ring-brand/30 focus-visible:ring-[3px]',
            'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
            'field-sizing-content resize-y',
          ),
          native: 'placeholder:text-slate',
        }),
        className,
      )}
      placeholderTextColor={Platform.OS === 'web' ? undefined : '#94A3B8'}
      multiline={multiline}
      numberOfLines={numberOfLines}
      textAlignVertical="top"
      {...props}
    />
  );
}

export { Textarea };

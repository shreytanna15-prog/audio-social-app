import * as React from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';
import { cn } from '@/shared/lib/utils';

type RadioGroupContextValue = {
  value: string | null;
  onValueChange: (value: string) => void;
  disabled?: boolean;
};

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(
  null,
);

function useRadioGroupContext() {
  const ctx = React.useContext(RadioGroupContext);
  if (!ctx) {
    throw new Error('Radio components must be used within <RadioGroup>.');
  }
  return ctx;
}

type RadioGroupProps = {
  value: string | null;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
};

function RadioGroup({
  value,
  onValueChange,
  disabled = false,
  children,
  className,
}: RadioGroupProps) {
  const context = React.useMemo(
    () => ({ value, onValueChange, disabled }),
    [disabled, onValueChange, value],
  );

  return (
    <RadioGroupContext.Provider value={context}>
      <View
        accessibilityRole="radiogroup"
        className={cn('gap-2', className)}>
        {children}
      </View>
    </RadioGroupContext.Provider>
  );
}

type RadioProps = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
  /** `compact` — denser rows for dialogs / tight forms. */
  size?: 'default' | 'compact';
  className?: string;
};

function Radio({
  value,
  label,
  description,
  disabled = false,
  size = 'default',
  className,
}: RadioProps) {
  const group = useRadioGroupContext();
  const selected = group.value === value;
  const isDisabled = disabled || Boolean(group.disabled);
  const compact = size === 'compact';

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled: isDisabled }}
      accessibilityLabel={label}
      disabled={isDisabled}
      onPress={() => group.onValueChange(value)}
      className={cn(
        'flex-row items-center border',
        compact
          ? 'min-h-10 gap-2.5 rounded-xl px-3 py-2'
          : 'min-h-12 gap-3 rounded-2xl px-3.5 py-3',
        selected
          ? 'border-primary/45 bg-primary/15'
          : 'border-white/10 bg-surface-container',
        isDisabled ? 'opacity-45' : 'active:opacity-85',
        className,
      )}>
      <View
        className={cn(
          'items-center justify-center rounded-full border-2',
          compact ? 'h-4 w-4' : 'h-5 w-5',
          selected ? 'border-primary' : 'border-outline-variant',
        )}>
        {selected ? (
          <View
            className={cn(
              'rounded-full bg-primary',
              compact ? 'h-2 w-2' : 'h-2.5 w-2.5',
            )}
          />
        ) : null}
      </View>

      <View className="min-w-0 flex-1 gap-0.5">
        <Text
          variant="label-md"
          className={cn(
            'text-on-surface',
            selected ? 'font-semibold' : undefined,
          )}>
          {label}
        </Text>
        {description ? (
          <Text variant="caption" className="text-on-surface-variant">
            {description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export { Radio, RadioGroup };
export type { RadioGroupProps, RadioProps };

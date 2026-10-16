import * as React from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';
import { cn } from '@/shared/lib/utils';

type RadioGroupContextValue = {
  value: string | null;
  onValueChange: (value: string) => void;
  disabled?: boolean;
};

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(null);

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
  className?: string;
};

function Radio({
  value,
  label,
  description,
  disabled = false,
  className,
}: RadioProps) {
  const group = useRadioGroupContext();
  const selected = group.value === value;
  const isDisabled = disabled || Boolean(group.disabled);

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled: isDisabled }}
      accessibilityLabel={label}
      disabled={isDisabled}
      onPress={() => group.onValueChange(value)}
      className={cn(
        'min-h-12 flex-row items-center gap-3 rounded-2xl border px-3.5 py-3',
        selected
          ? 'border-primary/45 bg-primary/15'
          : 'border-white/10 bg-surface-container',
        isDisabled ? 'opacity-45' : 'active:opacity-85',
        className,
      )}>
      <View className="min-w-0 flex-1 gap-0.5">
        <Text
          variant="label-md"
          className={cn(
            selected ? 'text-on-surface' : 'text-on-surface',
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

      <View
        className={cn(
          'h-5 w-5 items-center justify-center rounded-full border-2',
          selected ? 'border-primary' : 'border-outline-variant',
        )}>
        {selected ? (
          <View className="h-2.5 w-2.5 rounded-full bg-primary" />
        ) : null}
      </View>
    </Pressable>
  );
}

export { Radio, RadioGroup };
export type { RadioGroupProps, RadioProps };

import type { ReactNode } from 'react';
import { Pressable, ScrollView } from 'react-native';

import { Radio, RadioGroup } from '@/shared/components/ui/radio';
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/shared/components/ui/sheet';
import { Text } from '@/shared/components/ui/text';

export type EffectPresetOption = {
  id: string;
  label: string;
  description?: string;
};

type EffectPresetSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  options: EffectPresetOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClear?: () => void;
  clearLabel?: string;
  footer?: ReactNode;
};

/**
 * Studio Noir preset picker — shared chrome for FX / Comp / EQ / Echo / Reverb.
 */
export function EffectPresetSheet({
  open,
  onOpenChange,
  title,
  description = 'Choose a preset, easy to undo with Reset.',
  options,
  selectedId,
  onSelect,
  onClear,
  clearLabel,
  footer,
}: EffectPresetSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent useModal className="max-h-[85%]">
        <SheetClose />
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description ? (
            <SheetDescription>{description}</SheetDescription>
          ) : null}
        </SheetHeader>

        <SheetBody className="gap-4">
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="gap-2 pb-1">
            <RadioGroup
              value={selectedId}
              onValueChange={(id) => {
                onSelect(id);
              }}>
              {options.map((option) => (
                <Radio
                  key={option.id}
                  value={option.id}
                  label={option.label}
                  description={option.description}
                />
              ))}
            </RadioGroup>
          </ScrollView>

          {footer}

          {selectedId && onClear ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={clearLabel ?? `Turn off ${title}`}
              onPress={onClear}
              className="items-center rounded-2xl py-3 active:bg-white/5">
              <Text variant="label-md" className="text-on-surface-variant">
                {clearLabel ?? `Turn off ${title.toLowerCase()}`}
              </Text>
            </Pressable>
          ) : null}
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}

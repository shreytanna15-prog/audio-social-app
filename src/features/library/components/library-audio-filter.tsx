import { Check, ChevronDown } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

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

import type { LibraryAudioFilter } from '../types';

const FILTERS: { id: LibraryAudioFilter; label: string; description: string }[] =
  [
    { id: 'all', label: 'All', description: 'Every track in your archive' },
    { id: 'SINGLE', label: 'Single', description: 'Single-layer tracks' },
    { id: 'MULTI', label: 'Multi', description: 'Layered studio sessions' },
    { id: 'PUBLISHED', label: 'Published', description: 'Live on your profile' },
    { id: 'DRAFT', label: 'Draft', description: 'Not published yet' },
  ];

type LibraryAudioFilterProps = {
  value: LibraryAudioFilter;
  onChange: (value: LibraryAudioFilter) => void;
};

export function LibraryAudioFilterControl({
  value,
  onChange,
}: LibraryAudioFilterProps) {
  const [open, setOpen] = useState(false);
  const activeLabel = FILTERS.find((item) => item.id === value)?.label ?? 'All';

  const selectFilter = (next: LibraryAudioFilter) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`Filter: ${activeLabel}`}
        className="flex-row items-center gap-1 rounded-full border border-white/10 px-2.5 py-1.5"
        style={{ borderCurve: 'continuous' }}>
        <View className="flex-row items-center">
          <Text variant="caption" className="text-on-surface-variant">
            Filter:{' '}
          </Text>
          <Text variant="caption" className="font-semibold text-on-surface">
            {activeLabel}
          </Text>
        </View>
        <ChevronDown size={14} color="#958EA0" strokeWidth={2} />
      </Pressable>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent useModal className="bg-[#17171D]">
          <SheetClose />
          <SheetHeader>
            <SheetTitle>Filter tracks</SheetTitle>
            <SheetDescription>
              Narrow tracks by type or status.
            </SheetDescription>
          </SheetHeader>

          <SheetBody>
            <View className="gap-1">
              {FILTERS.map((item) => {
                const selected = item.id === value;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => selectFilter(item.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={item.label}
                    className="flex-row items-center gap-3 rounded-xl px-2 py-3.5 active:bg-white/5"
                    style={{ borderCurve: 'continuous' }}>
                    <View className="min-w-0 flex-1 gap-0.5">
                      <Text
                        variant="title-md"
                        className={
                          selected ? 'text-on-surface' : 'text-on-surface-variant'
                        }>
                        {item.label}
                      </Text>
                      <Text variant="caption" className="text-on-surface-variant">
                        {item.description}
                      </Text>
                    </View>
                    {selected ? (
                      <Check size={18} color="#D0BCFF" strokeWidth={2.4} />
                    ) : (
                      <View className="h-4.5 w-4.5" />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </SheetBody>
        </SheetContent>
      </Sheet>
    </>
  );
}

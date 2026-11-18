import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

type LibrarySectionHeaderProps = {
  label: string;
  /** Omit to hide the count pill (e.g. Audio "Tracks"). */
  count?: number;
  trailing?: ReactNode;
};

export function LibrarySectionHeader({
  label,
  count,
  trailing,
}: LibrarySectionHeaderProps) {
  return (
    <View className="min-h-10 flex-row items-center justify-between gap-3 px-4">
      <View className="min-w-0 flex-1 flex-row flex-wrap items-center gap-2">
        <Text variant="title-md" className="text-on-surface">
          {label}
        </Text>
        {count != null ? (
          <View className="rounded-full bg-surface-container-highest px-2 py-0.5">
            <Text className="font-sans text-[11px] font-semibold leading-4 text-on-surface-variant">
              {count}
            </Text>
          </View>
        ) : null}
      </View>
      {trailing ? (
        <View className="h-9 flex-row items-center gap-2">{trailing}</View>
      ) : null}
    </View>
  );
}

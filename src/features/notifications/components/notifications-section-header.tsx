import { View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

const ACCENT = '#D0BCFF';

type NotificationsSectionHeaderProps = {
  title?: string;
  statusLabel?: string;
};

export function NotificationsSectionHeader({
  title = 'Live Studio Activity',
  statusLabel = 'Real-time sync',
}: NotificationsSectionHeaderProps) {
  return (
    <View className="flex-row items-center justify-between gap-3 px-5 pb-2 pt-4">
      <View className="min-w-0 flex-1 flex-row items-center gap-2">
        <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: ACCENT }} />
        <Text
          className="font-sans text-[11px] font-semibold uppercase leading-4 tracking-widest"
          style={{ color: ACCENT }}
          numberOfLines={1}>
          {title}
        </Text>
      </View>
      <Text
        className="shrink-0 font-sans text-[11px] font-medium leading-4 text-on-surface-variant"
        numberOfLines={1}>
        {statusLabel}
      </Text>
    </View>
  );
}

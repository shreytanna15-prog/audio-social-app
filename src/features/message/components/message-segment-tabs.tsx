import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import { RequestCountBadge } from './request-count-badge';

const ACCENT = '#D0BCFF';

type Segment = 'messages' | 'requests';

type MessageSegmentTabsProps = {
  active: Segment;
  requestCount: number;
  onChange: (segment: Segment) => void;
};

export function MessageSegmentTabs({
  active,
  requestCount,
  onChange,
}: MessageSegmentTabsProps) {
  return (
    <View className="mx-4 flex-row border-b border-white/8">
      <SegmentTab
        label="Messages"
        selected={active === 'messages'}
        onPress={() => onChange('messages')}
      />
      <SegmentTab
        label="Requests"
        selected={active === 'requests'}
        badgeCount={requestCount}
        onPress={() => onChange('requests')}
      />
    </View>
  );
}

function SegmentTab({
  label,
  selected,
  badgeCount,
  onPress,
}: {
  label: string;
  selected: boolean;
  badgeCount?: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={
        badgeCount && badgeCount > 0 ? `${label}, ${badgeCount} pending` : label
      }
      className="mr-6 items-center pb-2.5 pt-1">
      <View className="flex-row items-center gap-2">
        <Text
          variant="title-md"
          className={selected ? 'font-semibold text-on-surface' : 'text-on-surface-variant'}>
          {label}
        </Text>
        {badgeCount != null && badgeCount > 0 ? (
          <RequestCountBadge count={badgeCount} />
        ) : null}
      </View>
      <View
        className="absolute bottom-0 h-[3px] w-full rounded-full"
        style={{ backgroundColor: selected ? ACCENT : 'transparent' }}
      />
    </Pressable>
  );
}

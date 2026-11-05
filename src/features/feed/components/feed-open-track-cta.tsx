import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import {
  FeedOpenTrackChevronIcon,
  FeedOpenTrackLevelsIcon,
  FeedOpenTrackPlayIcon,
} from './feed-open-track-icons';

/** Figma open-full-track: #D0BCFF, #3C0091 type/icons, 44 tall, rx 12. */
const CTA_BG = '#D0BCFF';
const CTA_FG = '#3C0091';

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

type FeedOpenTrackCtaProps = {
  durationSec: number;
  onOpenPress: () => void;
  onLevelsPress?: () => void;
};

export function FeedOpenTrackCta({
  durationSec,
  onOpenPress,
  onLevelsPress,
}: FeedOpenTrackCtaProps) {
  return (
    <View className="flex-row items-center gap-2">
      <Pressable
        onPress={onOpenPress}
        accessibilityRole="button"
        accessibilityLabel="Open full track"
        className="h-[52px] min-w-0 flex-1 flex-row items-center"
        style={{
          backgroundColor: CTA_BG,
          borderRadius: 12,
          paddingHorizontal: 16,
          gap: 12,
          boxShadow: '0 0 20px rgba(208, 188, 255, 0.3)',
        }}>
        <FeedOpenTrackPlayIcon />
        <Text
          className="min-w-0 flex-1 font-sans text-[15px] font-medium leading-5 tracking-tight"
          style={{ color: CTA_FG }}>
          Open Full Track
        </Text>
        <View className="flex-row items-center gap-1.5">
          <Text
            className="font-sans text-[12px] font-normal leading-4"
            style={{ color: CTA_FG, opacity: 0.85 }}>
            {formatDuration(durationSec)}
          </Text>
          <FeedOpenTrackChevronIcon />
        </View>
      </Pressable>

      <Pressable
        onPress={onLevelsPress}
        accessibilityRole="button"
        accessibilityLabel="Audio levels"
        style={{
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        }}>
        <FeedOpenTrackLevelsIcon />
      </Pressable>
    </View>
  );
}

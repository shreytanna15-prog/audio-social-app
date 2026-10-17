import { Image } from 'expo-image';
import { MoreVertical } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';
import { PlayIcon } from '@/shared/SVGs/play-icon';

import type { ArtistTrack } from '../types';

const ICON = '#E4E1EA';
const CARD_BG = '#1F1F25';
const META = '#958EA0';

type ArtistTrackRowProps = {
  track: ArtistTrack;
  onPress: () => void;
  onPlayPress: () => void;
  onMorePress: () => void;
};

/** Figma: rounded card · cover · title (up to 2 lines) · duration • plays · play + more */
export function ArtistTrackRow({
  track,
  onPress,
  onPlayPress,
  onMorePress,
}: ArtistTrackRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${track.title}, ${track.durationLabel}, ${track.playsLabel}`}
      className="mx-4 flex-row items-center gap-3 rounded-xl px-3 py-3"
      style={{ backgroundColor: CARD_BG }}>
      <View className="h-14 w-14 overflow-hidden rounded-lg bg-surface-container-high">
        <Image
          source={{ uri: track.coverUrl }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          recyclingKey={track.id}
        />
      </View>

      <View className="min-w-0 flex-1 gap-1">
        <Text
          className="font-sans text-[16px] font-semibold leading-[22px] tracking-tight text-ink"
          numberOfLines={2}>
          {track.title}
        </Text>
        <Text
          className="font-sans text-[13px] font-normal leading-[18px]"
          style={{ color: META }}
          numberOfLines={1}>
          {track.durationLabel} • {track.playsLabel}
        </Text>
      </View>

      <View className="flex-row items-center gap-1">
        <Pressable
          onPress={onPlayPress}
          accessibilityRole="button"
          accessibilityLabel={`Play ${track.title}`}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center">
          <PlayIcon color={ICON} />
        </Pressable>
        <Pressable
          onPress={onMorePress}
          accessibilityRole="button"
          accessibilityLabel={`More options for ${track.title}`}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center">
          <MoreVertical size={18} color={ICON} strokeWidth={1.8} />
        </Pressable>
      </View>
    </Pressable>
  );
}

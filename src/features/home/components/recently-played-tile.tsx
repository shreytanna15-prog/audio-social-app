import { Image } from 'expo-image';
import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import type { RecentlyPlayedTrack } from '../data/recently-played';

type RecentlyPlayedTileProps = {
  track: RecentlyPlayedTrack;
  onPress?: () => void;
};

export function RecentlyPlayedTile({ track, onPress }: RecentlyPlayedTileProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${track.title} by ${track.artist}`}
      className="min-w-0 flex-1 flex-row items-center gap-2.5 rounded-2xl border border-white/5 bg-surface-container p-2">
      <View className="h-12 w-12 overflow-hidden rounded-xl bg-surface-container-high">
        <Image
          source={{ uri: track.coverUrl }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          recyclingKey={track.id}
        />
      </View>
      <View className="min-w-0 flex-1 gap-0.5">
        <Text variant="title-md" className="text-on-surface" numberOfLines={1}>
          {track.title}
        </Text>
        <Text variant="caption" className="text-on-surface-variant" numberOfLines={1}>
          {track.artist}
        </Text>
      </View>
    </Pressable>
  );
}

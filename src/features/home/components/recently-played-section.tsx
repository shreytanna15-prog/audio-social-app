import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import { RECENTLY_PLAYED, type RecentlyPlayedTrack } from '../data/recently-played';
import { RecentlyPlayedTile } from './recently-played-tile';

type RecentlyPlayedSectionProps = {
  tracks?: RecentlyPlayedTrack[];
  onHistoryPress?: () => void;
  onTrackPress?: (track: RecentlyPlayedTrack) => void;
};

export function RecentlyPlayedSection({
  tracks = RECENTLY_PLAYED,
  onHistoryPress,
  onTrackPress,
}: RecentlyPlayedSectionProps) {
  const topRow = tracks.slice(0, 2);
  const bottomRow = tracks.slice(2, 4);

  return (
    <View className="gap-4 px-4">
      <View className="flex-row items-center justify-between gap-3">
        <Text variant="title-lg" className="flex-1 text-on-surface" numberOfLines={1}>
          Recently Played
        </Text>
        <Pressable onPress={onHistoryPress} accessibilityRole="link" hitSlop={8}>
          <Text variant="label-md" className="text-on-surface-variant">
            History
          </Text>
        </Pressable>
      </View>

      <View className="gap-2.5">
        <View className="flex-row gap-2.5">
          {topRow.map((track) => (
            <RecentlyPlayedTile
              key={track.id}
              track={track}
              onPress={onTrackPress ? () => onTrackPress(track) : undefined}
            />
          ))}
        </View>
        <View className="flex-row gap-2.5">
          {bottomRow.map((track) => (
            <RecentlyPlayedTile
              key={track.id}
              track={track}
              onPress={onTrackPress ? () => onTrackPress(track) : undefined}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

import { View } from 'react-native';

import { Text } from '@/shared/components/ui/text';
import { TRENDING_TRACKS, type TrendingTrack } from '@/shared/data/trending-tracks';

import { TrendingTrackRow } from './trending-track-row';

type TrendingSectionProps = {
  title?: string;
  tracks?: TrendingTrack[];
  onTrackPress?: (track: TrendingTrack) => void;
  onLikePress?: (track: TrendingTrack) => void;
  onMorePress?: (track: TrendingTrack) => void;
};

export function TrendingSection({
  title = 'Trending',
  tracks = TRENDING_TRACKS,
  onTrackPress,
  onLikePress,
  onMorePress,
}: TrendingSectionProps) {
  return (
    <View className="gap-4 px-4">
      <Text variant="title-lg" className="text-on-surface" numberOfLines={1}>
        {title}
      </Text>

      <View className="gap-2.5">
        {tracks.map((track) => (
          <TrendingTrackRow
            key={track.id}
            track={track}
            onPress={onTrackPress ? () => onTrackPress(track) : undefined}
            onLikePress={onLikePress ? () => onLikePress(track) : undefined}
            onMorePress={onMorePress ? () => onMorePress(track) : undefined}
          />
        ))}
      </View>
    </View>
  );
}

import { Flame } from 'lucide-react-native';
import { View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import { TRENDING_TRACKS, type TrendingTrack } from '../data/trending-tracks';
import { TrendingTrackRow } from './trending-track-row';

type TrendingSectionProps = {
  tracks?: TrendingTrack[];
  onTrackPress?: (track: TrendingTrack) => void;
  onLikePress?: (track: TrendingTrack) => void;
  onMorePress?: (track: TrendingTrack) => void;
};

export function TrendingSection({
  tracks = TRENDING_TRACKS,
  onTrackPress,
  onLikePress,
  onMorePress,
}: TrendingSectionProps) {
  return (
    <View className="gap-4 px-4">
      <View className="flex-row items-center justify-between gap-3">
        <View className="min-w-0 flex-1 flex-row items-center gap-2">
          <Flame size={18} color="#D0BCFF" strokeWidth={2} />
          <Text variant="title-lg" className="text-on-surface" numberOfLines={1}>
            Trending Right Now
          </Text>
        </View>
        <Text variant="label-sm" className="shrink-0 uppercase text-on-surface-variant">
          Global Heat
        </Text>
      </View>

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

import { Flame } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';
import { TRENDING_TRACKS, type TrendingTrack } from '@/shared/data/trending-tracks';

import { TrendingTrackRow } from './trending-track-row';

type TrendingSectionProps = {
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  actionLabel?: string;
  showFlame?: boolean;
  tracks?: TrendingTrack[];
  onActionPress?: () => void;
  onTrackPress?: (track: TrendingTrack) => void;
  onLikePress?: (track: TrendingTrack) => void;
  onMorePress?: (track: TrendingTrack) => void;
};

export function TrendingSection({
  title = 'Trending Right Now',
  subtitle,
  eyebrow = 'Global Heat',
  actionLabel,
  showFlame = true,
  tracks = TRENDING_TRACKS,
  onActionPress,
  onTrackPress,
  onLikePress,
  onMorePress,
}: TrendingSectionProps) {
  const useStackedHeader = Boolean(subtitle || actionLabel);

  return (
    <View className="gap-4 px-4">
      {useStackedHeader ? (
        <View className="flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1 gap-1">
            <Text variant="title-lg" className="text-on-surface">
              {title}
            </Text>
            {subtitle ? (
              <Text variant="body-md" className="text-on-surface-variant">
                {subtitle}
              </Text>
            ) : null}
          </View>
          {actionLabel ? (
            <Pressable onPress={onActionPress} accessibilityRole="link" hitSlop={8} className="mt-0.5">
              <Text variant="label-md" className="font-semibold text-primary-tonal">
                {actionLabel}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <View className="flex-row items-center justify-between gap-3">
          <View className="min-w-0 flex-1 flex-row items-center gap-2">
            {showFlame ? <Flame size={18} color="#D0BCFF" strokeWidth={2} /> : null}
            <Text variant="title-lg" className="text-on-surface" numberOfLines={1}>
              {title}
            </Text>
          </View>
          {eyebrow ? (
            <Text variant="label-sm" className="shrink-0 uppercase text-on-surface-variant">
              {eyebrow}
            </Text>
          ) : null}
        </View>
      )}

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

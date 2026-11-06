import { Image } from 'expo-image';
import { Check, Heart, MoreVertical } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';
import type { TrendingTrack } from '@/shared/data/trending-tracks';

type TrendingTrackRowProps = {
  track: TrendingTrack;
  onPress?: () => void;
  onLikePress?: () => void;
  onMorePress?: () => void;
};

function formatRank(rank: number): string {
  return String(rank).padStart(2, '0');
}

export function TrendingTrackRow({
  track,
  onPress,
  onLikePress,
  onMorePress,
}: TrendingTrackRowProps) {
  // Split row press vs like/more so web does not nest <button> inside <button>.
  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-white/5 bg-surface-container px-3 py-3">
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${track.title} by ${track.artist}, rank ${track.rank}`}
        className="min-w-0 flex-1 flex-row items-center gap-3">
        <Text
          variant="title-lg"
          className="w-8 text-center font-bold text-primary-tonal"
          style={{ textShadowColor: 'rgba(208, 188, 255, 0.45)', textShadowRadius: 8 }}>
          {formatRank(track.rank)}
        </Text>

        <View className="h-14 w-14 overflow-hidden rounded-xl bg-surface-container-high">
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

          <View className="flex-row items-center gap-1.5">
            <Text variant="body-md" className="shrink text-on-surface-variant" numberOfLines={1}>
              {track.artist}
            </Text>
            {track.verified ? (
              <View className="h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[#4C8DFF]">
                <Check size={8} color="#FFFFFF" strokeWidth={3} />
              </View>
            ) : null}
          </View>

          <Text variant="caption" className="text-on-surface-variant" numberOfLines={1}>
            {track.playsLabel} • {track.remixesLabel}
          </Text>
        </View>
      </Pressable>

      <View className="flex-row items-center gap-1">
        <Pressable
          onPress={onLikePress}
          accessibilityRole="button"
          accessibilityLabel={`Like ${track.title}`}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center">
          <Heart size={18} color="#CBC3D7" strokeWidth={1.8} />
        </Pressable>
        <Pressable
          onPress={onMorePress}
          accessibilityRole="button"
          accessibilityLabel={`More options for ${track.title}`}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center">
          <MoreVertical size={18} color="#CBC3D7" strokeWidth={1.8} />
        </Pressable>
      </View>
    </View>
  );
}

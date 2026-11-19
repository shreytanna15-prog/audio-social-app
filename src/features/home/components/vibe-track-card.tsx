import { Image } from 'expo-image';
import { Play } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import type { VibeTrack } from '../data/made-for-your-vibe';

const CARD_WIDTH = 268;
const COVER_SIZE = 268;

type VibeTrackCardProps = {
  track: VibeTrack;
  onPress?: () => void;
  onPlayPress?: () => void;
};

export function VibeTrackCard({ track, onPress, onPlayPress }: VibeTrackCardProps) {
  const pillClass =
    track.primaryTagTone === 'pink'
      ? 'bg-secondary-container'
      : 'bg-primary-container';

  return (
    <View
      className="relative overflow-hidden rounded-2xl border border-white/5 bg-surface-container"
      style={{ width: CARD_WIDTH }}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${track.title} by ${track.artist}`}>
        <View style={{ width: COVER_SIZE, height: COVER_SIZE }} className="relative">
          <Image
            source={{ uri: track.coverUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            recyclingKey={track.id}
          />

          <View className="absolute inset-x-0 bottom-0 h-20 bg-black/35" />

          {track.bpm != null && track.key ? (
            <View className="absolute bottom-3 left-3 rounded-full bg-black/55 px-2.5 py-1">
              <Text variant="caption" className="font-medium text-on-surface">
                {track.bpm} BPM • {track.key}
              </Text>
            </View>
          ) : null}
        </View>

        <View className="gap-2 px-3.5 pb-3.5 pt-7">
          <View className="gap-0.5">
            <Text variant="title-md" className="text-on-surface" numberOfLines={1}>
              {track.title}
            </Text>
            <Text variant="body-md" className="text-on-surface-variant" numberOfLines={1}>
              {track.artist}
            </Text>
          </View>

          <View className="flex-row flex-wrap items-center gap-2">
            <View className={`rounded-full px-2.5 py-1 ${pillClass}`}>
              <Text variant="caption" className="font-medium text-on-surface">
                {track.primaryTag}
              </Text>
            </View>
            {track.secondaryTag ? (
              <Text variant="caption" className="text-on-surface-variant">
                {track.secondaryTag}
              </Text>
            ) : null}
          </View>
        </View>
      </Pressable>

      <Pressable
        onPress={onPlayPress}
        accessibilityRole="button"
        accessibilityLabel={`Play ${track.title}`}
        hitSlop={6}
        className="absolute z-10 h-11 w-11 items-center justify-center rounded-full bg-primary-tonal"
        style={{
          top: COVER_SIZE - 22,
          right: 12,
          boxShadow: '0 4px 12px rgba(160, 120, 255, 0.35)',
        }}>
        <Play size={18} color="#3C0091" strokeWidth={2.4} fill="#3C0091" />
      </Pressable>
    </View>
  );
}

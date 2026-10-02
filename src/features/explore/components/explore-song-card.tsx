import { Image } from 'expo-image';
import { Flame, Play } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import type { FeaturedSong } from '../data/featured-song';

const CARD_HEIGHT = 220;
const BADGE_GOLD = '#F5D78E';
const CATEGORY_GOLD = '#F0C674';

type ExploreSongCardProps = {
  song: FeaturedSong;
  onPress?: () => void;
  onPlayPress?: () => void;
};

export function ExploreSongCard({ song, onPress, onPlayPress }: ExploreSongCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${song.title}. ${song.description}`}
      className="mx-4 overflow-hidden rounded-3xl bg-surface-container"
      style={{ height: CARD_HEIGHT }}>
      <Image
        source={{ uri: song.coverUrl }}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        recyclingKey={song.id}
      />

      <View
        className="absolute inset-0"
        style={{
          experimental_backgroundImage:
            'linear-gradient(to top, rgba(8,6,14,0.92) 0%, rgba(8,6,14,0.45) 42%, rgba(8,6,14,0.12) 100%)',
        }}
      />

      <View className="absolute right-3 top-3 flex-row items-center gap-1.5 rounded-full border border-[#F5D78E]/40 bg-black/55 px-2.5 py-1.5">
        <Flame size={12} color={BADGE_GOLD} strokeWidth={2.4} fill={BADGE_GOLD} />
        <Text variant="caption" className="font-semibold" style={{ color: BADGE_GOLD }}>
          {song.badgeLabel}
        </Text>
      </View>

      <View className="absolute inset-x-0 bottom-0 flex-row items-end justify-between gap-3 p-4">
        <View className="min-w-0 flex-1 gap-1">
          <Text
            variant="label-sm"
            className="font-bold uppercase tracking-wider"
            style={{ color: CATEGORY_GOLD }}>
            {song.category}
          </Text>
          <Text variant="headline-md" className="text-on-surface" numberOfLines={1}>
            {song.title}
          </Text>
          <Text variant="body-md" className="text-on-surface" numberOfLines={2}>
            {song.description}
          </Text>
        </View>

        <Pressable
          onPress={onPlayPress}
          accessibilityRole="button"
          accessibilityLabel={`Play ${song.title}`}
          hitSlop={6}
          className="mb-0.5 h-12 w-12 items-center justify-center rounded-full bg-black/55"
          style={{ boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)' }}>
          <Play size={20} color="#FFFFFF" strokeWidth={2.4} fill="#FFFFFF" />
        </Pressable>
      </View>
    </Pressable>
  );
}

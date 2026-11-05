import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Heart, Pause, Play, SkipForward } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import { usePlayerStore } from '../store/player.store';

export function MiniPlayer() {
  const { push } = useRouter();
  const track = usePlayerStore((s) => s.track);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const progress = usePlayerStore((s) => s.progress);
  const isLiked = usePlayerStore((s) => s.isLiked);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const next = usePlayerStore((s) => s.next);
  const toggleLike = usePlayerStore((s) => s.toggleLike);

  if (!track) return null;

  return (
    <Pressable
      onPress={() => push('/player')}
      accessibilityRole="button"
      accessibilityLabel={`Open now playing for ${track.title}`}
      className="mx-3 mb-2 overflow-hidden rounded-2xl border border-white/5 bg-surface-container">
      <View className="h-0.5 w-full bg-surface-container-highest">
        <View
          className="h-full rounded-full bg-primary-tonal"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </View>

      <View className="flex-row items-center gap-3 px-3 py-2.5">
        <View className="h-11 w-11 overflow-hidden rounded-xl bg-surface-container-high">
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
          <Text
            variant="caption"
            className={
              track.artist.startsWith('Now Playing')
                ? 'text-primary-tonal'
                : 'text-on-surface-variant'
            }
            numberOfLines={1}>
            {track.artist}
          </Text>
        </View>

        <View className="flex-row items-center gap-1">
          <Pressable
            onPress={toggleLike}
            accessibilityRole="button"
            accessibilityLabel={isLiked ? 'Unlike' : 'Like'}
            hitSlop={8}
            className="h-9 w-9 items-center justify-center">
            <Heart
              size={18}
              color={isLiked ? '#FFB0CD' : '#CBC3D7'}
              strokeWidth={1.8}
              fill={isLiked ? '#FFB0CD' : 'transparent'}
            />
          </Pressable>

          <Pressable
            onPress={togglePlay}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
            className="h-10 w-10 items-center justify-center rounded-full bg-primary-tonal">
            {isPlaying ? (
              <Pause size={18} color="#3C0091" strokeWidth={2.4} fill="#3C0091" />
            ) : (
              <Play size={18} color="#3C0091" strokeWidth={2.4} fill="#3C0091" />
            )}
          </Pressable>

          <Pressable
            onPress={next}
            accessibilityRole="button"
            accessibilityLabel="Next track"
            hitSlop={8}
            className="h-9 w-9 items-center justify-center">
            <SkipForward size={18} color="#CBC3D7" strokeWidth={1.8} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

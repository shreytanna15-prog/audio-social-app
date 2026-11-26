import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Heart, Pause, Play, SkipForward, X } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { isApiTrackId } from '@/features/saves';
import { Text } from '@/shared/components/ui/text';

import { usePlayerStore } from '../store/player.store';

export function MiniPlayer() {
  const { push } = useRouter();
  const track = usePlayerStore((s) => s.track);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const progress = usePlayerStore((s) => s.progress);
  const isLiked = usePlayerStore((s) => s.isLiked);
  const isUnavailable = usePlayerStore((s) => s.isUnavailable);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const next = usePlayerStore((s) => s.next);
  const toggleLike = usePlayerStore((s) => s.toggleLike);
  const clear = usePlayerStore((s) => s.clear);

  if (!track) return null;

  const canLike = isApiTrackId(track.id);

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
              isUnavailable
                ? 'text-on-surface-variant'
                : track.artist.startsWith('Now Playing')
                  ? 'text-primary-tonal'
                  : 'text-on-surface-variant'
            }
            numberOfLines={1}>
            {isUnavailable ? 'Unavailable' : track.artist}
          </Text>
        </View>

        <View className="flex-row items-center">
          {canLike ? (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                toggleLike();
              }}
              accessibilityRole="button"
              accessibilityLabel={isLiked ? 'Unlike' : 'Like'}
              hitSlop={6}
              className="mr-2 h-10 w-10 items-center justify-center">
              <Heart
                size={20}
                color={isLiked ? '#FFB0CD' : '#CBC3D7'}
                strokeWidth={2}
                fill={isLiked ? '#FFB0CD' : 'transparent'}
              />
            </Pressable>
          ) : null}

          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              disabled={isUnavailable}
              accessibilityRole="button"
              accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
              accessibilityState={{ disabled: isUnavailable }}
              className="h-11 w-11 items-center justify-center rounded-full"
              style={{
                opacity: isUnavailable ? 0.45 : 1,
                experimental_backgroundImage:
                  'linear-gradient(to right, #A078FF 0%, #D0BCFF 50%, #D0BCFF 100%)',
              }}>
              {isPlaying ? (
                <Pause
                  size={22}
                  color="#131319"
                  strokeWidth={0}
                  fill="#131319"
                />
              ) : (
                <Play
                  size={22}
                  color="#131319"
                  strokeWidth={0}
                  fill="#131319"
                  style={{ marginLeft: 2 }}
                />
              )}
            </Pressable>

            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                next();
              }}
              accessibilityRole="button"
              accessibilityLabel="Next track"
              hitSlop={6}
              className="h-10 w-10 items-center justify-center">
              <SkipForward size={22} color="#E4E1EA" strokeWidth={2.4} />
            </Pressable>
          </View>

          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              clear();
            }}
            accessibilityRole="button"
            accessibilityLabel="Close player"
            hitSlop={6}
            className="ml-1 h-10 w-10 items-center justify-center">
            <X size={20} color="#CBC3D7" strokeWidth={2.2} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

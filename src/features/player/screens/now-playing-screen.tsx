import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  Check,
  ChevronLeft,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Pause,
  Play,
  Repeat,
  Share2,
  SkipBack,
  SkipForward,
  Video,
} from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { isApiTrackId } from '@/features/saves';
import { AppHeader } from '@/shared/components/layout/app-header';
import { Text } from '@/shared/components/ui/text';
import { useNavigationGuard } from '@/shared/lib/use-navigation-guard';

import { PlayerComments } from '../components/player-comments';
import { PlayerProgress } from '../components/player-progress';
import { usePlayerStore } from '../store/player.store';

const DEFAULT_DURATION_SEC = 198;
const ICON = '#CBC3D7';
const ICON_ACTIVE = '#D0BCFF';

export function NowPlayingScreen() {
  const { back, canGoBack } = useRouter();
  const { guard } = useNavigationGuard();
  const { width } = useWindowDimensions();
  const coverSize = Math.min(width - 48, 340);

  const track = usePlayerStore((s) => s.track);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const progress = usePlayerStore((s) => s.progress);
  const isLiked = usePlayerStore((s) => s.isLiked);
  const isLooping = usePlayerStore((s) => s.isLooping);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const next = usePlayerStore((s) => s.next);
  const previous = usePlayerStore((s) => s.previous);
  const toggleLike = usePlayerStore((s) => s.toggleLike);
  const toggleLoop = usePlayerStore((s) => s.toggleLoop);
  const setProgress = usePlayerStore((s) => s.setProgress);

  if (!track) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text variant="title-md" className="text-on-surface">
          Nothing playing
        </Text>
        <Pressable
          onPress={() => (canGoBack() ? guard(() => back()) : undefined)}
          className="mt-4 rounded-full bg-primary-tonal px-5 py-2.5">
          <Text variant="label-md" className="font-semibold text-on-primary">
            Close
          </Text>
        </Pressable>
      </View>
    );
  }

  const durationSec = track.durationSec ?? DEFAULT_DURATION_SEC;
  const artistAvatar = track.artistAvatarUrl ?? track.coverUrl;
  const playsLabel = track.playsLabel ?? '24.5K plays';
  const likeLabel = track.likeCountLabel ?? '1.2K';
  const commentCount = track.commentCount ?? 382;
  const canLike = isApiTrackId(track.id);

  return (
    <View className="flex-1 bg-background">
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Image
          source={{ uri: track.coverUrl }}
          style={[StyleSheet.absoluteFill, { opacity: 0.35 }]}
          contentFit="cover"
          blurRadius={32}
          recyclingKey={`${track.id}-bg`}
        />
        <View className="absolute inset-0 bg-background/70" />
      </View>

      <AppHeader showNotificationBadge transparent />

      <View className="flex-row items-center justify-between px-3 pb-2">
        <Pressable
          onPress={() => (canGoBack() ? guard(() => back()) : undefined)}
          accessibilityRole="button"
          accessibilityLabel="Close player"
          hitSlop={8}
          className="h-11 w-11 items-center justify-center">
          <ChevronLeft size={26} color="#E4E1EA" strokeWidth={2} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="More options"
          hitSlop={8}
          className="h-11 w-11 items-center justify-center">
          <MoreHorizontal size={22} color={ICON} strokeWidth={1.8} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 px-6 pb-10"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View className="items-center pt-1">
          <View
            className="overflow-hidden rounded-3xl bg-surface-container"
            style={{
              width: coverSize,
              height: coverSize,
              borderCurve: 'continuous',
              boxShadow: '0 18px 40px rgba(0, 0, 0, 0.45)',
            }}>
            <Image
              source={{ uri: track.coverUrl }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              recyclingKey={track.id}
            />
          </View>
        </View>

        <View className="gap-3">
          <Text variant="headline-md" className="text-on-surface">
            {track.title}
          </Text>

          <View className="flex-row items-center gap-2">
            <View className="h-8 w-8 overflow-hidden rounded-full bg-surface-container-high">
              <Image
                source={{ uri: artistAvatar }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                recyclingKey={`${track.id}-artist`}
              />
            </View>

            <View className="min-w-0 flex-1 flex-row items-center gap-1.5">
              <Text variant="title-md" className="shrink text-on-surface" numberOfLines={1}>
                {track.artist}
              </Text>
              {track.verified !== false ? (
                <View className="h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary-container">
                  <Check size={9} color="#FFFFFF" strokeWidth={3} />
                </View>
              ) : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Follow ${track.artist}`}
                className="ml-1 rounded-full bg-surface-container-high px-2.5 py-1">
                <Text variant="caption" className="font-semibold text-on-surface">
                  + Follow
                </Text>
              </Pressable>
            </View>

            <Text variant="caption" className="shrink-0 text-on-surface-variant">
              {playsLabel}
            </Text>
          </View>
        </View>

        <PlayerProgress
          progress={progress}
          durationSec={durationSec}
          onSeek={setProgress}
        />

        <View className="flex-row items-center justify-center gap-10 py-1">
          <Pressable
            onPress={previous}
            accessibilityRole="button"
            accessibilityLabel="Previous"
            hitSlop={10}
            className="h-12 w-12 items-center justify-center">
            <SkipBack size={28} color="#E4E1EA" strokeWidth={1.8} fill="#E4E1EA" />
          </Pressable>

          <Pressable
            onPress={togglePlay}
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
            className="h-18 w-18 items-center justify-center rounded-full bg-primary-tonal"
            style={{ boxShadow: '0 10px 28px rgba(208, 188, 255, 0.35)' }}>
            {isPlaying ? (
              <Pause size={30} color="#3C0091" strokeWidth={2.4} fill="#3C0091" />
            ) : (
              <Play size={30} color="#3C0091" strokeWidth={2.4} fill="#3C0091" />
            )}
          </Pressable>

          <Pressable
            onPress={next}
            accessibilityRole="button"
            accessibilityLabel="Next"
            hitSlop={10}
            className="h-12 w-12 items-center justify-center">
            <SkipForward size={28} color="#E4E1EA" strokeWidth={1.8} fill="#E4E1EA" />
          </Pressable>
        </View>

        <View className="flex-row items-center justify-between px-2">
          <Pressable
            onPress={toggleLoop}
            accessibilityRole="button"
            accessibilityLabel="Loop"
            accessibilityState={{ selected: isLooping }}
            hitSlop={8}
            className="h-11 w-11 items-center justify-center">
            <Repeat
              size={22}
              color={isLooping ? ICON_ACTIVE : ICON}
              strokeWidth={isLooping ? 2.2 : 1.8}
            />
          </Pressable>

          {canLike ? (
            <Pressable
              onPress={toggleLike}
              accessibilityRole="button"
              accessibilityLabel={isLiked ? 'Unlike' : 'Like'}
              hitSlop={8}
              className="h-11 flex-row items-center gap-1.5 px-1">
              <Heart
                size={22}
                color={isLiked ? '#FFB0CD' : ICON}
                strokeWidth={1.8}
                fill={isLiked ? '#FFB0CD' : 'transparent'}
              />
              <Text variant="label-md" className="text-on-surface-variant">
                {likeLabel}
              </Text>
            </Pressable>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Comments"
            hitSlop={8}
            className="h-11 w-11 items-center justify-center">
            <MessageCircle size={22} color={ICON} strokeWidth={1.8} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Share"
            hitSlop={8}
            className="h-11 w-11 items-center justify-center">
            <Share2 size={22} color={ICON} strokeWidth={1.8} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Video"
            hitSlop={8}
            className="relative h-11 w-11 items-center justify-center">
            <View className="h-9 w-9 items-center justify-center rounded-full border border-white/10">
              <Video size={18} color={ICON} strokeWidth={1.8} />
            </View>
            <View className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[#EF4444]" />
          </Pressable>
        </View>

        <PlayerComments trackId={track.id} commentCount={commentCount} />
      </ScrollView>
    </View>
  );
}

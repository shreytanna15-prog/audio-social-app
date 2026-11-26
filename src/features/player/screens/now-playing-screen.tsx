import { Image } from 'expo-image';
import { type Href, useRouter } from 'expo-router';
import {
  Check,
  ChevronLeft,
  Heart,
  Pause,
  Play,
  Repeat,
  Share2,
  SkipBack,
  SkipForward,
} from 'lucide-react-native';
import { useRef } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { isApiTrackId } from '@/features/saves';
import { AppHeader } from '@/shared/components/layout/app-header';
import { Text } from '@/shared/components/ui/text';
import { useNavigationGuard } from '@/shared/lib/use-navigation-guard';

import { PlayerComments } from '../components/player-comments';
import { PlayerProgress } from '../components/player-progress';
import { usePlayerStore } from '../store/player.store';
import type { RepeatMode } from '../types';

const DEFAULT_DURATION_SEC = 198;
const ICON = '#CBC3D7';
const ICON_ACTIVE = '#D0BCFF';

function repeatAccessibilityLabel(mode: RepeatMode): string {
  switch (mode) {
    case 'all':
      return 'Repeat all';
    case 'one':
      return 'Repeat one';
    default:
      return 'Repeat off';
  }
}

export function NowPlayingScreen() {
  const { back, canGoBack, push } = useRouter();
  const { guard } = useNavigationGuard();
  const { width } = useWindowDimensions();
  const coverSize = Math.min(width - 48, 340);
  const scrollRef = useRef<ScrollView>(null);

  const scrollComposerIntoView = () => {
    // Wait for keyboard/layout resize before scrolling the input into view.
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 80);
  };

  const track = usePlayerStore((s) => s.track);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const progress = usePlayerStore((s) => s.progress);
  const isLiked = usePlayerStore((s) => s.isLiked);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const isUnavailable = usePlayerStore((s) => s.isUnavailable);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const next = usePlayerStore((s) => s.next);
  const previous = usePlayerStore((s) => s.previous);
  const toggleLike = usePlayerStore((s) => s.toggleLike);
  const cycleRepeatMode = usePlayerStore((s) => s.cycleRepeatMode);
  const setProgress = usePlayerStore((s) => s.setProgress);

  if (!track) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text variant="title-md" className="text-on-surface">
          Nothing playing
        </Text>
        <Pressable
          onPress={() => (canGoBack() ? back() : undefined)}
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
  const playsLabel = track.playsLabel ?? (track.playCount != null
    ? `${track.playCount} plays`
    : null);
  const commentCount = track.commentCount ?? 0;
  const canLike = isApiTrackId(track.id);
  const repeatActive = repeatMode !== 'off';
  const openArtist = () => {
    if (!track.artistId) return;
    guard(() => push(`/artist/${track.artistId}` as Href));
  };

  const onShare = () => {
    void Share.share({
      message: `Listen to ${track.title} by ${track.artist} on VibeOGram`,
    });
  };

  const body = (
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
          onPress={() => (canGoBack() ? back() : undefined)}
          accessibilityRole="button"
          accessibilityLabel="Close player"
          hitSlop={8}
          className="h-11 w-11 items-center justify-center">
          <ChevronLeft size={26} color="#E4E1EA" strokeWidth={2} />
        </Pressable>

        <Pressable
          onPress={onShare}
          accessibilityRole="button"
          accessibilityLabel="Share"
          hitSlop={8}
          className="h-11 w-11 items-center justify-center">
          <Share2 size={20} color={ICON} strokeWidth={1.8} />
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        contentContainerClassName="gap-5 px-6 pb-16"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive">
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
            <Pressable
              onPress={openArtist}
              disabled={!track.artistId}
              accessibilityRole={track.artistId ? 'button' : undefined}
              accessibilityLabel={
                track.artistId ? `Open ${track.artist} profile` : undefined
              }
              className="h-8 w-8 overflow-hidden rounded-full bg-surface-container-high">
              <Image
                source={{ uri: artistAvatar }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                recyclingKey={`${track.id}-artist`}
              />
            </Pressable>

            <View className="min-w-0 flex-1 flex-row items-center gap-1.5">
              <Pressable
                onPress={openArtist}
                disabled={!track.artistId}
                className="min-w-0 shrink">
                <Text
                  variant="title-md"
                  className="text-on-surface"
                  numberOfLines={1}>
                  {track.artist}
                </Text>
              </Pressable>
              {track.verified ? (
                <View className="h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary-container">
                  <Check size={9} color="#FFFFFF" strokeWidth={3} />
                </View>
              ) : null}
            </View>

            {playsLabel ? (
              <Text variant="caption" className="shrink-0 text-on-surface-variant">
                {playsLabel}
              </Text>
            ) : null}
          </View>
        </View>

        {isUnavailable ? (
          <View className="rounded-2xl bg-surface-container-high px-4 py-3">
            <Text variant="label-md" className="text-center text-on-surface-variant">
              Audio unavailable — this track has no playable mix.
            </Text>
          </View>
        ) : (
          <PlayerProgress
            progress={progress}
            durationSec={durationSec}
            onSeek={setProgress}
          />
        )}

        <View className="flex-row items-center justify-between px-1 py-1">
          <Pressable
            onPress={cycleRepeatMode}
            accessibilityRole="button"
            accessibilityLabel={repeatAccessibilityLabel(repeatMode)}
            accessibilityState={{ selected: repeatActive }}
            hitSlop={8}
            className="relative h-11 w-11 items-center justify-center">
            <Repeat
              size={20}
              color={repeatActive ? ICON_ACTIVE : ICON}
              strokeWidth={repeatActive ? 2.2 : 1.8}
            />
            {repeatMode === 'one' ? (
              <View className="absolute -right-0.5 top-0.5 h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary-tonal px-0.5">
                <Text
                  variant="caption"
                  className="font-bold text-on-primary"
                  style={{ fontSize: 9, lineHeight: 11 }}>
                  1
                </Text>
              </View>
            ) : null}
          </Pressable>

          <View className="flex-row items-center gap-6">
            <Pressable
              onPress={() => previous()}
              accessibilityRole="button"
              accessibilityLabel="Previous"
              hitSlop={10}
              className="h-11 w-11 items-center justify-center">
              <SkipBack size={26} color="#E4E1EA" strokeWidth={2.4} />
            </Pressable>

            <Pressable
              onPress={togglePlay}
              disabled={isUnavailable}
              accessibilityRole="button"
              accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
              accessibilityState={{ disabled: isUnavailable }}
              className="h-14 w-14 items-center justify-center rounded-full"
              style={{
                opacity: isUnavailable ? 0.45 : 1,
                experimental_backgroundImage:
                  'linear-gradient(to right, #A078FF 0%, #D0BCFF 50%, #D0BCFF 100%)',
              }}>
              {isPlaying ? (
                <Pause
                  size={26}
                  color="#131319"
                  strokeWidth={0}
                  fill="#131319"
                />
              ) : (
                <Play
                  size={26}
                  color="#131319"
                  strokeWidth={0}
                  fill="#131319"
                  style={{ marginLeft: 2 }}
                />
              )}
            </Pressable>

            <Pressable
              onPress={() => next()}
              accessibilityRole="button"
              accessibilityLabel="Next"
              hitSlop={10}
              className="h-11 w-11 items-center justify-center">
              <SkipForward size={26} color="#E4E1EA" strokeWidth={2.4} />
            </Pressable>
          </View>

          {canLike ? (
            <Pressable
              onPress={toggleLike}
              accessibilityRole="button"
              accessibilityLabel={isLiked ? 'Unlike' : 'Like'}
              hitSlop={8}
              className="h-11 w-11 items-center justify-center">
              <Heart
                size={20}
                color={isLiked ? '#FFB0CD' : ICON}
                strokeWidth={1.8}
                fill={isLiked ? '#FFB0CD' : 'transparent'}
              />
            </Pressable>
          ) : (
            <View className="h-11 w-11" />
          )}
        </View>

        <PlayerComments
          trackId={track.id}
          commentCount={commentCount}
          onComposerFocus={scrollComposerIntoView}
        />
      </ScrollView>
    </View>
  );

  if (Platform.OS === 'ios') {
    return (
      <KeyboardAvoidingView
        className="flex-1 bg-background"
        behavior="padding"
        keyboardVerticalOffset={0}>
        {body}
      </KeyboardAvoidingView>
    );
  }

  // Android uses softwareKeyboardLayoutMode "resize".
  return body;
}

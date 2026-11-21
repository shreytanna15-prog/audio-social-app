import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  type ViewToken,
  View,
} from 'react-native';

import { usePlayerStore } from '@/features/player';
import { Text } from '@/shared/components/ui/text';
import { useNavigationGuard } from '@/shared/lib/use-navigation-guard';

import { useFeed } from '../api/hooks';
import { FeedVibePage } from '../components/feed-vibe-page';
import { FEED_PREVIEW_DEMO } from '../data/feed-preview-audio';
import { useFeedPreviewPlayback } from '../hooks/use-feed-preview-playback';
import type { FeedVibe } from '../types';
import { mapFeedItemToVibe } from '../utils/map-feed-item';

const ACCENT = '#D0BCFF';

export function FeedScreen() {
  const { push } = useRouter();
  const { guard } = useNavigationGuard();
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  const [screenFocused, setScreenFocused] = useState(true);

  const feedQuery = useFeed(10);
  const vibes = useMemo(
    () =>
      (feedQuery.data?.pages ?? []).flatMap((page) =>
        page.items.map(mapFeedItemToVibe),
      ),
    [feedQuery.data?.pages],
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      setAppActive(next === 'active');
    });
    return () => sub.remove();
  }, []);

  useFocusEffect(
    useCallback(() => {
      setScreenFocused(true);
      return () => {
        setScreenFocused(false);
      };
    }, []),
  );

  const play = usePlayerStore((s) => s.play);

  const [pageHeight, setPageHeight] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);

  const activeVibe = vibes[activeIndex] ?? vibes[0];
  const hasPreview = Boolean(activeVibe?.previewAudio);
  const playback = useFeedPreviewPlayback({
    source: activeVibe?.previewAudio ?? FEED_PREVIEW_DEMO,
    vibeId: activeVibe?.id ?? 'empty',
    enabled:
      pageHeight > 0 &&
      appActive &&
      screenFocused &&
      hasPreview &&
      vibes.length > 0,
    fallbackDurationSec: activeVibe?.previewDurationSec ?? 30,
  });

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems.find((item) => item.isViewable && item.index != null);
      if (first?.index == null) return;
      if (first.index === activeIndexRef.current) return;
      activeIndexRef.current = first.index;
      setActiveIndex(first.index);
    },
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
  }).current;

  const openFullTrack = (vibe: FeedVibe) => {
    playback.pause();
    play({
      id: vibe.id,
      title: vibe.title,
      artist: vibe.artist,
      coverUrl: vibe.coverUrl,
      mixUrl: vibe.mixUrl,
      artistAvatarUrl: vibe.artistAvatarUrl,
      likeCountLabel: vibe.likesLabel,
      likeCount: vibe.likeCount,
      isLiked: vibe.isLiked,
      commentCount: vibe.commentCount,
      durationSec: vibe.durationSec,
      verified: vibe.verified,
    });
    guard(() => push('/player'));
  };

  const openArtist = (vibe: FeedVibe) => {
    if (!vibe.artistId) return;
    playback.pause();
    guard(() => push(`/artist/${vibe.artistId}`));
  };

  const onEndReached = () => {
    if (feedQuery.hasNextPage && !feedQuery.isFetchingNextPage) {
      void feedQuery.fetchNextPage();
    }
  };

  if (feedQuery.isLoading && vibes.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={ACCENT} />
      </View>
    );
  }

  if (feedQuery.isError && vibes.length === 0) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-background px-6">
        <Text variant="body-md" className="text-center text-on-surface-variant">
          Couldn’t load the feed.
        </Text>
        <Pressable
          onPress={() => void feedQuery.refetch()}
          accessibilityRole="button"
          hitSlop={8}>
          <Text variant="label-md" className="font-semibold text-primary-tonal">
            Retry
          </Text>
        </Pressable>
      </View>
    );
  }

  if (vibes.length === 0) {
    return (
      <View className="flex-1 items-center justify-center gap-2 bg-background px-6">
        <Text variant="title-md" className="text-on-surface">
          No vibes yet
        </Text>
        <Text variant="body-md" className="text-center text-on-surface-variant">
          Published tracks will show up here.
        </Text>
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-background"
      onLayout={(e) => {
        const next = Math.round(e.nativeEvent.layout.height);
        setPageHeight((prev) => (prev === next ? prev : next));
      }}>
      {pageHeight > 0 ? (
        <FlatList
          data={vibes}
          keyExtractor={(item) => item.id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          decelerationRate="fast"
          bounces={false}
          overScrollMode="never"
          getItemLayout={(_, index) => ({
            length: pageHeight,
            offset: pageHeight * index,
            index,
          })}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.6}
          onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
            const index = Math.round(e.nativeEvent.contentOffset.y / pageHeight);
            if (index === activeIndexRef.current) return;
            activeIndexRef.current = index;
            setActiveIndex(index);
          }}
          renderItem={({ item, index }) => {
            const isActiveCard = index === activeIndex;
            return (
              <FeedVibePage
                vibe={item}
                nextVibe={vibes[index + 1] ?? null}
                isActive={isActiveCard}
                pageHeight={pageHeight}
                playback={
                  isActiveCard
                    ? playback
                    : {
                        progress: 0,
                        currentSec: 0,
                        previewDurationSec: item.previewDurationSec,
                        completedOnce: false,
                        userPaused: false,
                      }
                }
                onTogglePlayPause={isActiveCard ? playback.togglePlayPause : undefined}
                onOpenFullTrack={openFullTrack}
                onArtistPress={openArtist}
              />
            );
          }}
        />
      ) : null}
    </View>
  );
}

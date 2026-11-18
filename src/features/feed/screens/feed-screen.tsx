import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewToken,
  View,
} from 'react-native';

import { usePlayerStore } from '@/features/player';
import { useNavigationGuard } from '@/shared/lib/use-navigation-guard';

import { FeedVibePage } from '../components/feed-vibe-page';
import { FEED_VIBES } from '../data/feed-vibes.fixtures';
import { useFeedPreviewPlayback } from '../hooks/use-feed-preview-playback';
import type { FeedVibe } from '../types';

export function FeedScreen() {
  const { push } = useRouter();
  const { guard } = useNavigationGuard();
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  const [screenFocused, setScreenFocused] = useState(true);

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

  const activeVibe = FEED_VIBES[activeIndex] ?? FEED_VIBES[0];
  const playback = useFeedPreviewPlayback({
    source: activeVibe.previewAudio,
    vibeId: activeVibe.id,
    enabled: pageHeight > 0 && appActive && screenFocused,
    fallbackDurationSec: activeVibe.previewDurationSec,
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
      id: `feed-${vibe.id}`,
      title: vibe.title,
      artist: vibe.artist,
      coverUrl: vibe.coverUrl,
      artistAvatarUrl: vibe.artistAvatarUrl,
      likeCountLabel: vibe.likesLabel,
      commentCount: Number.parseInt(vibe.commentsLabel.replace(/[^\d]/g, ''), 10) || undefined,
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

  return (
    <View
      className="flex-1 bg-background"
      onLayout={(e) => {
        const next = Math.round(e.nativeEvent.layout.height);
        setPageHeight((prev) => (prev === next ? prev : next));
      }}>
      {pageHeight > 0 ? (
        <FlatList
          data={FEED_VIBES}
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
                nextVibe={FEED_VIBES[(index + 1) % FEED_VIBES.length] ?? null}
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

import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePlayerStore, type PlayerTrack } from '@/features/player';
import { ScreenHeader } from '@/shared/components/layout/screen-header';
import { Text } from '@/shared/components/ui/text';

import { useRecentlyPlayed } from '../api/hooks';
import { RecentlyPlayedTile } from '../components/recently-played-tile';
import type { RecentlyPlayedTrack } from '../data/recently-played';
import { mapRecentlyPlayedTrack } from '../utils/map-discover';
import { getHomeSectionErrorLabel } from '../utils/home-load-error';

const HISTORY_LIMIT = 20;

function chunkPairs<T>(items: T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += 2) {
    rows.push(items.slice(i, i + 2));
  }
  return rows;
}

function toPlayerTrack(track: RecentlyPlayedTrack): PlayerTrack {
  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    coverUrl: track.coverUrl,
    mixUrl: track.mixUrl,
    likeCount: track.likeCount,
    isLiked: track.isLiked,
  };
}

export function ListeningHistoryScreen() {
  const insets = useSafeAreaInsets();
  const playQueue = usePlayerStore((s) => s.playQueue);
  const historyQuery = useRecentlyPlayed(HISTORY_LIMIT);
  const tracks = (historyQuery.data ?? []).map(mapRecentlyPlayedTrack);
  const rows = chunkPairs(tracks);

  const onTrackPress = (track: RecentlyPlayedTrack) => {
    const queue = tracks.map(toPlayerTrack);
    const startIndex = queue.findIndex((item) => item.id === track.id);
    playQueue(queue, startIndex < 0 ? 0 : startIndex);
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader title="Listening history" />

      {historyQuery.isLoading && tracks.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#D0BCFF" />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-2.5 px-4 pb-10 pt-4"
          contentContainerStyle={{
            paddingBottom: Math.max(insets.bottom, 16) + 24,
          }}
          refreshControl={
            <RefreshControl
              refreshing={historyQuery.isRefetching}
              onRefresh={() => void historyQuery.refetch()}
              tintColor="#D0BCFF"
            />
          }
          showsVerticalScrollIndicator={false}>
          {historyQuery.isError && tracks.length === 0 ? (
            <View className="gap-3 py-10">
              <Text className="text-center text-on-surface">
                {getHomeSectionErrorLabel(
                  historyQuery.error,
                  'You’re offline. Check your connection and retry.',
                  'Couldn’t load listening history.',
                )}
              </Text>
              <Pressable
                onPress={() => void historyQuery.refetch()}
                accessibilityRole="button"
                accessibilityLabel="Retry"
                className="items-center self-center rounded-full bg-surface-container-high px-4 py-2">
                <Text variant="label-md" className="font-semibold text-primary-tonal">
                  Retry
                </Text>
              </Pressable>
            </View>
          ) : tracks.length === 0 ? (
            <View className="py-10">
              <Text className="text-center text-on-surface-variant">
                No recent listens yet. Play a track to build your history.
              </Text>
            </View>
          ) : (
            rows.map((row) => (
              <View
                key={row.map((track) => track.id).join('-')}
                className="flex-row gap-2.5">
                {row.map((track) => (
                  <RecentlyPlayedTile
                    key={track.id}
                    track={track}
                    onPress={() => onTrackPress(track)}
                  />
                ))}
                {row.length === 1 ? <View className="min-w-0 flex-1" /> : null}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

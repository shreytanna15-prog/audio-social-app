import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import type {
  LibraryLikedTrackItem,
  LibraryListState,
  LibrarySavedCollectionItem,
  LibrarySavedSegment,
} from '../types';
import { LibraryLikedTrackRow } from './library-liked-track-row';
import { LibrarySavedCollectionList } from './library-saved-collection-list';
import { LibrarySectionHeader } from './library-section-header';

const SEGMENTS: { id: LibrarySavedSegment; label: string }[] = [
  { id: 'songs', label: 'Songs' },
  { id: 'playlists', label: 'Playlists' },
  { id: 'albums', label: 'Albums' },
];

type LibrarySavedPanelProps = {
  likedTracks: LibraryLikedTrackItem[];
  savedPlaylists: LibrarySavedCollectionItem[];
  savedAlbums: LibrarySavedCollectionItem[];
  playlistsState: LibraryListState;
  albumsState: LibraryListState;
  onTrackPress: (item: LibraryLikedTrackItem) => void;
  onUnlikePress: (item: LibraryLikedTrackItem) => void;
  onCollectionPress: (item: LibrarySavedCollectionItem) => void;
  onCollectionMorePress: (item: LibrarySavedCollectionItem) => void;
  contentBottomInset?: number;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
};

export function LibrarySavedPanel({
  likedTracks,
  savedPlaylists,
  savedAlbums,
  playlistsState,
  albumsState,
  onTrackPress,
  onUnlikePress,
  onCollectionPress,
  onCollectionMorePress,
  contentBottomInset = 28,
  isLoading = false,
  isError = false,
  onRetry,
}: LibrarySavedPanelProps) {
  const [segment, setSegment] = useState<LibrarySavedSegment>('songs');

  return (
    <View className="flex-1">
      <View className="mx-4 mb-3 flex-row items-center gap-2">
        {SEGMENTS.map((item) => {
          const active = item.id === segment;
          return (
            <Pressable
              key={item.id}
              onPress={() => setSegment(item.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={item.label}
              className="rounded-full border border-white/10 px-3.5 py-1.5"
              style={{
                borderCurve: 'continuous',
                backgroundColor: active
                  ? 'rgba(160, 120, 255, 0.24)'
                  : 'transparent',
              }}>
              <Text
                variant="label-md"
                className={
                  active ? 'text-on-surface' : 'text-on-surface-variant'
                }>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {segment === 'songs' ? (
        isLoading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator color="#D0BCFF" />
          </View>
        ) : isError ? (
          <View className="flex-1 items-center gap-3 px-8 py-16">
            <Text variant="title-md" className="text-on-surface">
              Couldn’t load Liked Songs
            </Text>
            <Text
              variant="body-md"
              className="text-center text-on-surface-variant">
              Check your connection and try again.
            </Text>
            {onRetry ? (
              <Text
                variant="label-md"
                className="text-primary"
                onPress={onRetry}
                accessibilityRole="button">
                Retry
              </Text>
            ) : null}
          </View>
        ) : (
          <FlatList
            className="flex-1"
            data={likedTracks}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              gap: 10,
              paddingBottom: contentBottomInset,
            }}
            ListHeaderComponent={
              <View className="mb-2 pb-1 pt-1">
                <LibrarySectionHeader label="Liked Songs" />
              </View>
            }
            renderItem={({ item }) => (
              <LibraryLikedTrackRow
                item={item}
                onPress={onTrackPress}
                onUnlikePress={onUnlikePress}
              />
            )}
            ListEmptyComponent={
              <View className="items-center gap-2 px-8 py-16">
                <Text variant="title-md" className="text-on-surface">
                  No liked songs yet
                </Text>
                <Text
                  variant="body-md"
                  className="text-center text-on-surface-variant">
                  Tap the heart on a published track to save it here.
                </Text>
              </View>
            }
          />
        )
      ) : segment === 'playlists' ? (
        <LibrarySavedCollectionList
          label="Playlists"
          items={savedPlaylists}
          state={playlistsState}
          emptyTitle="No saved playlists"
          emptyBody="Public playlists you save will show up here."
          errorTitle="Couldn’t load saved playlists"
          onItemPress={onCollectionPress}
          onMorePress={onCollectionMorePress}
          contentBottomInset={contentBottomInset}
        />
      ) : (
        <LibrarySavedCollectionList
          label="Albums"
          items={savedAlbums}
          state={albumsState}
          emptyTitle="No saved albums"
          emptyBody="Released albums you save will show up here."
          errorTitle="Couldn’t load saved albums"
          onItemPress={onCollectionPress}
          onMorePress={onCollectionMorePress}
          contentBottomInset={contentBottomInset}
        />
      )}
    </View>
  );
}

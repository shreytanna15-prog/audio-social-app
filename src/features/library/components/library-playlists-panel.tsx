import { Globe, Lock } from 'lucide-react-native';
import { ActivityIndicator, FlatList, View } from 'react-native';

import { useFeedbackDialog } from '@/shared/components/ui/feedback-dialog';
import { Text } from '@/shared/components/ui/text';

import type { LibraryPlaylistItem } from '../types';
import { LibraryCoverCard } from './library-cover-card';
import { LibraryNewCollectionButton } from './library-new-collection-button';
import { LibrarySectionHeader } from './library-section-header';

const ACCENT = '#A078FF';
const META = '#958EA0';

type LibraryPlaylistsPanelProps = {
  items: LibraryPlaylistItem[];
  onItemPress?: (item: LibraryPlaylistItem) => void;
  onMorePress?: (item: LibraryPlaylistItem) => void;
  onCreatePress?: () => void;
  contentBottomInset?: number;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
};

export function LibraryPlaylistsPanel({
  items,
  onItemPress,
  onMorePress,
  onCreatePress,
  contentBottomInset = 28,
  isLoading = false,
  isError = false,
  onRetry,
}: LibraryPlaylistsPanelProps) {
  const { showError, dialog } = useFeedbackDialog();

  if (isLoading && items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-16">
        <ActivityIndicator color="#D0BCFF" />
      </View>
    );
  }

  if (isError && items.length === 0) {
    return (
      <View className="flex-1 items-center gap-3 px-8 py-16">
        <Text variant="title-md" className="text-on-surface">
          Couldn’t load playlists
        </Text>
        {onRetry ? (
          <Text variant="body-md" className="text-primary" onPress={onRetry}>
            Retry
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <>
      <FlatList
        className="flex-1"
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={{ paddingHorizontal: 16 }}
        contentContainerStyle={{
          paddingBottom: contentBottomInset,
          gap: 20,
        }}
        ListHeaderComponent={
          <View className="mb-1 pb-2">
            <LibrarySectionHeader
              label="Curated collections"
              count={items.length}
              trailing={
                onCreatePress ? (
                  <LibraryNewCollectionButton
                    label="New playlist"
                    onPress={onCreatePress}
                  />
                ) : null
              }
            />
          </View>
        }
        renderItem={({ item }) => {
          const isPrivate = item.visibility === 'private';
          const VisibilityIcon = isPrivate ? Lock : Globe;
          const visibilityLabel = isPrivate ? 'Private' : 'Public';

          return (
            <LibraryCoverCard
              id={item.id}
              title={item.title}
              coverUrl={item.coverUrl}
              accessibilityLabel={`${item.title}, ${item.trackCount} tracks, ${visibilityLabel}`}
              onPress={() => {
                if (onItemPress) {
                  onItemPress(item);
                  return;
                }
                showError(item.title, 'Couldn’t open playlist.');
              }}
              onMorePress={() => {
                if (onMorePress) {
                  onMorePress(item);
                  return;
                }
                onItemPress?.(item);
              }}
              meta={
                <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
                  <Text
                    variant="caption"
                    style={{ color: META }}
                    numberOfLines={1}>
                    {item.trackCount} tracks
                  </Text>
                  <View className="flex-row items-center gap-1">
                    <View
                      className="h-1 w-1 rounded-full"
                      style={{ backgroundColor: ACCENT }}
                    />
                    <VisibilityIcon size={11} color={ACCENT} strokeWidth={2.2} />
                    <Text
                      variant="caption"
                      style={{ color: META }}
                      numberOfLines={1}>
                      {visibilityLabel}
                    </Text>
                  </View>
                </View>
              }
            />
          );
        }}
        ListEmptyComponent={
          <View className="items-center gap-2 px-8 py-16">
            <Text variant="title-md" className="text-on-surface">
              No playlists yet
            </Text>
            <Text
              variant="body-md"
              className="text-center text-on-surface-variant">
              Curated collections will show up here.
            </Text>
          </View>
        }
      />
      {dialog}
    </>
  );
}

import { ActivityIndicator, FlatList, View } from 'react-native';

import { useFeedbackDialog } from '@/shared/components/ui/feedback-dialog';
import { Text } from '@/shared/components/ui/text';

import type { LibraryAlbumItem } from '../types';
import { LibraryCoverCard } from './library-cover-card';
import { LibraryNewCollectionButton } from './library-new-collection-button';
import { LibrarySectionHeader } from './library-section-header';

type LibraryAlbumsPanelProps = {
  items: LibraryAlbumItem[];
  onItemPress?: (item: LibraryAlbumItem) => void;
  onMorePress?: (item: LibraryAlbumItem) => void;
  onCreatePress?: () => void;
  contentBottomInset?: number;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
};

export function LibraryAlbumsPanel({
  items,
  onItemPress,
  onMorePress,
  onCreatePress,
  contentBottomInset = 28,
  isLoading = false,
  isError = false,
  onRetry,
}: LibraryAlbumsPanelProps) {
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
          Couldn’t load albums
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
          <View className="mb-2 pb-1 pt-1">
            <LibrarySectionHeader
              label="Albums"
              trailing={
                onCreatePress ? (
                  <LibraryNewCollectionButton
                    label="New album"
                    onPress={onCreatePress}
                  />
                ) : null
              }
            />
          </View>
        }
        renderItem={({ item }) => {
          const statusLabel = item.status === 'draft' ? 'Draft' : 'Released';

          return (
            <LibraryCoverCard
              id={item.id}
              title={item.title}
              coverUrl={item.coverUrl}
              accessibilityLabel={`${item.title}, ${item.trackCount} tracks, ${statusLabel}`}
              onPress={() => {
                if (onItemPress) {
                  onItemPress(item);
                  return;
                }
                showError(item.title, 'Couldn’t open album.');
              }}
              onMorePress={() => {
                if (onMorePress) {
                  onMorePress(item);
                  return;
                }
                onItemPress?.(item);
              }}
              meta={
                <Text
                  variant="caption"
                  className="text-on-surface-variant"
                  numberOfLines={1}>
                  {item.trackCount} tracks · {statusLabel}
                </Text>
              }
            />
          );
        }}
        ListEmptyComponent={
          <View className="items-center gap-2 px-8 py-16">
            <Text variant="title-md" className="text-on-surface">
              No albums yet
            </Text>
            <Text
              variant="body-md"
              className="text-center text-on-surface-variant">
              Published collections will show up here.
            </Text>
          </View>
        }
      />
      {dialog}
    </>
  );
}

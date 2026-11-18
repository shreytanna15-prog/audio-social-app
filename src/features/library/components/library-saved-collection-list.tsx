import { ActivityIndicator, FlatList, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import type { LibraryListState, LibrarySavedCollectionItem } from '../types';
import { LibraryCoverCard } from './library-cover-card';
import { LibrarySectionHeader } from './library-section-header';

type LibrarySavedCollectionListProps = {
  label: string;
  items: LibrarySavedCollectionItem[];
  state: LibraryListState;
  emptyTitle: string;
  emptyBody: string;
  errorTitle: string;
  onItemPress: (item: LibrarySavedCollectionItem) => void;
  onMorePress: (item: LibrarySavedCollectionItem) => void;
  contentBottomInset: number;
};

export function LibrarySavedCollectionList({
  label,
  items,
  state,
  emptyTitle,
  emptyBody,
  errorTitle,
  onItemPress,
  onMorePress,
  contentBottomInset,
}: LibrarySavedCollectionListProps) {
  if (state.isLoading && items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <ActivityIndicator color="#D0BCFF" />
      </View>
    );
  }

  if (state.isError && items.length === 0) {
    return (
      <View className="flex-1 items-center gap-3 px-8 py-16">
        <Text variant="title-md" className="text-on-surface">
          {errorTitle}
        </Text>
        <Text
          variant="body-md"
          className="text-center text-on-surface-variant">
          Check your connection and try again.
        </Text>
        <Text
          variant="label-md"
          className="text-primary"
          onPress={state.onRetry}
          accessibilityRole="button">
          Retry
        </Text>
      </View>
    );
  }

  return (
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
          <LibrarySectionHeader label={label} />
        </View>
      }
      renderItem={({ item }) => (
        <LibraryCoverCard
          id={item.id}
          title={item.title}
          coverUrl={item.coverUrl}
          accessibilityLabel={`${item.title}, ${
            item.available ? item.ownerName : 'Unavailable'
          }`}
          onPress={() => onItemPress(item)}
          onMorePress={() => onMorePress(item)}
          meta={
            <Text
              variant="caption"
              className="text-on-surface-variant"
              numberOfLines={1}>
              {item.available
                ? `${item.ownerName} · ${item.trackCount} tracks`
                : 'Unavailable'}
            </Text>
          }
        />
      )}
      ListEmptyComponent={
        <View className="items-center gap-2 px-8 py-16">
          <Text variant="title-md" className="text-on-surface">
            {emptyTitle}
          </Text>
          <Text
            variant="body-md"
            className="text-center text-on-surface-variant">
            {emptyBody}
          </Text>
        </View>
      }
    />
  );
}

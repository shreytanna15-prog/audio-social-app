import { FlatList, View } from 'react-native';

import { useFeedbackDialog } from '@/shared/components/ui/feedback-dialog';
import { Text } from '@/shared/components/ui/text';

import type { LibraryAlbumItem } from '../types';
import { LibraryCoverCard } from './library-cover-card';
import { LibrarySectionHeader } from './library-section-header';

type LibraryAlbumsPanelProps = {
  items: LibraryAlbumItem[];
  onItemPress?: (item: LibraryAlbumItem) => void;
  contentBottomInset?: number;
};

export function LibraryAlbumsPanel({
  items,
  onItemPress,
  contentBottomInset = 28,
}: LibraryAlbumsPanelProps) {
  const { showError, dialog } = useFeedbackDialog();

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
              label="Published collections"
              count={items.length}
            />
          </View>
        }
        renderItem={({ item }) => (
          <LibraryCoverCard
            id={item.id}
            title={item.title}
            coverUrl={item.coverUrl}
            accessibilityLabel={`${item.title}, ${item.trackCount} tracks`}
            onPress={() => {
              if (onItemPress) {
                onItemPress(item);
                return;
              }
              showError(item.title, 'Album details coming soon.');
            }}
            onMorePress={() =>
              showError(item.title, 'Album options coming soon.')
            }
            meta={
              <Text
                variant="caption"
                className="text-on-surface-variant"
                numberOfLines={1}>
                {item.trackCount} tracks
              </Text>
            }
          />
        )}
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

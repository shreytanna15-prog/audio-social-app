import { Globe, Lock } from 'lucide-react-native';
import { FlatList, View } from 'react-native';

import { useFeedbackDialog } from '@/shared/components/ui/feedback-dialog';
import { Text } from '@/shared/components/ui/text';

import type { LibraryPlaylistItem } from '../types';
import { LibraryCoverCard } from './library-cover-card';
import { LibrarySectionHeader } from './library-section-header';

const ACCENT = '#A078FF';
const META = '#958EA0';

type LibraryPlaylistsPanelProps = {
  items: LibraryPlaylistItem[];
  onItemPress?: (item: LibraryPlaylistItem) => void;
  contentBottomInset?: number;
};

export function LibraryPlaylistsPanel({
  items,
  onItemPress,
  contentBottomInset = 28,
}: LibraryPlaylistsPanelProps) {
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
              label="Curated collections"
              count={items.length}
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
                showError(item.title, 'Playlist details coming soon.');
              }}
              onMorePress={() =>
                showError(item.title, 'Playlist options coming soon.')
              }
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

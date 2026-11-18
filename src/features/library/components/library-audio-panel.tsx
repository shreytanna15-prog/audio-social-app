import { useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';

import { Text } from '@/shared/components/ui/text';

import type { LibraryAudioFilter, LibraryAudioItem } from '../types';
import { LibraryAudioFilterControl } from './library-audio-filter';
import { LibraryAudioRow } from './library-audio-row';
import { LibraryAudioVisibilityToggle } from './library-audio-visibility-toggle';
import { LibrarySectionHeader } from './library-section-header';

type LibraryAudioPanelProps = {
  items: LibraryAudioItem[];
  filter: LibraryAudioFilter;
  onFilterChange: (filter: LibraryAudioFilter) => void;
  onItemPress: (item: LibraryAudioItem) => void;
  onMorePress?: (item: LibraryAudioItem) => void;
  contentBottomInset?: number;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
};

function filterAudioItems(
  items: LibraryAudioItem[],
  filter: LibraryAudioFilter,
  showDrafts: boolean,
): LibraryAudioItem[] {
  const base =
    !showDrafts && filter !== 'DRAFT'
      ? items.filter((item) => item.status !== 'DRAFT')
      : items;

  if (filter === 'all') {
    return base;
  }
  if (filter === 'PUBLISHED' || filter === 'DRAFT') {
    return base.filter((item) => item.status === filter);
  }
  return base.filter((item) => item.kind === filter);
}

export function LibraryAudioPanel({
  items,
  filter,
  onFilterChange,
  onItemPress,
  onMorePress,
  contentBottomInset = 28,
  isLoading = false,
  isError = false,
  onRetry,
}: LibraryAudioPanelProps) {
  const [showDrafts, setShowDrafts] = useState(true);
  const visible = filterAudioItems(items, filter, showDrafts);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <ActivityIndicator color="#D0BCFF" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center gap-3 px-8 py-16">
        <Text variant="title-md" className="text-on-surface">
          Couldn’t load tracks
        </Text>
        <Text variant="body-md" className="text-center text-on-surface-variant">
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
    );
  }

  return (
    <FlatList
      className="flex-1"
      data={visible}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        gap: 10,
        paddingBottom: contentBottomInset,
      }}
      ListHeaderComponent={
        <View className="mb-2 pb-1 pt-1">
          <LibrarySectionHeader
            label="Tracks"
            trailing={
              <>
                <LibraryAudioFilterControl
                  value={filter}
                  onChange={onFilterChange}
                />
                <LibraryAudioVisibilityToggle
                  showDrafts={showDrafts}
                  onChange={setShowDrafts}
                />
              </>
            }
          />
        </View>
      }
      renderItem={({ item }) => (
        <LibraryAudioRow
          item={item}
          onPress={onItemPress}
          onMorePress={onMorePress}
        />
      )}
      ListEmptyComponent={
        <View className="items-center gap-2 px-8 py-16">
          <Text variant="title-md" className="text-on-surface">
            No takes yet
          </Text>
          <Text variant="body-md" className="text-center text-on-surface-variant">
            {!showDrafts && filter !== 'DRAFT'
              ? 'Drafts are hidden. Tap the eye to show them, or change the filter.'
              : 'Record a take and Save — drafts need a connection for library sync.'}
          </Text>
        </View>
      }
    />
  );
}

import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  View,
} from 'react-native';

import {
  useClearSearchRecent,
  useRecordSearchRecent,
  useRemoveSearchRecent,
  useSearchRecent,
  useSearchUsers,
} from '@/features/users';
import { ScreenHeader } from '@/shared/components/layout/screen-header';
import { Text } from '@/shared/components/ui/text';
import { useNavigationGuard } from '@/shared/lib/use-navigation-guard';

import { ExploreFilterChips } from '../components/explore-filter-chips';
import { SearchArtistRow } from '../components/search-artist-row';
import { SearchField } from '../components/search-field';
import { SearchRecentRow } from '../components/search-recent-row';
import {
  buildSearchChips,
  isArtistResultsChip,
  isComingSoonChip,
  type SearchChipId,
} from '../data/search-tabs';

const DEBOUNCE_MS = 300;
const ACCENT = '#D0BCFF';
/** Clears tab bar + mini player */
const LIST_BOTTOM_PAD = 'pb-36';

export function SearchScreen() {
  const { push } = useRouter();
  const { guard } = useNavigationGuard();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedChipId, setSelectedChipId] =
    useState<SearchChipId>('recent');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (debouncedQuery.length > 0 && selectedChipId === 'recent') {
      setSelectedChipId('results');
    }
  }, [debouncedQuery, selectedChipId]);

  const chips = useMemo(
    () => buildSearchChips(debouncedQuery),
    [debouncedQuery],
  );

  const viewingRecent = selectedChipId === 'recent';
  const showComingSoon = isComingSoonChip(selectedChipId);
  const showArtists = isArtistResultsChip(selectedChipId);
  const hasQuery = debouncedQuery.length > 0;

  const searchQuery = useSearchUsers(
    debouncedQuery,
    showArtists && hasQuery && !viewingRecent,
  );
  const recentQuery = useSearchRecent();
  const recordRecent = useRecordSearchRecent();
  const clearRecent = useClearSearchRecent();
  const removeRecent = useRemoveSearchRecent();

  const openArtist = (targetUserId: string, searchQueryText?: string) => {
    void recordRecent
      .mutateAsync({
        kind: 'ARTIST',
        targetUserId,
        query: searchQueryText,
      })
      .catch(() => {
        // Navigation should still work if recent recording fails.
      });
    guard(() => push(`/artist/${targetUserId}`));
  };

  const onChangeQuery = (text: string) => {
    setQuery(text);
    if (text.trim().length === 0) {
      setSelectedChipId('recent');
    }
  };

  const onSelectChip = (id: string) => {
    const chip = id as SearchChipId;
    setSelectedChipId(chip);
    if (chip === 'recent') {
      setQuery('');
      setDebouncedQuery('');
    }
  };

  const recent = recentQuery.data ?? [];
  const artists = searchQuery.data ?? [];
  const artistsLoading = searchQuery.isFetching || searchQuery.isPending;
  const recentLoading = recentQuery.isLoading;

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        layout="inline"
        showBorder={false}
        title={
          <SearchField
            value={query}
            onChangeText={onChangeQuery}
            autoFocus
            accessibilityLabel="Search songs, artists, stems, playlists"
          />
        }
      />

      <View className="border-b border-white/10 py-2.5">
        <ExploreFilterChips
          filters={chips}
          selectedId={selectedChipId}
          onSelect={onSelectChip}
        />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName={`pt-3 ${LIST_BOTTOM_PAD}`}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {viewingRecent ? (
          <View>
            <View className="mb-1 flex-row items-center justify-between px-4 pb-1">
              <Text
                variant="title-md"
                className="text-on-surface"
                style={{ color: '#E4E1EA' }}>
                Recent
              </Text>
              {recent.length > 0 ? (
                <Pressable
                  onPress={() => clearRecent.mutate()}
                  accessibilityRole="button"
                  accessibilityLabel="Clear all recent searches"
                  hitSlop={8}>
                  <Text
                    variant="label-md"
                    className="font-semibold text-primary-tonal">
                    Clear all
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {recentLoading ? (
              <View className="items-center py-10">
                <ActivityIndicator color={ACCENT} />
              </View>
            ) : null}

            {!recentLoading && recentQuery.isError ? (
              <View className="items-center gap-2 px-4 py-10">
                <Text
                  variant="body-md"
                  className="text-center text-on-surface-variant">
                  Couldn’t load recent searches.
                </Text>
                <Pressable
                  onPress={() => {
                    void recentQuery.refetch();
                  }}
                  accessibilityRole="button"
                  hitSlop={8}>
                  <Text
                    variant="label-md"
                    className="font-semibold text-primary-tonal">
                    Retry
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {!recentLoading && !recentQuery.isError && recent.length === 0 ? (
              <Text
                variant="body-md"
                className="px-4 py-6 text-on-surface-variant">
                Artists you open from search will show up here.
              </Text>
            ) : null}

            {!recentLoading && !recentQuery.isError
              ? recent.map((item) => (
                  <SearchRecentRow
                    key={item.id}
                    item={item}
                    onPress={() => {
                      if (item.kind === 'ARTIST' && item.targetUser) {
                        openArtist(item.targetUser.id);
                      }
                    }}
                    onRemove={() => removeRecent.mutate(item.id)}
                  />
                ))
              : null}
          </View>
        ) : null}

        {!viewingRecent && showComingSoon ? (
          <Text
            variant="body-md"
            className="px-4 py-10 text-center text-on-surface-variant">
            Coming soon
          </Text>
        ) : null}

        {!viewingRecent && showArtists && !hasQuery ? (
          <Text
            variant="body-md"
            className="px-4 py-10 text-center text-on-surface-variant">
            Type to search artists
          </Text>
        ) : null}

        {!viewingRecent && showArtists && hasQuery ? (
          <View className="gap-1">
            {artistsLoading ? (
              <View className="items-center py-10">
                <ActivityIndicator color={ACCENT} />
              </View>
            ) : null}

            {!artistsLoading && searchQuery.isError ? (
              <View className="items-center gap-2 px-4 py-10">
                <Text
                  variant="body-md"
                  className="text-center text-on-surface-variant">
                  Couldn’t search artists.
                </Text>
                <Pressable
                  onPress={() => {
                    void searchQuery.refetch();
                  }}
                  accessibilityRole="button"
                  hitSlop={8}>
                  <Text
                    variant="label-md"
                    className="font-semibold text-primary-tonal">
                    Retry
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {!artistsLoading &&
            !searchQuery.isError &&
            artists.length === 0 ? (
              <Text
                variant="body-md"
                className="px-4 py-10 text-center text-on-surface-variant">
                No artists found
              </Text>
            ) : null}

            {!artistsLoading && !searchQuery.isError
              ? artists.map((artist) => (
                  <SearchArtistRow
                    key={artist.id}
                    name={artist.name}
                    username={artist.username}
                    avatarUrl={artist.avatarUrl}
                    onPress={() => openArtist(artist.id, debouncedQuery)}
                  />
                ))
              : null}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

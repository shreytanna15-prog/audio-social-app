import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

import { getAlbum } from '@/features/albums';
import { usePlayerStore } from '@/features/player';
import { getPlaylist } from '@/features/playlists';
import {
  type MusicSearchItem,
  type SearchRecentItem,
  useClearSearchRecent,
  useRecordSearchRecent,
  useRemoveSearchRecent,
  useSearchMusic,
  useSearchRecent,
} from '@/features/search';
import {
  searchTracks,
  useSearchUsers,
} from '@/features/users';
import { ScreenHeader } from '@/shared/components/layout/screen-header';
import { useFeedbackDialog } from '@/shared/components/ui/feedback-dialog';
import { Text } from '@/shared/components/ui/text';
import { useNavigationGuard } from '@/shared/lib/use-navigation-guard';

import { ExploreFilterChips } from '../components/explore-filter-chips';
import { MusicSearchRow } from '../components/music-search-row';
import { SearchArtistRow } from '../components/search-artist-row';
import { SearchField } from '../components/search-field';
import { SearchRecentRow } from '../components/search-recent-row';
import { buildSearchChips, type SearchChipId } from '../data/search-tabs';
import {
  collectionToPlayerTrack,
  musicRecentRequest,
  musicResultToPlayerTrack,
} from '../utils/search-actions';

const DEBOUNCE_MS = 300;

export function SearchScreen() {
  const { push } = useRouter();
  const { guard } = useNavigationGuard();
  const { showError, dialog } = useFeedbackDialog();
  const play = usePlayerStore((s) => s.play);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedChip, setSelectedChip] = useState<SearchChipId>('music');
  const [openingRecentId, setOpeningRecentId] = useState<string | null>(null);
  const hasQuery = query.trim().length > 0;
  const ready = hasQuery && debouncedQuery === query.trim();
  const chips = buildSearchChips(query);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const musicQuery = useSearchMusic(debouncedQuery, ready && selectedChip === 'music');
  const artistsQuery = useSearchUsers(debouncedQuery, ready && selectedChip === 'artists');
  const recentQuery = useSearchRecent();
  const recordRecent = useRecordSearchRecent();
  const clearRecent = useClearSearchRecent();
  const removeRecent = useRemoveSearchRecent();

  const record = (item: Parameters<typeof recordRecent.mutate>[0]) => {
    recordRecent.mutate(item);
  };

  const openArtist = (id: string, searchText?: string) => {
    record({
      kind: 'ARTIST',
      targetUserId: id,
      ...(searchText?.trim() ? { query: searchText.trim().slice(0, 100) } : {}),
    });
    guard(() => push(`/artist/${id}`));
  };

  const openMusic = (item: MusicSearchItem) => {
    record(musicRecentRequest(item, debouncedQuery));
    const track = musicResultToPlayerTrack(item);
    if (track) play(track);
    if (item.type === 'song') {
      if (track) guard(() => push('/player'));
      else showError('Unavailable', 'This song cannot be played right now.');
      return;
    }
    guard(() => push(item.type === 'playlist' ? `/playlists/${item.id}` : `/albums/${item.id}`));
  };

  const openRecent = async (item: SearchRecentItem) => {
    if (item.kind === 'ARTIST') {
      if (item.targetUser) openArtist(item.targetUser.id);
      return;
    }
    if (openingRecentId) return;
    setOpeningRecentId(item.id);
    try {
      if (item.kind === 'SONG') {
        const matches = await searchTracks(item.title ?? '', 20);
        const song = matches.find((result) => result.id === item.targetKey);
        if (!song?.mixUrl) {
          showError('Unavailable', 'This song is no longer available.');
          return;
        }
        play({
          id: song.id,
          title: song.title,
          artist: song.artist.name?.trim() || song.artist.username,
          coverUrl: song.coverUrl ?? '',
          mixUrl: song.mixUrl,
        });
        record({
          kind: 'SONG',
          targetId: song.id,
          title: song.title,
          subtitle: song.artist.name?.trim() || song.artist.username,
          ...(song.coverUrl && song.coverUrl.length <= 2048
            ? { coverUrl: song.coverUrl }
            : {}),
          ...(item.query ? { query: item.query } : {}),
        });
        push('/player');
        return;
      }
      const collection = item.kind === 'PLAYLIST'
        ? await getPlaylist(item.targetKey)
        : await getAlbum(item.targetKey);
      const track = collectionToPlayerTrack(collection);
      if (track) play(track);
      const coverUrl = 'coverFallbackUrls' in collection
        ? (collection.coverUrl ?? collection.coverFallbackUrls[0])
        : (collection.coverUrl ?? collection.coverFallbackUrl);
      record({
        kind: item.kind,
        targetId: item.targetKey,
        title: collection.title,
        ...(item.subtitle ? { subtitle: item.subtitle } : {}),
        ...(coverUrl && coverUrl.length <= 2048 ? { coverUrl } : {}),
        ...(item.query ? { query: item.query } : {}),
      });
      push(item.kind === 'PLAYLIST'
        ? `/playlists/${item.targetKey}` : `/albums/${item.targetKey}`);
    } catch {
      showError('Unavailable', 'This item is no longer available.');
    } finally {
      setOpeningRecentId(null);
    }
  };

  const activeQuery = selectedChip === 'music' ? musicQuery : artistsQuery;
  const isSearching = hasQuery && (!ready || activeQuery.isPending || activeQuery.isFetching);
  const recent = recentQuery.data ?? [];

  return (
    <View className="flex-1 bg-background">
      <ScreenHeader
        layout="inline"
        showBorder={false}
        title={<SearchField value={query} onChangeText={(text) => {
          if (!query.trim() && text.trim()) setSelectedChip('music');
          setQuery(text);
          if (!text.trim()) setDebouncedQuery('');
        }} autoFocus placeholder="Search songs, artists, playlists, albums" />}
      />
      {hasQuery ? (
        <View className="border-b border-white/10 py-2.5">
          <ExploreFilterChips filters={chips} selectedId={selectedChip}
            onSelect={(id) => setSelectedChip(id as SearchChipId)} />
        </View>
      ) : null}
      <ScrollView className="flex-1" contentContainerClassName="pb-36 pt-3"
        keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {!hasQuery ? (
          <View>
            <View className="mb-1 flex-row items-center justify-between px-4 pb-1">
              <Text variant="title-md" className="text-on-surface">Recent</Text>
              {recent.length > 0 ? (
                <Pressable onPress={() => clearRecent.mutate()} accessibilityRole="button"
                  accessibilityLabel="Clear all recent searches" hitSlop={8}>
                  <Text variant="label-md" className="font-semibold text-primary-tonal">Clear all</Text>
                </Pressable>
              ) : null}
            </View>
            {recentQuery.isLoading ? <View className="items-center py-10"><ActivityIndicator color="#D0BCFF" /></View> : null}
            {recentQuery.isError ? (
              <Pressable onPress={() => void recentQuery.refetch()} accessibilityRole="button"
                className="px-4 py-8">
                <Text className="text-on-surface-variant">Couldn’t load recent searches. Tap to retry.</Text>
              </Pressable>
            ) : null}
            {!recentQuery.isLoading && !recentQuery.isError && recent.length === 0 ? (
              <Text variant="body-md" className="px-4 py-6 text-on-surface-variant">
                Songs, collections, and artists you open will show up here.
              </Text>
            ) : null}
            {recent.map((item) => (
              <SearchRecentRow key={item.id} item={item}
                onPress={() => void openRecent(item)}
                onRemove={() => removeRecent.mutate(item.id)} />
            ))}
            {openingRecentId ? <ActivityIndicator color="#D0BCFF" /> : null}
          </View>
        ) : (
          <View className="gap-1">
            {isSearching ? <View className="items-center py-10"><ActivityIndicator color="#D0BCFF" /></View> : null}
            {ready && activeQuery.isError ? (
              <Pressable onPress={() => void activeQuery.refetch()} accessibilityRole="button"
                className="px-4 py-10">
                <Text className="text-center text-on-surface-variant">Couldn’t search. Tap to retry.</Text>
              </Pressable>
            ) : null}
            {ready && !isSearching && !activeQuery.isError && selectedChip === 'music' ? (
              musicQuery.data?.length ? musicQuery.data.map((item) => (
                <MusicSearchRow key={`${item.type}-${item.id}`} item={item}
                  onPress={() => openMusic(item)} />
              )) : <Text className="px-4 py-10 text-center text-on-surface-variant">No music found</Text>
            ) : null}
            {ready && !isSearching && !activeQuery.isError && selectedChip === 'artists' ? (
              artistsQuery.data?.length ? artistsQuery.data.map((artist) => (
                <SearchArtistRow key={artist.id} name={artist.name}
                  username={artist.username} avatarUrl={artist.avatarUrl}
                  onPress={() => openArtist(artist.id, debouncedQuery)} />
              )) : <Text className="px-4 py-10 text-center text-on-surface-variant">No artists found</Text>
            ) : null}
          </View>
        )}
      </ScrollView>
      {dialog}
    </View>
  );
}

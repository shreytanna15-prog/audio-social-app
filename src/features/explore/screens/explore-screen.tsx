import { type Href, useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  useDiscoverPlaylists,
  useFeaturedArtists,
  useRisingArtists,
  useTrendingTracks,
  type DiscoverTrackDto,
  type RisingArtistDto,
} from '@/features/discover';
import { usePlayerStore, type PlayerTrack } from '@/features/player';
import {
  ChallengeCard,
  CuratedPlaylistsSection,
  FeaturedArtistsSection,
  TrendingSection,
} from '@/shared/components/music';
import { SectionStatus } from '@/shared/components/section-status';
import { Text } from '@/shared/components/ui/text';
import {
  getSectionErrorLabel,
  isSectionNetworkError,
} from '@/shared/lib/section-load-error';
import { useNavigationGuard } from '@/shared/lib/use-navigation-guard';

import { ExploreHeroCarousel } from '../components/explore-hero-carousel';
import { ExploreSearchBar } from '../components/explore-search-bar';
import { RisingCreatorCard } from '../components/rising-creator-card';
import type { FeaturedSong } from '../data/featured-song';
import {
  mapDiscoverPlaylist,
  mapFeaturedArtist,
  mapHeroSong,
  mapRisingCreator,
  mapTopSong,
} from '../utils/map-explore';

function toPlayerTrack(input: {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  mixUrl?: string | null;
  likeCount?: number;
}): PlayerTrack {
  return {
    id: input.id,
    title: input.title,
    artist: input.artist,
    coverUrl: input.coverUrl,
    mixUrl: input.mixUrl,
    likeCount: input.likeCount ?? 0,
    isLiked: false,
  };
}

function artistName(track: DiscoverTrackDto): string {
  return track.artist.name?.trim() || track.artist.username;
}

export function ExploreScreen() {
  const { push } = useRouter();
  const { guard } = useNavigationGuard();
  const insets = useSafeAreaInsets();
  const play = usePlayerStore((s) => s.play);
  const playQueue = usePlayerStore((s) => s.playQueue);

  const heroQuery = useTrendingTracks(3, 'all');
  const topSongsQuery = useTrendingTracks(12, 'all');
  const risingQuery = useRisingArtists(1);
  const featuredQuery = useFeaturedArtists(8);
  const playlistsQuery = useDiscoverPlaylists(8);

  const heroTracks = heroQuery.data ?? [];
  const heroSongs = heroTracks.map((track, index) => mapHeroSong(track, index + 1));
  const topSongs = (topSongsQuery.data ?? []).map((track, index) =>
    mapTopSong(track, index + 1),
  );
  const risingArtist = risingQuery.data?.[0] ?? null;
  const risingCreator = risingArtist ? mapRisingCreator(risingArtist) : null;
  const featuredArtists = (featuredQuery.data ?? []).map(mapFeaturedArtist);
  const discoverPlaylists = (playlistsQuery.data ?? []).map(mapDiscoverPlaylist);

  const queries = [
    heroQuery,
    topSongsQuery,
    risingQuery,
    featuredQuery,
    playlistsQuery,
  ];
  const isRefreshing = queries.some((query) => query.isRefetching);
  const hasContent =
    heroSongs.length > 0 ||
    topSongs.length > 0 ||
    risingCreator != null ||
    featuredArtists.length > 0 ||
    discoverPlaylists.length > 0;
  const hasAnyError = queries.some((query) => query.isError);
  const isAnyLoading = queries.some((query) => query.isLoading);
  const failedQueries = queries.filter((query) => query.isError);
  const isOfflineFailure =
    failedQueries.length > 0 &&
    failedQueries.every((query) => isSectionNetworkError(query.error));
  const showGlobalEmptyState = !hasContent && !isAnyLoading;

  const refetchExplore = () =>
    Promise.all(queries.map((query) => query.refetch()));

  const playTrackDto = (track: DiscoverTrackDto, queue?: DiscoverTrackDto[]) => {
    const current = toPlayerTrack({
      id: track.id,
      title: track.title,
      artist: artistName(track),
      coverUrl: track.coverUrl ?? '',
      mixUrl: track.mixUrl,
      likeCount: track.likeCount,
    });
    if (queue && queue.length > 1) {
      playQueue(
        queue.map((item) =>
          toPlayerTrack({
            id: item.id,
            title: item.title,
            artist: artistName(item),
            coverUrl: item.coverUrl ?? '',
            mixUrl: item.mixUrl,
            likeCount: item.likeCount,
          }),
        ),
        queue.findIndex((item) => item.id === track.id),
      );
      return;
    }
    play(current);
  };

  const playHeroSong = (song: FeaturedSong) => {
    const track = heroTracks.find((item) => item.id === song.id);
    if (!track) return;
    playTrackDto(track, heroTracks);
  };

  const playRisingSample = (artist: RisingArtistDto) => {
    const sample = artist.sampleTrack;
    if (!sample?.mixUrl) return;
    play(
      toPlayerTrack({
        id: sample.id,
        title: sample.title,
        artist: artist.name?.trim() || artist.username,
        coverUrl: sample.coverUrl ?? artist.avatarUrl ?? '',
        mixUrl: sample.mixUrl,
      }),
    );
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 8 }}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 pb-8"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void refetchExplore()}
            tintColor="#D0BCFF"
          />
        }>
        <ExploreSearchBar onPress={() => guard(() => push('/explore/search' as Href))} />

        {showGlobalEmptyState ? (
          <View className="mx-4 gap-3 rounded-2xl border border-white/5 bg-surface-container p-5">
            <Text className="text-center text-on-surface">
              {isOfflineFailure
                ? 'You’re offline'
                : hasAnyError
                  ? 'Couldn’t load Explore'
                  : 'Nothing to show on Explore yet.'}
            </Text>
            <Text className="text-center text-on-surface-variant">
              {isOfflineFailure
                ? 'Check your connection and retry.'
                : hasAnyError
                  ? 'Pull to refresh or tap Retry.'
                  : 'Published tracks and public playlists will appear here.'}
            </Text>
            {hasAnyError ? (
              <Pressable
                onPress={() => void refetchExplore()}
                accessibilityRole="button"
                accessibilityLabel="Retry Explore"
                className="items-center self-center rounded-full bg-surface-container-high px-4 py-2">
                <Text variant="label-md" className="font-semibold text-primary-tonal">
                  Retry
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <>
            {heroSongs.length > 0 ? (
              <View className="gap-4">
                <View className="px-4">
                  <Text variant="title-lg" className="text-on-surface">
                    Find Your Sound
                  </Text>
                  <Text variant="body-md" className="text-on-surface-variant">
                    All-time top tracks
                  </Text>
                </View>
                <ExploreHeroCarousel songs={heroSongs} onPlay={playHeroSong} />
              </View>
            ) : (
              <SectionStatus
                isLoading={heroQuery.isLoading}
                isError={heroQuery.isError}
                skeleton="hero"
                onRetry={() => void heroQuery.refetch()}
                errorLabel={getSectionErrorLabel(
                  heroQuery.error,
                  'You’re offline. Check your connection and retry.',
                  'Couldn’t load featured tracks.',
                )}
              />
            )}

            {risingCreator && risingArtist ? (
              <RisingCreatorCard
                creator={risingCreator}
                onPress={() => guard(() => push(`/artist/${risingCreator.id}`))}
                onSamplePress={
                  risingArtist.sampleTrack?.mixUrl
                    ? () => playRisingSample(risingArtist)
                    : undefined
                }
                onFollowPress={() =>
                  guard(() => push(`/artist/${risingCreator.id}`))
                }
              />
            ) : (
              <SectionStatus
                isLoading={risingQuery.isLoading}
                isError={risingQuery.isError}
                skeleton="rising"
                onRetry={() => void risingQuery.refetch()}
                errorLabel={getSectionErrorLabel(
                  risingQuery.error,
                  'You’re offline. Check your connection and retry.',
                  'Couldn’t load rising creator.',
                )}
              />
            )}

            {featuredArtists.length > 0 ? (
              <FeaturedArtistsSection
                title="Top Creators"
                artists={featuredArtists}
                onArtistPress={(artist) =>
                  guard(() => push(`/artist/${artist.id}`))
                }
              />
            ) : (
              <SectionStatus
                isLoading={featuredQuery.isLoading}
                isError={featuredQuery.isError}
                skeleton="artists"
                skeletonTitle="Top Creators"
                onRetry={() => void featuredQuery.refetch()}
                errorLabel={getSectionErrorLabel(
                  featuredQuery.error,
                  'You’re offline. Check your connection and retry.',
                  'Couldn’t load top creators.',
                )}
              />
            )}

            <ChallengeCard
              statusLabel="Active Community Contest"
              title="Remix Roulette: Neo-Soul"
              description="Sample Maya Lin's raw studio vocal stems, flip the groove, and earn peer votes from the VibeOGram creator community."
              endsIn="Ends in 3d 12h"
              prizeLabel="Prize Pool"
              prize="$1,500 Studio Grant & Official Release"
              primaryActionLabel="Join & Download Stems"
              secondaryAction="share"
            />

            {topSongs.length > 0 ? (
              <TrendingSection
                title="Top Songs"
                tracks={topSongs}
                onTrackPress={(track) => {
                  const dto = topSongsQuery.data?.find(
                    (item) => item.id === track.id,
                  );
                  if (!dto) return;
                  playTrackDto(dto, topSongsQuery.data);
                }}
              />
            ) : (
              <SectionStatus
                isLoading={topSongsQuery.isLoading}
                isError={topSongsQuery.isError}
                skeleton="trending"
                skeletonTitle="Top Songs"
                onRetry={() => void topSongsQuery.refetch()}
                errorLabel={getSectionErrorLabel(
                  topSongsQuery.error,
                  'You’re offline. Check your connection and retry.',
                  'Couldn’t load top songs.',
                )}
              />
            )}

            {discoverPlaylists.length > 0 ? (
              <CuratedPlaylistsSection
                title="Discover playlists"
                playlists={discoverPlaylists}
                onPlaylistPress={(playlist) =>
                  guard(() => push(`/playlists/${playlist.id}` as Href))
                }
              />
            ) : (
              <SectionStatus
                isLoading={playlistsQuery.isLoading}
                isError={playlistsQuery.isError}
                skeleton="playlists"
                skeletonTitle="Discover playlists"
                onRetry={() => void playlistsQuery.refetch()}
                errorLabel={getSectionErrorLabel(
                  playlistsQuery.error,
                  'You’re offline. Check your connection and retry.',
                  'Couldn’t load playlists.',
                )}
              />
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

import { type Href, useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';

import {
  useFeaturedArtists,
  useMadeForYouTracks,
  useTrendingTracks,
} from '@/features/discover';
import { usePlayerStore, type PlayerTrack } from '@/features/player';
import { useMe } from '@/features/profile/api/hooks';
import { AppHeader } from '@/shared/components/layout/app-header';
import {
  ChallengeCard,
  CuratedPlaylistsSection,
  FeaturedArtistsSection,
  TrendingSection,
} from '@/shared/components/music';
import { Text } from '@/shared/components/ui/text';
import { useNavigationGuard } from '@/shared/lib/use-navigation-guard';

import {
  useHomePlaylists,
  useLatestProject,
  useRecentlyPlayed,
} from '../api/hooks';
import { HomeGreetingRow } from '../components/home-greeting-row';
import { HomeSectionStatus } from '../components/home-section-status';
import {
  MadeForYourVibeSection,
  type VibeTrack,
} from '../components/made-for-your-vibe-section';
import { ProjectCard } from '../components/project-card';
import { RecentlyPlayedSection } from '../components/recently-played-section';
import {
  formatRelativeUpdatedAt,
  mapFeaturedArtist,
  mapHomePlaylist,
  mapMadeForYouTrack,
  mapRecentlyPlayedTrack,
  mapTrendingTrack,
} from '../utils/map-discover';
import {
  getHomeSectionErrorLabel,
  isHomeNetworkError,
} from '../utils/home-load-error';

function toPlayerTrack(input: {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  likeCount: number;
  isLiked: boolean;
  mixUrl?: string | null;
}): PlayerTrack {
  return {
    id: input.id,
    title: input.title,
    artist: input.artist,
    coverUrl: input.coverUrl,
    mixUrl: input.mixUrl,
    likeCount: input.likeCount,
    isLiked: input.isLiked,
  };
}

export function HomeScreen() {
  const { push } = useRouter();
  const { guard } = useNavigationGuard();
  const playQueue = usePlayerStore((s) => s.playQueue);
  const { data: me, isPending: isMePending, isError: isMeError } = useMe();
  // Wait for /me so greeting does not flash placeholder → real name.
  const isGreetingReady = !isMePending || me != null || isMeError;
  const greetingName = me?.name?.trim() || me?.username || 'there';
  const hasUnreadNotifications = (me?.unreadNotificationCount ?? 0) > 0;

  const latestProjectQuery = useLatestProject();
  const featuredQuery = useFeaturedArtists(8);
  const trendingQuery = useTrendingTracks(12);
  const playlistsQuery = useHomePlaylists(8);
  const madeForYouQuery = useMadeForYouTracks(12);
  const recentlyPlayedQuery = useRecentlyPlayed(8);

  const latestProject = latestProjectQuery.data ?? null;
  const featuredArtists = (featuredQuery.data ?? []).map(mapFeaturedArtist);
  const trendingTracks = (trendingQuery.data ?? []).map((track, index) =>
    mapTrendingTrack(track, index + 1),
  );
  const homePlaylists = (playlistsQuery.data ?? []).map(mapHomePlaylist);
  const madeForYouTracks = (madeForYouQuery.data ?? []).map(mapMadeForYouTrack);
  const recentlyPlayed = (recentlyPlayedQuery.data ?? []).map(
    mapRecentlyPlayedTrack,
  );

  const hasContent =
    latestProject != null ||
    featuredArtists.length > 0 ||
    madeForYouTracks.length > 0 ||
    trendingTracks.length > 0 ||
    homePlaylists.length > 0 ||
    recentlyPlayed.length > 0;

  const anySectionLoading =
    latestProjectQuery.isLoading ||
    featuredQuery.isLoading ||
    trendingQuery.isLoading ||
    playlistsQuery.isLoading ||
    madeForYouQuery.isLoading ||
    recentlyPlayedQuery.isLoading;

  const sectionErrors = [
    latestProjectQuery.error,
    featuredQuery.error,
    trendingQuery.error,
    playlistsQuery.error,
    madeForYouQuery.error,
    recentlyPlayedQuery.error,
  ].filter(Boolean);

  const hasAnyError =
    latestProjectQuery.isError ||
    featuredQuery.isError ||
    trendingQuery.isError ||
    playlistsQuery.isError ||
    madeForYouQuery.isError ||
    recentlyPlayedQuery.isError;

  const isOfflineFailure =
    sectionErrors.length > 0 && sectionErrors.every(isHomeNetworkError);

  const showGlobalEmptyState = !anySectionLoading && !hasContent;

  const isRefreshing =
    latestProjectQuery.isRefetching ||
    featuredQuery.isRefetching ||
    trendingQuery.isRefetching ||
    playlistsQuery.isRefetching ||
    madeForYouQuery.isRefetching ||
    recentlyPlayedQuery.isRefetching;

  const refetchHome = () => {
    void Promise.all([
      latestProjectQuery.refetch(),
      featuredQuery.refetch(),
      trendingQuery.refetch(),
      playlistsQuery.refetch(),
      madeForYouQuery.refetch(),
      recentlyPlayedQuery.refetch(),
    ]);
  };

  const playSectionQueue = (
    track: {
      id: string;
      title: string;
      artist: string;
      coverUrl: string;
      likeCount: number;
      isLiked: boolean;
      mixUrl?: string | null;
    },
    section: Array<{
      id: string;
      title: string;
      artist: string;
      coverUrl: string;
      likeCount: number;
      isLiked: boolean;
      mixUrl?: string | null;
    }>,
  ) => {
    const queue = section.map(toPlayerTrack);
    const startIndex = queue.findIndex((item) => item.id === track.id);
    playQueue(queue, startIndex < 0 ? 0 : startIndex);
  };

  return (
    <View className="flex-1 bg-background">
      <AppHeader showNotificationBadge={hasUnreadNotifications} />
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 pb-8 pt-1"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing && (hasContent || showGlobalEmptyState)}
            onRefresh={refetchHome}
            tintColor="#D0BCFF"
          />
        }
        showsVerticalScrollIndicator={false}>
        {isGreetingReady ? <HomeGreetingRow name={greetingName} /> : null}

        {showGlobalEmptyState ? (
          <View className="mx-4 gap-3 rounded-2xl border border-white/5 bg-surface-container px-4 py-8">
            <Text className="text-center text-on-surface">
              {isOfflineFailure
                ? 'You’re offline'
                : hasAnyError
                  ? 'Couldn’t load Home'
                  : 'Nothing to show on Home yet.'}
            </Text>
            <Text className="text-center text-on-surface-variant">
              {isOfflineFailure
                ? 'Check your connection, then retry.'
                : hasAnyError
                  ? 'Pull to refresh or tap Retry to try again.'
                  : 'Publish a track, follow artists, or play something to fill this screen.'}
            </Text>
            {hasAnyError ? (
              <Pressable
                onPress={refetchHome}
                accessibilityRole="button"
                accessibilityLabel="Retry loading Home"
                className="items-center self-center rounded-full bg-surface-container-high px-4 py-2">
                <Text
                  variant="label-md"
                  className="font-semibold text-primary-tonal">
                  Retry
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <>
            {latestProject ? (
              <ProjectCard
                title={latestProject.title}
                version={`${latestProject.trackCount} ${latestProject.trackCount === 1 ? 'track' : 'tracks'}`}
                meta={`Updated ${formatRelativeUpdatedAt(latestProject.updatedAt)}`}
                description={latestProject.description?.trim() || null}
                onOpenPress={() =>
                  guard(() =>
                    push({
                      pathname: '/projects/[id]',
                      params: { id: latestProject.id, from: 'home' },
                    } as Href),
                  )
                }
              />
            ) : (
              <HomeSectionStatus
                isLoading={latestProjectQuery.isLoading}
                isError={latestProjectQuery.isError}
                skeleton="project"
                onRetry={() => void latestProjectQuery.refetch()}
                errorLabel={getHomeSectionErrorLabel(
                  latestProjectQuery.error,
                  'You’re offline. Check your connection and retry.',
                  'Couldn’t load your latest project.',
                )}
              />
            )}

            {featuredArtists.length > 0 ? (
              <FeaturedArtistsSection
                artists={featuredArtists}
                onArtistPress={(artist) =>
                  guard(() => push(`/artist/${artist.id}` as Href))
                }
              />
            ) : (
              <HomeSectionStatus
                isLoading={featuredQuery.isLoading}
                isError={featuredQuery.isError}
                skeleton="artists"
                onRetry={() => void featuredQuery.refetch()}
                errorLabel={getHomeSectionErrorLabel(
                  featuredQuery.error,
                  'You’re offline. Check your connection and retry.',
                  'Couldn’t load featured artists.',
                )}
              />
            )}

            {madeForYouTracks.length > 0 ? (
              <MadeForYourVibeSection
                tracks={madeForYouTracks}
                onTrackPress={(track: VibeTrack) =>
                  playSectionQueue(track, madeForYouTracks)
                }
                onPlayPress={(track: VibeTrack) =>
                  playSectionQueue(track, madeForYouTracks)
                }
              />
            ) : (
              <HomeSectionStatus
                isLoading={madeForYouQuery.isLoading}
                isError={madeForYouQuery.isError}
                skeleton="vibe"
                onRetry={() => void madeForYouQuery.refetch()}
                errorLabel={getHomeSectionErrorLabel(
                  madeForYouQuery.error,
                  'You’re offline. Check your connection and retry.',
                  'Couldn’t load Made for your vibe.',
                )}
              />
            )}

            {trendingTracks.length > 0 ? (
              <TrendingSection
                tracks={trendingTracks}
                onTrackPress={(track) =>
                  playSectionQueue(track, trendingTracks)
                }
              />
            ) : (
              <HomeSectionStatus
                isLoading={trendingQuery.isLoading}
                isError={trendingQuery.isError}
                skeleton="trending"
                onRetry={() => void trendingQuery.refetch()}
                errorLabel={getHomeSectionErrorLabel(
                  trendingQuery.error,
                  'You’re offline. Check your connection and retry.',
                  'Couldn’t load trending tracks.',
                )}
              />
            )}

            {homePlaylists.length > 0 ? (
              <CuratedPlaylistsSection
                title="Your playlists"
                playlists={homePlaylists}
                onPlaylistPress={(playlist) =>
                  guard(() =>
                    push({
                      pathname: '/playlists/[id]',
                      params: { id: playlist.id, from: 'home' },
                    } as Href),
                  )
                }
              />
            ) : (
              <HomeSectionStatus
                isLoading={playlistsQuery.isLoading}
                isError={playlistsQuery.isError}
                skeleton="playlists"
                onRetry={() => void playlistsQuery.refetch()}
                errorLabel={getHomeSectionErrorLabel(
                  playlistsQuery.error,
                  'You’re offline. Check your connection and retry.',
                  'Couldn’t load your playlists.',
                )}
              />
            )}

            <ChallengeCard />

            {recentlyPlayed.length > 0 ? (
              <RecentlyPlayedSection
                tracks={recentlyPlayed}
                onTrackPress={(track) =>
                  playSectionQueue(track, recentlyPlayed)
                }
              />
            ) : (
              <HomeSectionStatus
                isLoading={recentlyPlayedQuery.isLoading}
                isError={recentlyPlayedQuery.isError}
                skeleton="recently"
                onRetry={() => void recentlyPlayedQuery.refetch()}
                errorLabel={getHomeSectionErrorLabel(
                  recentlyPlayedQuery.error,
                  'You’re offline. Check your connection and retry.',
                  'Couldn’t load recently played.',
                )}
              />
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

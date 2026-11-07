import { useMemo } from 'react';

import { SKIP_AUTH } from '@/features/auth/store/auth.store';
import { useAlbums } from '@/features/albums';
import { usePlaylists } from '@/features/playlists';
import { usePublishedTracksByUser } from '@/features/tracks';

import { useMe } from '../api/hooks';
import { getMyProfileFixture } from '../data/profile.fixtures';
import type { Profile } from '../types';
import {
  mapAlbumSummaryToProfileAlbum,
  mapPlaylistSummaryToProfilePlaylist,
  mapPublishedTrackToProfileTrack,
  mapPublishedTracksToFeaturedSong,
} from '../utils/map-catalog-to-profile';
import { mapMeToProfile } from '../utils/map-me-to-profile';

export type MyProfileState = {
  profile: Profile | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
};

/**
 * Logged-in profile for the Profile tab — GET /api/user + published catalog.
 * Skip-auth uses the local fixture so Library / Projects stay reachable without a JWT.
 */
export function useMyProfile(): MyProfileState {
  const query = useMe();
  const userId = query.data?.id;
  const tracksQuery = usePublishedTracksByUser(
    SKIP_AUTH ? undefined : userId,
  );
  const playlistsQuery = usePlaylists();
  const albumsQuery = useAlbums();

  const profile = useMemo(() => {
    if (SKIP_AUTH) return getMyProfileFixture();
    if (!query.data) return null;

    const base = mapMeToProfile(query.data);
    const tracks = tracksQuery.data ?? [];
    const publicPlaylists = (playlistsQuery.data ?? []).filter(
      (item) => item.visibility === 'PUBLIC',
    );
    const releasedAlbums = (albumsQuery.data ?? []).filter(
      (item) => item.status === 'RELEASED',
    );

    return {
      ...base,
      featuredSong: mapPublishedTracksToFeaturedSong(
        tracks,
        base.name,
        base.coverUrl ?? base.avatarUrl ?? '',
      ),
      songs: tracks.map(mapPublishedTrackToProfileTrack),
      playlists: publicPlaylists.map(mapPlaylistSummaryToProfilePlaylist),
      albums: releasedAlbums.map(mapAlbumSummaryToProfileAlbum),
    };
  }, [
    albumsQuery.data,
    playlistsQuery.data,
    query.data,
    tracksQuery.data,
  ]);

  if (SKIP_AUTH) {
    return {
      profile: getMyProfileFixture(),
      isLoading: false,
      isError: false,
      error: null,
      refetch: () => undefined,
    };
  }

  const isLoading =
    query.isLoading ||
    (!!userId &&
      (tracksQuery.isLoading ||
        playlistsQuery.isLoading ||
        albumsQuery.isLoading));

  return {
    profile,
    isLoading: isLoading && !profile,
    isError: query.isError,
    error: query.error,
    refetch: () => {
      void query.refetch();
      void tracksQuery.refetch();
      void playlistsQuery.refetch();
      void albumsQuery.refetch();
    },
  };
}

import { useMemo } from 'react';

import { usePublicAlbumsByUser } from '@/features/albums';
import { usePublicPlaylistsByUser } from '@/features/playlists';
import { usePublishedTracksByUser } from '@/features/tracks';
import {
  usePublicUserProfile,
  type PublicUserProfile,
} from '@/features/users';

import { findProfileFixture } from '../data/profile.fixtures';
import type { Profile } from '../types';
import {
  mapAlbumSummaryToProfileAlbum,
  mapPlaylistSummaryToProfilePlaylist,
  mapPublishedTrackToProfileTrack,
  mapPublishedTracksToFeaturedSong,
} from '../utils/map-catalog-to-profile';
import { mapPublicProfileToProfile } from '../utils/map-public-profile';

export type PublicProfileState = {
  profile: Profile | null;
  apiProfile: PublicUserProfile | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
};

function fixtureAsApiProfile(profile: Profile): PublicUserProfile {
  return {
    id: profile.id,
    username: profile.username.replace(/^@/, ''),
    name: profile.name,
    bio: profile.bio || null,
    avatarUrl: profile.avatarUrl,
    coverUrl: profile.coverUrl,
    followerCount: 0,
    followingCount: 0,
    isFollowing: false,
    isFollowedBy: false,
    isMutual: false,
    // Demo fixture artists — hide Follow/Message until backed by API.
    isSelf: true,
  };
}

/**
 * Public profile by id (Home/Explore → /artist/:id).
 * Live GET /api/users/:id + published catalog, with fixtures for demo artists.
 */
export function usePublicProfile(id: string | undefined): PublicProfileState {
  const query = usePublicUserProfile(id);
  const fixture = findProfileFixture(id);
  const tracksQuery = usePublishedTracksByUser(query.data ? id : undefined);
  const playlistsQuery = usePublicPlaylistsByUser(query.data ? id : undefined);
  const albumsQuery = usePublicAlbumsByUser(query.data ? id : undefined);

  const profile = useMemo(() => {
    if (query.data) {
      const base = mapPublicProfileToProfile(query.data);
      const tracks = tracksQuery.data ?? [];
      return {
        ...base,
        featuredSong: mapPublishedTracksToFeaturedSong(
          tracks,
          base.name,
          base.coverUrl ?? base.avatarUrl ?? '',
        ),
        songs: tracks.map(mapPublishedTrackToProfileTrack),
        playlists: (playlistsQuery.data ?? []).map(
          mapPlaylistSummaryToProfilePlaylist,
        ),
        albums: (albumsQuery.data ?? []).map(mapAlbumSummaryToProfileAlbum),
      };
    }

    if (fixture && (query.isError || (!query.isLoading && !query.data))) {
      return fixture;
    }

    return null;
  }, [
    albumsQuery.data,
    fixture,
    playlistsQuery.data,
    query.data,
    query.isError,
    query.isLoading,
    tracksQuery.data,
  ]);

  const apiProfile = query.data
    ? query.data
    : profile && fixture
      ? fixtureAsApiProfile(profile)
      : undefined;

  return {
    profile,
    apiProfile,
    isLoading:
      query.isLoading ||
      (!!query.data &&
        (tracksQuery.isLoading ||
          playlistsQuery.isLoading ||
          albumsQuery.isLoading)),
    isError: query.isError && !fixture,
    error: query.error,
    refetch: () => {
      void query.refetch();
      void tracksQuery.refetch();
      void playlistsQuery.refetch();
      void albumsQuery.refetch();
    },
  };
}

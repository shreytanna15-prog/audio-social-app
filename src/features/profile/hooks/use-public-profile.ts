import {
  usePublicUserProfile,
  type PublicUserProfile,
} from '@/features/users';

import { findProfileFixture } from '../data/profile.fixtures';
import type { Profile } from '../types';
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
 * Live GET /api/users/:id, with local fixtures for featured/demo artists.
 */
export function usePublicProfile(id: string | undefined): PublicProfileState {
  const query = usePublicUserProfile(id);
  const fixture = findProfileFixture(id);

  if (query.data) {
    return {
      profile: mapPublicProfileToProfile(query.data),
      apiProfile: query.data,
      isLoading: false,
      isError: false,
      error: null,
      refetch: () => {
        void query.refetch();
      },
    };
  }

  if (fixture && (query.isError || (!query.isLoading && !query.data))) {
    return {
      profile: fixture,
      apiProfile: fixtureAsApiProfile(fixture),
      isLoading: false,
      isError: false,
      error: null,
      refetch: () => {
        void query.refetch();
      },
    };
  }

  return {
    profile: null,
    apiProfile: undefined,
    isLoading: query.isLoading,
    isError: query.isError && !fixture,
    error: query.error,
    refetch: () => {
      void query.refetch();
    },
  };
}

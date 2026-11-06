import { SKIP_AUTH } from '@/features/auth/store/auth.store';

import { useMe } from '../api/hooks';
import { getMyProfileFixture } from '../data/profile.fixtures';
import type { Profile } from '../types';
import { mapMeToProfile } from '../utils/map-me-to-profile';

export type MyProfileState = {
  profile: Profile | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
};

/**
 * Logged-in profile for the Profile tab — GET /api/user.
 * Skip-auth uses the local fixture so Library / Projects stay reachable without a JWT.
 */
export function useMyProfile(): MyProfileState {
  const query = useMe();

  if (SKIP_AUTH) {
    return {
      profile: getMyProfileFixture(),
      isLoading: false,
      isError: false,
      error: null,
      refetch: () => undefined,
    };
  }

  return {
    profile: query.data ? mapMeToProfile(query.data) : null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: () => {
      void query.refetch();
    },
  };
}

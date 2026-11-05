import { useMe } from '../api/hooks';
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
 */
export function useMyProfile(): MyProfileState {
  const query = useMe();

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

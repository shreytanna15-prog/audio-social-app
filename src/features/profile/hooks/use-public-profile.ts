import {
  usePublicUserProfile,
  type PublicUserProfile,
} from '@/features/users';

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

/**
 * Public profile by id (Home/Explore → /artist/:id).
 * Loads live data from GET /api/users/:id.
 */
export function usePublicProfile(id: string | undefined): PublicProfileState {
  const query = usePublicUserProfile(id);

  return {
    profile: query.data ? mapPublicProfileToProfile(query.data) : null,
    apiProfile: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: () => {
      void query.refetch();
    },
  };
}

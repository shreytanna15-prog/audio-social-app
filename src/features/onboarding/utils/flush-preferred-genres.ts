import { queryClient } from '@/core/api';
import { MADE_FOR_YOU_QUERY_KEY } from '@/features/discover';
import { ME_QUERY_KEY } from '@/features/profile/api/hooks';
import { patchMe } from '@/features/profile/api/service';

import { useOnboardingTasteStore } from '../store/onboarding-taste.store';

let flushInFlight: Promise<void> | null = null;

/** PATCH preferredGenres after auth when onboarding left a non-empty draft. */
export async function flushPreferredGenresDraft(): Promise<void> {
  if (flushInFlight) {
    return flushInFlight;
  }

  const { preferredGenres, clearPreferredGenres } =
    useOnboardingTasteStore.getState();

  if (preferredGenres.length === 0) {
    return;
  }

  flushInFlight = (async () => {
    try {
      const me = await patchMe({ preferredGenres });
      clearPreferredGenres();
      queryClient.setQueryData(ME_QUERY_KEY, me);
      void queryClient.invalidateQueries({ queryKey: MADE_FOR_YOU_QUERY_KEY });
    } finally {
      flushInFlight = null;
    }
  })();

  return flushInFlight;
}

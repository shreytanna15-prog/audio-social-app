import { useEffect, useRef } from 'react';

import { useAuthStore } from '@/features/auth/store/auth.store';

import { useOnboardingTasteStore } from '../store/onboarding-taste.store';
import { flushPreferredGenresDraft } from '../utils/flush-preferred-genres';

/** Retries draft flush when authenticated (covers login/signup + failed first attempt). */
export function useFlushPreferredGenres() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const preferredGenres = useOnboardingTasteStore((s) => s.preferredGenres);
  const attemptedKey = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || preferredGenres.length === 0) {
      return;
    }

    const key = preferredGenres.join(',');
    if (attemptedKey.current === key) {
      return;
    }
    attemptedKey.current = key;

    void flushPreferredGenresDraft().catch(() => {
      attemptedKey.current = null;
    });
  }, [isAuthenticated, preferredGenres]);
}

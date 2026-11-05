import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { usePlayerStore } from '@/features/player/store/player.store';

/**
 * Pause the global mini-player when a create/studio surface is focused.
 * Keeps `track` so Home/Feed still show the mini player when the user returns.
 */
export function usePauseGlobalPlayerOnFocus() {
  useFocusEffect(
    useCallback(() => {
      usePlayerStore.getState().pause();
    }, []),
  );
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

import type { TrackGenreId } from '@/features/tracks/constants/track-genres';

import { MAX_PREFERRED_GENRES } from '../data/genres';

type OnboardingTasteState = {
  preferredGenres: TrackGenreId[];
  setPreferredGenres: (ids: TrackGenreId[]) => void;
  clearPreferredGenres: () => void;
};

const ssrSafeStorage: StateStorage = {
  getItem: async (name) => {
    if (typeof window === 'undefined') {
      return null;
    }
    return AsyncStorage.getItem(name);
  },
  setItem: async (name, value) => {
    if (typeof window === 'undefined') {
      return;
    }
    await AsyncStorage.setItem(name, value);
  },
  removeItem: async (name) => {
    if (typeof window === 'undefined') {
      return;
    }
    await AsyncStorage.removeItem(name);
  },
};

export const useOnboardingTasteStore = create<OnboardingTasteState>()(
  persist(
    (set) => ({
      preferredGenres: [],
      setPreferredGenres: (ids) =>
        set({
          preferredGenres: [...new Set(ids)].slice(0, MAX_PREFERRED_GENRES),
        }),
      clearPreferredGenres: () => set({ preferredGenres: [] }),
    }),
    {
      name: 'vibeogram.onboarding-taste',
      storage: createJSONStorage(() => ssrSafeStorage),
      partialize: (state) => ({ preferredGenres: state.preferredGenres }),
    },
  ),
);

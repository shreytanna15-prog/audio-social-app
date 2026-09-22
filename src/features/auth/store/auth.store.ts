import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

import { clearTokens, hasStoredSession, onAuthInvalidated } from '@/core/api';

type AuthState = {
  isHydrated: boolean;
  hasCompletedOnboarding: boolean;
  isAuthenticated: boolean;
  setHydrated: (value: boolean) => void;
  completeOnboarding: () => void;
  setAuthenticated: (value: boolean) => void;
  logout: () => Promise<void>;
  hydrateSession: () => Promise<void>;
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

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isHydrated: false,
      hasCompletedOnboarding: false,
      isAuthenticated: false,

      setHydrated: (value) => set({ isHydrated: value }),

      completeOnboarding: () => set({ hasCompletedOnboarding: true }),

      setAuthenticated: (value) => set({ isAuthenticated: value }),

      logout: async () => {
        await clearTokens();
        set({ isAuthenticated: false });
      },

      hydrateSession: async () => {
        const hasSession = await hasStoredSession();
        set({ isAuthenticated: hasSession });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => ssrSafeStorage),
      partialize: (state) => ({
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.log('Auth store rehydration failed:', error);
        }

        void (async () => {
          try {
            await useAuthStore.getState().hydrateSession();
          } finally {
            useAuthStore.getState().setHydrated(true);
          }
        })();
      },
    },
  ),
);

onAuthInvalidated(() => {
  void useAuthStore.getState().logout();
});

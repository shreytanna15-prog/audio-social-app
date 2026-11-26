import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

import { clearTokens, hasStoredSession, onAuthInvalidated } from '@/core/api';
import { useOnboardingTasteStore } from '@/features/onboarding/store/onboarding-taste.store';

import { resetClientSession } from '../utils/reset-client-session';

export const SKIP_AUTH = process.env.EXPO_PUBLIC_SKIP_AUTH === 'true';

export type SignupDraft = {
  name?: string;
  username?: string;
  email?: string;
};

type AuthState = {
  isHydrated: boolean;
  hasCompletedOnboarding: boolean;
  isAuthenticated: boolean;
  signupDraft: SignupDraft;
  setHydrated: (value: boolean) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  setAuthenticated: (value: boolean) => void;
  setSignupDraft: (draft: Partial<SignupDraft>) => void;
  clearSignupDraft: () => void;
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
      hasCompletedOnboarding: SKIP_AUTH,
      isAuthenticated: SKIP_AUTH,
      signupDraft: {},

      setHydrated: (value) => set({ isHydrated: value }),

      completeOnboarding: () => set({ hasCompletedOnboarding: true }),

      resetOnboarding: () => {
        if (SKIP_AUTH) return;
        set({ hasCompletedOnboarding: false });
      },

      setAuthenticated: (value) => set({ isAuthenticated: value }),

      setSignupDraft: (draft) =>
        set((state) => ({
          signupDraft: { ...state.signupDraft, ...draft },
        })),

      clearSignupDraft: () => set({ signupDraft: {} }),

      logout: async () => {
        if (SKIP_AUTH) return;
        await clearTokens();
        resetClientSession();
        useOnboardingTasteStore.getState().clearPreferredGenres();
        set({ isAuthenticated: false, signupDraft: {} });
      },

      hydrateSession: async () => {
        if (SKIP_AUTH) {
          set({ isAuthenticated: true, hasCompletedOnboarding: true });
          return;
        }
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
  if (SKIP_AUTH) return;
  void useAuthStore.getState().logout();
});

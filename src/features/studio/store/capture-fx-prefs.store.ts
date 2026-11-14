import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

import {
  fromStoredEditChain,
  toStoredEditChain,
} from '@/features/audio/domain/edit-chain-persistence';
import {
  EMPTY_EDIT_CHAIN,
  type EditChainSelection,
  type StoredEditChain,
} from '@/features/audio/types/edit-chips';

type CaptureFxPrefsState = {
  stored: StoredEditChain | null;
  setSelection: (selection: EditChainSelection) => void;
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

export const useCaptureFxPrefsStore = create<CaptureFxPrefsState>()(
  persist(
    (set) => ({
      stored: null,
      setSelection: (selection) =>
        set({ stored: toStoredEditChain(selection) }),
    }),
    {
      name: 'vibeogram.capture-fx-prefs',
      storage: createJSONStorage(() => ssrSafeStorage),
      partialize: (state) => ({ stored: state.stored }),
    },
  ),
);

export function rememberCaptureFxSelection(selection: EditChainSelection): void {
  useCaptureFxPrefsStore.getState().setSelection(selection);
}

export function readCaptureFxPrefs(): EditChainSelection {
  const stored = useCaptureFxPrefsStore.getState().stored;
  if (!stored) {
    return EMPTY_EDIT_CHAIN;
  }
  return fromStoredEditChain(stored);
}

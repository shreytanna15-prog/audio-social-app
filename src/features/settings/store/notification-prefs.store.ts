import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

export type NotificationPrefs = {
  masterPush: boolean;
  likes: boolean;
  comments: boolean;
  follows: boolean;
  messages: boolean;
};

type NotificationPrefsState = NotificationPrefs & {
  setMasterPush: (value: boolean) => void;
  setLikes: (value: boolean) => void;
  setComments: (value: boolean) => void;
  setFollows: (value: boolean) => void;
  setMessages: (value: boolean) => void;
};

const DEFAULTS: NotificationPrefs = {
  masterPush: true,
  likes: true,
  comments: true,
  follows: true,
  messages: true,
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

export const useNotificationPrefsStore = create<NotificationPrefsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setMasterPush: (masterPush) => set({ masterPush }),
      setLikes: (likes) => set({ likes }),
      setComments: (comments) => set({ comments }),
      setFollows: (follows) => set({ follows }),
      setMessages: (messages) => set({ messages }),
    }),
    {
      name: 'vibeogram.notification-prefs',
      storage: createJSONStorage(() => ssrSafeStorage),
      partialize: (state) => ({
        masterPush: state.masterPush,
        likes: state.likes,
        comments: state.comments,
        follows: state.follows,
        messages: state.messages,
      }),
    },
  ),
);

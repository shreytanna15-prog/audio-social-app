import { create } from 'zustand';

type MessageUiState = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
};

/** Ephemeral UI state only — server data lives in React Query. */
export const useMessageStore = create<MessageUiState>((set) => ({
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
}));

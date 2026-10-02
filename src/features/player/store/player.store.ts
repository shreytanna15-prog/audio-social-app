import { create } from 'zustand';

import type { PlayerTrack } from '../types';

type PlayerState = {
  track: PlayerTrack | null;
  isPlaying: boolean;
  progress: number;
  isLiked: boolean;
  isLooping: boolean;
  play: (track: PlayerTrack) => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  toggleLike: () => void;
  toggleLoop: () => void;
  setProgress: (progress: number) => void;
  clear: () => void;
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
  track: null,
  isPlaying: false,
  progress: 0.2,
  isLiked: false,
  isLooping: false,

  play: (track) => {
    const current = get().track;
    if (current?.id === track.id) {
      set({ isPlaying: true });
      return;
    }
    set({
      track,
      isPlaying: true,
      progress: 0.15,
      isLiked: false,
    });
  },

  togglePlay: () => {
    if (!get().track) return;
    set((state) => ({ isPlaying: !state.isPlaying }));
  },

  next: () => {
    // UI stub — real queue later
    set({ progress: 0.1, isPlaying: true });
  },

  previous: () => {
    // UI stub — real queue later
    set({ progress: 0, isPlaying: true });
  },

  toggleLike: () => {
    if (!get().track) return;
    set((state) => ({ isLiked: !state.isLiked }));
  },

  toggleLoop: () => {
    set((state) => ({ isLooping: !state.isLooping }));
  },

  setProgress: (progress) => {
    set({ progress: Math.min(1, Math.max(0, progress)) });
  },

  clear: () => {
    set({
      track: null,
      isPlaying: false,
      progress: 0,
      isLiked: false,
      isLooping: false,
    });
  },
}));

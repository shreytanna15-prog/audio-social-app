import { create } from 'zustand';

import { queryClient } from '@/core/api/query-client';
import {
  LIKED_TRACKS_QUERY_KEY,
  LIKES_QUERY_KEY,
} from '@/features/saves/api/hooks';
import { likeTrack, unlikeTrack } from '@/features/saves/api/service';
import type { LikedTrackItemDto } from '@/features/saves/api/types';
import { isApiTrackId } from '@/features/saves/utils/is-api-track-id';
import { recordPlay } from '@/features/tracks/api/service';

import type { PlayerTrack } from '../types';

const playedThisSession = new Set<string>();

function isTrackLikedInCache(trackId: string): boolean {
  if (!isApiTrackId(trackId)) return false;
  const liked = queryClient.getQueryData<LikedTrackItemDto[]>(
    LIKED_TRACKS_QUERY_KEY,
  );
  return liked?.some((item) => item.track?.id === trackId) ?? false;
}

type PlayerState = {
  track: PlayerTrack | null;
  isPlaying: boolean;
  progress: number;
  isLiked: boolean;
  isLooping: boolean;
  play: (track: PlayerTrack) => void;
  pause: () => void;
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
      isLiked: isTrackLikedInCache(track.id),
    });
    if (isApiTrackId(track.id) && !playedThisSession.has(track.id)) {
      playedThisSession.add(track.id);
      void recordPlay(track.id).catch(() => {
        playedThisSession.delete(track.id);
      });
    }
  },

  /** Stop playback but keep the current track (mini player stays). */
  pause: () => {
    if (!get().isPlaying) return;
    set({ isPlaying: false });
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
    const { track, isLiked } = get();
    // Fixture / demo ids are not likeable — avoid a fake heart that never hits Saved.
    if (!track || !isApiTrackId(track.id)) return;

    const nextLiked = !isLiked;
    set({ isLiked: nextLiked });

    const request = nextLiked ? likeTrack : unlikeTrack;
    void request(track.id)
      .then(() => queryClient.invalidateQueries({ queryKey: LIKES_QUERY_KEY }))
      .catch(() => {
        if (get().track?.id === track.id) {
          set({ isLiked: !nextLiked });
        }
      });
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

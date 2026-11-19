import { create } from 'zustand';

import { queryClient } from '@/core/api/query-client';
import { RECENTLY_PLAYED_QUERY_KEY } from '@/features/home/api/hooks';
import {
  LIKED_TRACKS_QUERY_KEY,
  LIKES_QUERY_KEY,
} from '@/features/saves/api/hooks';
import { likeTrack, unlikeTrack } from '@/features/saves/api/service';
import type { LikedTrackItemDto } from '@/features/saves/api/types';
import { isApiTrackId } from '@/features/saves/utils/is-api-track-id';
import { recordPlay } from '@/features/tracks/api/service';

import {
  listenLoadAndPlay,
  listenPause,
  listenResume,
  listenSeekRatio,
  listenSetLoop,
  listenStop,
  setListenAudioCallbacks,
} from '../services/listen-audio-controller';
import {
  trackHasMixUrl,
  type PlayerTrack,
  type PlayTrackOptions,
} from '../types';

function listenMetadata(track: PlayerTrack) {
  return {
    title: track.title,
    artist: track.artist,
    artworkUrl: track.coverUrl,
  };
}

const playedThisSession = new Set<string>();
const PREV_RESTART_PROGRESS = 0.04;

function isTrackLikedInCache(trackId: string): boolean {
  if (!isApiTrackId(trackId)) return false;
  const liked = queryClient.getQueryData<LikedTrackItemDto[]>(
    LIKED_TRACKS_QUERY_KEY,
  );
  return liked?.some((item) => item.track?.id === trackId) ?? false;
}

function resolveQueue(
  track: PlayerTrack,
  options?: PlayTrackOptions,
): { queue: PlayerTrack[]; index: number } {
  const incoming = options?.queue?.filter(Boolean) ?? [];
  if (incoming.length === 0) {
    return { queue: [track], index: 0 };
  }
  const index = incoming.findIndex((item) => item.id === track.id);
  if (index < 0) {
    return { queue: [track, ...incoming], index: 0 };
  }
  return { queue: incoming, index };
}

function findPlayableIndex(
  queue: PlayerTrack[],
  fromIndex: number,
  direction: 1 | -1,
): number | null {
  if (queue.length === 0) return null;
  for (let step = 1; step <= queue.length; step += 1) {
    const index = (fromIndex + direction * step + queue.length * step) % queue.length;
    if (trackHasMixUrl(queue[index])) return index;
  }
  return null;
}

type PlayerState = {
  track: PlayerTrack | null;
  queue: PlayerTrack[];
  queueIndex: number;
  isPlaying: boolean;
  progress: number;
  isLiked: boolean;
  isLooping: boolean;
  /** True when current track has no streamable mix. */
  isUnavailable: boolean;
  play: (track: PlayerTrack, options?: PlayTrackOptions) => boolean;
  playQueue: (tracks: PlayerTrack[], startIndex?: number) => boolean;
  pause: () => void;
  togglePlay: () => void;
  next: (options?: { fromEnded?: boolean }) => void;
  previous: () => void;
  toggleLike: () => void;
  toggleLoop: () => void;
  setProgress: (progress: number) => void;
  clear: () => void;
};

function applyTrack(
  set: (partial: Partial<PlayerState>) => void,
  track: PlayerTrack,
  queue: PlayerTrack[],
  queueIndex: number,
): boolean {
  const hasAudio = trackHasMixUrl(track);
  set({
    track,
    queue,
    queueIndex,
    isPlaying: hasAudio,
    progress: 0,
    isLiked: track.isLiked ?? isTrackLikedInCache(track.id),
    isUnavailable: !hasAudio,
  });

  if (!hasAudio) {
    listenStop();
    return false;
  }

  void listenLoadAndPlay(
    track.mixUrl!.trim(),
    usePlayerStore.getState().isLooping,
    listenMetadata(track),
  );

  if (isApiTrackId(track.id) && !playedThisSession.has(track.id)) {
    playedThisSession.add(track.id);
    void recordPlay(track.id)
      .then(() => {
        void queryClient.invalidateQueries({
          queryKey: RECENTLY_PLAYED_QUERY_KEY,
        });
      })
      .catch(() => {
        playedThisSession.delete(track.id);
      });
  }

  return true;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  track: null,
  queue: [],
  queueIndex: 0,
  isPlaying: false,
  progress: 0,
  isLiked: false,
  isLooping: false,
  isUnavailable: false,

  play: (track, options) => {
    const current = get().track;
    if (current?.id === track.id) {
      if (!trackHasMixUrl(current) && !trackHasMixUrl(track)) {
        set({ isUnavailable: true, isPlaying: false });
        return false;
      }
      if (get().isPlaying) return true;
      const loop = get().isLooping;
      listenResume(loop);
      set({ isPlaying: true, isUnavailable: false });
      return true;
    }

    const { queue, index } = resolveQueue(track, options);
    return applyTrack(set, track, queue, index);
  },

  playQueue: (tracks, startIndex = 0) => {
    if (tracks.length === 0) return false;
    const safeIndex = Math.min(Math.max(0, startIndex), tracks.length - 1);
    const start = tracks[safeIndex];
    if (trackHasMixUrl(start)) {
      return applyTrack(set, start, tracks, safeIndex);
    }
    const nextPlayable = findPlayableIndex(tracks, safeIndex - 1, 1);
    if (nextPlayable == null) {
      return applyTrack(set, start, tracks, safeIndex);
    }
    return applyTrack(set, tracks[nextPlayable], tracks, nextPlayable);
  },

  pause: () => {
    if (!get().isPlaying) return;
    listenPause();
    set({ isPlaying: false });
  },

  togglePlay: () => {
    const { track, isPlaying, isLooping } = get();
    if (!track) return;
    if (!trackHasMixUrl(track)) {
      set({ isUnavailable: true, isPlaying: false });
      return;
    }
    if (isPlaying) {
      listenPause();
      set({ isPlaying: false });
      return;
    }
    listenResume(isLooping);
    set({ isPlaying: true, isUnavailable: false });
  },

  next: (options) => {
    const { queue, queueIndex, isLooping, track, progress } = get();
    const fromEnded = options?.fromEnded === true;

    if (isLooping && fromEnded && track && trackHasMixUrl(track)) {
      void listenLoadAndPlay(track.mixUrl!.trim(), true, listenMetadata(track));
      set({ progress: 0, isPlaying: true, isUnavailable: false });
      return;
    }

    if (queue.length === 0) {
      if (fromEnded) {
        listenPause();
        set({ isPlaying: false, progress: 1 });
      }
      return;
    }

    const nextIndex = findPlayableIndex(queue, queueIndex, 1);
    if (nextIndex == null) {
      if (fromEnded) {
        listenPause();
        set({ isPlaying: false, progress: Math.min(1, progress) });
      }
      return;
    }

    // Single-track queue: restart when skip/next with audio available.
    if (queue.length === 1 && nextIndex === queueIndex) {
      const only = queue[0];
      if (trackHasMixUrl(only)) {
        void listenLoadAndPlay(
          only.mixUrl!.trim(),
          isLooping,
          listenMetadata(only),
        );
        set({ progress: 0, isPlaying: true, isUnavailable: false });
      }
      return;
    }

    applyTrack(set, queue[nextIndex], queue, nextIndex);
  },

  previous: () => {
    const { queue, queueIndex, progress, track, isLooping } = get();

    if (progress > PREV_RESTART_PROGRESS && track && trackHasMixUrl(track)) {
      listenSeekRatio(0, track.durationSec ?? 0);
      set({ progress: 0 });
      if (!get().isPlaying) {
        listenResume(isLooping);
        set({ isPlaying: true });
      }
      return;
    }

    if (queue.length === 0) return;

    const prevIndex = findPlayableIndex(queue, queueIndex, -1);
    if (prevIndex == null) {
      if (track && trackHasMixUrl(track)) {
        listenSeekRatio(0, track.durationSec ?? 0);
        set({ progress: 0 });
      }
      return;
    }

    applyTrack(set, queue[prevIndex], queue, prevIndex);
  },

  toggleLike: () => {
    const { track, isLiked } = get();
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
    const next = !get().isLooping;
    listenSetLoop(next);
    set({ isLooping: next });
  },

  setProgress: (progress) => {
    const clamped = Math.min(1, Math.max(0, progress));
    const { track } = get();
    listenSeekRatio(clamped, track?.durationSec ?? 0);
    set({ progress: clamped });
  },

  clear: () => {
    listenStop();
    set({
      track: null,
      queue: [],
      queueIndex: 0,
      isPlaying: false,
      progress: 0,
      isLiked: false,
      isLooping: false,
      isUnavailable: false,
    });
  },
}));

setListenAudioCallbacks({
  onStatus: ({ progress, duration }) => {
    const state = usePlayerStore.getState();
    if (!state.track || state.isUnavailable) return;

    const patch: Partial<PlayerState> = { progress };
    if (duration > 0) {
      const durationSec = Math.max(1, Math.round(duration));
      if (state.track.durationSec !== durationSec) {
        patch.track = { ...state.track, durationSec };
      }
    }
    usePlayerStore.setState(patch);
  },
  onEnded: () => {
    usePlayerStore.getState().next({ fromEnded: true });
  },
});

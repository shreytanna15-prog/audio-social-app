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
import {
  getPublicTrack,
  recordPlay,
} from '@/features/tracks/api/service';

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
  type RepeatMode,
} from '../types';

function listenMetadata(track: PlayerTrack) {
  return {
    title: track.title,
    artist: track.artist,
    artworkUrl: track.coverUrl,
  };
}

function formatPlaysLabel(playCount: number): string {
  if (playCount >= 1_000_000) {
    return `${(playCount / 1_000_000).toFixed(1).replace(/\.0$/, '')}M plays`;
  }
  if (playCount >= 1_000) {
    return `${(playCount / 1_000).toFixed(1).replace(/\.0$/, '')}k plays`;
  }
  return `${playCount} plays`;
}

/** Meaningful-play gate: once per track until seek/restart from near 0. */
let playRecordedForCurrentTrack = false;
const PREV_RESTART_PROGRESS = 0.04;
const REPEAT_CYCLE: RepeatMode[] = ['off', 'all', 'one'];

function isLoopOne(mode: RepeatMode): boolean {
  return mode === 'one';
}

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
    const index =
      (fromIndex + direction * step + queue.length * step) % queue.length;
    if (trackHasMixUrl(queue[index])) return index;
  }
  return null;
}

function refreshPublicMetadata(trackId: string) {
  if (!isApiTrackId(trackId)) return;

  void getPublicTrack(trackId)
    .then((detail) => {
      const state = usePlayerStore.getState();
      if (state.track?.id !== trackId) return;

      const artistName =
        detail.artist.name?.trim() || detail.artist.username;
      const nextTrack: PlayerTrack = {
        ...state.track,
        title: detail.title,
        artist: artistName,
        coverUrl: detail.coverUrl ?? state.track.coverUrl,
        mixUrl: detail.mixUrl ?? state.track.mixUrl,
        artistId: detail.artist.id,
        artistAvatarUrl: detail.artist.avatarUrl ?? undefined,
        likeCount: detail.likeCount,
        playCount: detail.playCount,
        playsLabel: formatPlaysLabel(detail.playCount),
        commentCount: detail.commentCount,
        durationSec: detail.durationSec,
        isLiked: detail.isLiked,
        isFollowingArtist: detail.artist.isFollowing,
      };

      usePlayerStore.setState({
        track: nextTrack,
        isLiked: detail.isLiked,
        isUnavailable: !trackHasMixUrl(nextTrack),
      });
    })
    .catch(() => undefined);
}

function maybeRecordMeaningfulPlay(
  trackId: string,
  currentTimeSec: number,
  durationSec: number,
) {
  if (playRecordedForCurrentTrack || !isApiTrackId(trackId)) return;
  if (durationSec <= 0) return;

  const threshold = durationSec >= 30 ? 30 : durationSec * 0.5;
  if (currentTimeSec < threshold) return;

  playRecordedForCurrentTrack = true;
  void recordPlay(trackId)
    .then(() => {
      void queryClient.invalidateQueries({
        queryKey: RECENTLY_PLAYED_QUERY_KEY,
      });
    })
    .catch(() => {
      playRecordedForCurrentTrack = false;
    });
}

type PlayerState = {
  track: PlayerTrack | null;
  queue: PlayerTrack[];
  queueIndex: number;
  isPlaying: boolean;
  progress: number;
  isLiked: boolean;
  repeatMode: RepeatMode;
  /** True when current track has no streamable mix. */
  isUnavailable: boolean;
  play: (track: PlayerTrack, options?: PlayTrackOptions) => boolean;
  playQueue: (tracks: PlayerTrack[], startIndex?: number) => boolean;
  pause: () => void;
  togglePlay: () => void;
  next: (options?: { fromEnded?: boolean }) => void;
  previous: () => void;
  toggleLike: () => void;
  cycleRepeatMode: () => void;
  setProgress: (progress: number) => void;
  clear: () => void;
};

function applyTrack(
  set: (partial: Partial<PlayerState>) => void,
  track: PlayerTrack,
  queue: PlayerTrack[],
  queueIndex: number,
): boolean {
  playRecordedForCurrentTrack = false;
  const hasAudio = trackHasMixUrl(track);
  const repeatMode = usePlayerStore.getState().repeatMode;

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
    refreshPublicMetadata(track.id);
    return false;
  }

  void listenLoadAndPlay(
    track.mixUrl!.trim(),
    isLoopOne(repeatMode),
    listenMetadata(track),
  );
  refreshPublicMetadata(track.id);
  return true;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  track: null,
  queue: [],
  queueIndex: 0,
  isPlaying: false,
  progress: 0,
  isLiked: false,
  repeatMode: 'off',
  isUnavailable: false,

  play: (track, options) => {
    const current = get().track;
    if (current?.id === track.id) {
      if (!trackHasMixUrl(current) && !trackHasMixUrl(track)) {
        set({ isUnavailable: true, isPlaying: false });
        return false;
      }
      if (get().isPlaying) return true;
      listenResume(isLoopOne(get().repeatMode));
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
    const { track, isPlaying, repeatMode } = get();
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
    listenResume(isLoopOne(repeatMode));
    set({ isPlaying: true, isUnavailable: false });
  },

  next: (options) => {
    const { queue, queueIndex, repeatMode, track, progress } = get();
    const fromEnded = options?.fromEnded === true;
    const loopOne = isLoopOne(repeatMode);

    // Native loop handles REPEAT_ONE; if onEnded still fires, restart same track.
    if (loopOne && fromEnded && track && trackHasMixUrl(track)) {
      playRecordedForCurrentTrack = false;
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

    const wouldWrap =
      nextIndex <= queueIndex ||
      (queue.length === 1 && nextIndex === queueIndex);

    if (fromEnded && repeatMode === 'off' && wouldWrap) {
      listenPause();
      set({ isPlaying: false, progress: Math.min(1, progress) });
      return;
    }

    if (queue.length === 1 && nextIndex === queueIndex) {
      const only = queue[0];
      if (!trackHasMixUrl(only)) return;
      playRecordedForCurrentTrack = false;
      void listenLoadAndPlay(
        only.mixUrl!.trim(),
        loopOne,
        listenMetadata(only),
      );
      set({ progress: 0, isPlaying: true, isUnavailable: false });
      return;
    }

    applyTrack(set, queue[nextIndex], queue, nextIndex);
  },

  previous: () => {
    const { queue, queueIndex, progress, track, repeatMode } = get();

    if (progress > PREV_RESTART_PROGRESS && track && trackHasMixUrl(track)) {
      playRecordedForCurrentTrack = false;
      listenSeekRatio(0, track.durationSec ?? 0);
      set({ progress: 0 });
      if (!get().isPlaying) {
        listenResume(isLoopOne(repeatMode));
        set({ isPlaying: true });
      }
      return;
    }

    if (queue.length === 0) return;

    const prevIndex = findPlayableIndex(queue, queueIndex, -1);
    if (prevIndex == null) {
      if (track && trackHasMixUrl(track)) {
        playRecordedForCurrentTrack = false;
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
    const nextCount = Math.max(
      0,
      (track.likeCount ?? 0) + (nextLiked ? 1 : -1),
    );
    set({
      isLiked: nextLiked,
      track: { ...track, isLiked: nextLiked, likeCount: nextCount },
    });

    const request = nextLiked ? likeTrack : unlikeTrack;
    void request(track.id)
      .then(() => queryClient.invalidateQueries({ queryKey: LIKES_QUERY_KEY }))
      .catch(() => {
        if (get().track?.id === track.id) {
          set({
            isLiked: !nextLiked,
            track: {
              ...get().track!,
              isLiked: !nextLiked,
              likeCount: track.likeCount,
            },
          });
        }
      });
  },

  cycleRepeatMode: () => {
    const current = get().repeatMode;
    const index = REPEAT_CYCLE.indexOf(current);
    const next = REPEAT_CYCLE[(index + 1) % REPEAT_CYCLE.length] ?? 'off';
    listenSetLoop(isLoopOne(next));
    set({ repeatMode: next });
  },

  setProgress: (progress) => {
    const clamped = Math.min(1, Math.max(0, progress));
    const { track } = get();
    if (clamped <= PREV_RESTART_PROGRESS) {
      playRecordedForCurrentTrack = false;
    }
    listenSeekRatio(clamped, track?.durationSec ?? 0);
    set({ progress: clamped });
  },

  clear: () => {
    listenStop();
    playRecordedForCurrentTrack = false;
    set({
      track: null,
      queue: [],
      queueIndex: 0,
      isPlaying: false,
      progress: 0,
      isLiked: false,
      repeatMode: 'off',
      isUnavailable: false,
    });
  },
}));

setListenAudioCallbacks({
  onStatus: ({ progress, currentTime, duration }) => {
    const state = usePlayerStore.getState();
    if (!state.track || state.isUnavailable) return;

    const patch: Partial<PlayerState> = { progress };
    let durationSec = state.track.durationSec ?? 0;
    if (duration > 0) {
      durationSec = Math.max(1, Math.round(duration));
      if (state.track.durationSec !== durationSec) {
        patch.track = { ...state.track, durationSec };
      }
    }

    usePlayerStore.setState(patch);
    maybeRecordMeaningfulPlay(state.track.id, currentTime, durationSec);
  },
  onEnded: () => {
    usePlayerStore.getState().next({ fromEnded: true });
  },
});

import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';

export type StudioPlaybackTrack = {
  id: string;
  uri: string;
  offsetSeconds: number;
};

type TrackEntry = {
  uri: string;
  offsetSeconds: number;
  player: AudioPlayer;
};

const TICK_MS = 100;
/** Players never land exactly on their duration, so treat this as "finished". */
const END_EPSILON = 0.2;

function seekAndPlay(player: AudioPlayer, seconds: number): void {
  const target =
    player.duration > 0 ? Math.min(seconds, player.duration) : Math.max(seconds, 0);

  void player
    .seekTo(target)
    .catch(() => undefined)
    .then(() => {
      player.play();
    });
}

function syncEntry(entry: TrackEntry, playhead: number, playing: boolean, forceSeek: boolean): void {
  const local = playhead - entry.offsetSeconds;
  const duration = entry.player.duration || 0;
  const beforeStart = local < -0.02;
  const afterEnd = duration > 0 && local >= duration - END_EPSILON;

  if (beforeStart || afterEnd) {
    if (entry.player.playing) {
      entry.player.pause();
    }

    if (beforeStart && forceSeek) {
      void entry.player.seekTo(0).catch(() => undefined);
    }

    return;
  }

  const target = Math.max(local, 0);

  if (!playing) {
    if (entry.player.playing) {
      entry.player.pause();
    }

    void entry.player.seekTo(target).catch(() => undefined);
    return;
  }

  if (forceSeek || !entry.player.playing) {
    seekAndPlay(entry.player, target);
  }
}

/**
 * Transport for the whole project. Every unmuted stem gets its own player and
 * they are started, seeked and stopped together, so the timeline always plays
 * the layers as a mix instead of whichever layer happens to be selected.
 *
 * Pass `enabled: false` while the mic is open. Each player pushes status events
 * into JS ten times a second, and that competes with the audio callbacks on the
 * same thread — enough that a tap can end up queued behind them.
 */
export function useStudioPlayback(
  tracks: StudioPlaybackTrack[],
  fallbackDurationSeconds = 0,
  enabled = true,
) {
  const entriesRef = useRef(new Map<string, TrackEntry>());
  const positionRef = useRef(0);
  const isPlayingRef = useRef(false);
  const playheadOriginRef = useRef(0);
  const startedAtRef = useRef(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const duration = Math.max(0, fallbackDurationSeconds);
  const durationRef = useRef(duration);
  durationRef.current = duration;

  const tracksRef = useRef(tracks);
  tracksRef.current = tracks;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  // Empty while disabled, so the sync effect below tears every player down.
  const trackKey = enabled
    ? tracks.map((track) => `${track.id}:${track.uri}:${track.offsetSeconds}`).join('|')
    : '';

  const syncAll = useCallback((playhead: number, playing: boolean, forceSeek: boolean) => {
    for (const entry of entriesRef.current.values()) {
      syncEntry(entry, playhead, playing, forceSeek);
    }
  }, []);

  const stop = useCallback(
    (rewind: boolean) => {
      isPlayingRef.current = false;
      setIsPlaying(false);

      for (const { player } of entriesRef.current.values()) {
        player.pause();
      }

      if (!rewind) {
        return;
      }

      positionRef.current = 0;
      playheadOriginRef.current = 0;
      setCurrentTime(0);
      syncAll(0, false, true);
    },
    [syncAll],
  );

  useEffect(() => {
    const entries = entriesRef.current;
    const desired = enabledRef.current ? tracksRef.current : [];
    const wanted = new Set(desired.map((track) => track.id));

    for (const [id, entry] of [...entries.entries()]) {
      if (wanted.has(id)) {
        continue;
      }

      entry.player.pause();
      entry.player.remove();
      entries.delete(id);
    }

    for (const track of desired) {
      const existing = entries.get(track.id);

      if (!existing) {
        const player = createAudioPlayer(track.uri, { updateInterval: TICK_MS });
        const entry = {
          uri: track.uri,
          offsetSeconds: track.offsetSeconds,
          player,
        };
        entries.set(track.id, entry);

        if (isPlayingRef.current) {
          syncEntry(entry, positionRef.current, true, true);
        }
        continue;
      }

      const offsetChanged = existing.offsetSeconds !== track.offsetSeconds;
      existing.offsetSeconds = track.offsetSeconds;

      if (existing.uri !== track.uri) {
        existing.player.replace(track.uri);
        existing.uri = track.uri;
        if (isPlayingRef.current) {
          syncEntry(existing, positionRef.current, true, true);
        }
        continue;
      }

      if (offsetChanged && isPlayingRef.current) {
        syncEntry(existing, positionRef.current, true, true);
      }
    }

    if (entries.size === 0) {
      isPlayingRef.current = false;
      setIsPlaying(false);
      if (enabledRef.current) {
        positionRef.current = 0;
        setCurrentTime(0);
      }
    }
  }, [trackKey]);

  // Wall-clock playhead so delayed clips do not freeze or end the mix early.
  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const interval = setInterval(() => {
      const total = durationRef.current;
      const wall =
        playheadOriginRef.current + (Date.now() - startedAtRef.current) / 1000;
      const playhead = total > 0 ? Math.min(wall, total) : wall;

      positionRef.current = playhead;
      setCurrentTime(playhead);
      syncAll(playhead, true, false);

      if (total > 0 && wall >= total - END_EPSILON) {
        stop(true);
      }
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [isPlaying, stop, syncAll]);

  useEffect(
    () => () => {
      for (const { player } of entriesRef.current.values()) {
        player.pause();
        player.remove();
      }
      entriesRef.current.clear();
    },
    [],
  );

  const pause = useCallback(() => {
    if (!isPlayingRef.current) {
      return;
    }
    stop(false);
  }, [stop]);

  const play = useCallback(() => {
    if (entriesRef.current.size === 0) {
      return;
    }

    const total = durationRef.current;
    const restart = total > 0 && positionRef.current >= total - 0.25;
    const from = restart ? 0 : positionRef.current;

    positionRef.current = from;
    playheadOriginRef.current = from;
    setCurrentTime(from);
    startedAtRef.current = Date.now();
    isPlayingRef.current = true;
    setIsPlaying(true);
    syncAll(from, true, true);
  }, [syncAll]);

  const seekTo = useCallback(
    (seconds: number) => {
      const total = durationRef.current;
      const next = Math.min(Math.max(seconds, 0), total > 0 ? total : Math.max(seconds, 0));

      positionRef.current = next;
      playheadOriginRef.current = next;
      setCurrentTime(next);
      startedAtRef.current = Date.now();
      syncAll(next, isPlayingRef.current, true);
    },
    [syncAll],
  );

  const togglePlayback = useCallback(() => {
    if (isPlayingRef.current) {
      stop(false);
      return;
    }
    play();
  }, [play, stop]);

  return {
    isPlaying,
    currentTime,
    duration,
    hasTracks: tracks.length > 0,
    play,
    pause,
    seekTo,
    togglePlayback,
  };
}

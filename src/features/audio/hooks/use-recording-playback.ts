import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useCallback, useRef } from 'react';

type UseRecordingPlaybackOptions = {
  /** Fallback while the player reports duration 0 (still loading). */
  fallbackDurationSeconds?: number;
};

function clamp(value: number, min: number, max: number): number {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}

export function useRecordingPlayback(
  uri: string,
  options: UseRecordingPlaybackOptions = {},
) {
  const player = useAudioPlayer(uri, { updateInterval: 100 });
  const playerStatus = useAudioPlayerStatus(player);
  const seekAnchorRef = useRef(0);

  const duration = Math.max(
    0,
    playerStatus.duration > 0
      ? playerStatus.duration
      : (options.fallbackDurationSeconds ?? 0),
  );
  const currentTime = clamp(playerStatus.currentTime ?? 0, 0, duration || Number.MAX_SAFE_INTEGER);

  const pause = useCallback(() => {
    player.pause();
  }, [player]);

  const seekTo = useCallback(
    async (seconds: number) => {
      const next = clamp(seconds, 0, duration > 0 ? duration : seconds);
      seekAnchorRef.current = next;
      await player.seekTo(next);
    },
    [duration, player],
  );

  /** Remember where playback stopped so a bounced file can resume there. */
  const markResumeAt = useCallback((seconds: number) => {
    seekAnchorRef.current = Math.max(0, seconds);
  }, []);

  const playFromStart = useCallback(() => {
    seekAnchorRef.current = 0;
    void player.seekTo(0).then(() => {
      player.play();
    });
  }, [player]);

  /** Resume from the last playhead or scrub — not from 0:00. */
  const playFromAnchor = useCallback(() => {
    const anchor = seekAnchorRef.current;
    void player.seekTo(anchor).then(() => {
      player.play();
    });
  }, [player]);

  const seekToAnchor = useCallback(() => {
    void player.seekTo(seekAnchorRef.current);
  }, [player]);

  const togglePlayback = useCallback(() => {
    if (playerStatus.playing) {
      player.pause();
      return;
    }

    const nearEnd = duration > 0 && currentTime >= duration - 0.25;
    if (nearEnd) {
      playFromAnchor();
      return;
    }

    // Resume from current playhead (do not jump to 0).
    player.play();
  }, [currentTime, duration, playFromAnchor, player, playerStatus.playing]);

  return {
    isPlaying: playerStatus.playing,
    currentTime,
    duration,
    seekAnchorSeconds: seekAnchorRef.current,
    pause,
    seekTo,
    markResumeAt,
    playFromStart,
    playFromAnchor,
    seekToAnchor,
    togglePlayback,
  };
}

import {
  setAudioModeAsync,
  setIsAudioActiveAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  type AudioSource,
} from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';

const END_EPSILON = 0.35;
const ADVANCE_SEC = 1.0;

type Options = {
  source: AudioSource;
  vibeId: string;
  enabled: boolean;
  fallbackDurationSec: number;
};

/**
 * Feed preview transport. Keep this lean — complex replace/seek races were
 * preventing autoplay on device.
 */
export function useFeedPreviewPlayback({
  source,
  vibeId,
  enabled,
  fallbackDurationSec,
}: Options) {
  const player = useAudioPlayer(source, {
    updateInterval: 50,
    downloadFirst: true,
  });
  const status = useAudioPlayerStatus(player);

  const [userPaused, setUserPaused] = useState(false);
  const [visitToken, setVisitToken] = useState(0);
  const [completedVisitToken, setCompletedVisitToken] = useState<number | null>(
    null,
  );

  const prevVibeRef = useRef(vibeId);
  const hasAdvancedRef = useRef(false);
  const prevTimeRef = useRef(0);

  // Audio session once
  useEffect(() => {
    void (async () => {
      try {
        await setIsAudioActiveAsync(true);
        await setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: false,
          interruptionMode: 'duckOthers',
        });
      } catch (error) {
        console.warn('[feed-preview] audio mode failed', error);
      }
    })();
  }, []);

  useEffect(() => {
    player.loop = true;
    player.volume = 1;
    player.muted = false;
  }, [player]);

  // Card change → new visit, jump to start
  useEffect(() => {
    if (prevVibeRef.current === vibeId) return;
    prevVibeRef.current = vibeId;
    hasAdvancedRef.current = false;
    prevTimeRef.current = 0;
    setVisitToken((t) => t + 1);
    setCompletedVisitToken(null);
    setUserPaused(false);
    void player.seekTo(0).catch(() => undefined);
  }, [vibeId, player]);

  // Autoplays / pause — same pattern as recording-card (seek then play, no await)
  useEffect(() => {
    if (!enabled || userPaused) {
      player.pause();
      return;
    }

    player.loop = true;
    player.volume = 1;
    player.muted = false;
    player.play();
  }, [enabled, userPaused, vibeId, player, status.isLoaded, status.duration]);

  const pause = useCallback(() => {
    setUserPaused(true);
    player.pause();
  }, [player]);

  const togglePlayPause = useCallback(() => {
    setUserPaused((prev) => {
      const next = !prev;
      if (next) {
        player.pause();
      } else {
        player.loop = true;
        player.volume = 1;
        player.muted = false;
        player.play();
      }
      return next;
    });
  }, [player]);

  useEffect(() => {
    if (!enabled || userPaused) return;

    const duration =
      status.duration > 0 ? status.duration : Math.max(0, fallbackDurationSec);
    const current = status.currentTime ?? 0;
    const prev = prevTimeRef.current;

    if (current > ADVANCE_SEC) {
      hasAdvancedRef.current = true;
    }

    const finishedEvent = status.didJustFinish === true;
    const loopedNearEnd =
      duration > ADVANCE_SEC &&
      hasAdvancedRef.current &&
      prev >= duration - END_EPSILON &&
      current < END_EPSILON;

    if (hasAdvancedRef.current && (finishedEvent || loopedNearEnd)) {
      setCompletedVisitToken(visitToken);
    }

    prevTimeRef.current = current;
  }, [
    enabled,
    userPaused,
    visitToken,
    status.currentTime,
    status.didJustFinish,
    status.duration,
    fallbackDurationSec,
  ]);

  const previewDurationSec =
    status.duration > 0 ? status.duration : Math.max(0, fallbackDurationSec);
  const currentSec = Math.min(
    Math.max(0, status.currentTime ?? 0),
    previewDurationSec || Number.MAX_SAFE_INTEGER,
  );
  const progress =
    previewDurationSec > 0 ? Math.min(1, currentSec / previewDurationSec) : 0;

  return {
    progress,
    currentSec,
    previewDurationSec,
    completedOnce: completedVisitToken === visitToken,
    isPlaying: enabled && !userPaused && status.playing,
    userPaused,
    pause,
    togglePlayPause,
    isLoaded: status.isLoaded,
  };
}

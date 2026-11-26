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
const MAX_LOOPS = 3;

type Options = {
  source: AudioSource;
  vibeId: string;
  enabled: boolean;
  fallbackDurationSec: number;
};

/**
 * Feed preview transport. Autoplay on swipe; loops up to 3 times then
 * pauses for an explicit replay tap. Isolated from the global player.
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
  const [loopCount, setLoopCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [visitToken, setVisitToken] = useState(0);
  const [completedVisitToken, setCompletedVisitToken] = useState<number | null>(
    null,
  );

  const prevVibeRef = useRef(vibeId);
  const hasAdvancedRef = useRef(false);
  const prevTimeRef = useRef(0);
  const loopCountRef = useRef(0);

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
    player.loop = false;
    player.volume = 1;
    player.muted = false;
  }, [player]);

  useEffect(() => {
    if (prevVibeRef.current === vibeId) return;
    prevVibeRef.current = vibeId;
    hasAdvancedRef.current = false;
    prevTimeRef.current = 0;
    loopCountRef.current = 0;
    setLoopCount(0);
    setIsFinished(false);
    setVisitToken((t) => t + 1);
    setCompletedVisitToken(null);
    setUserPaused(false);
    void player.seekTo(0).catch(() => undefined);
  }, [vibeId, player]);

  useEffect(() => {
    if (!enabled || userPaused || isFinished) {
      player.pause();
      return;
    }

    player.loop = false;
    player.volume = 1;
    player.muted = false;
    player.play();
  }, [
    enabled,
    userPaused,
    isFinished,
    vibeId,
    player,
    status.isLoaded,
    status.duration,
  ]);

  const pause = useCallback(() => {
    setUserPaused(true);
    player.pause();
  }, [player]);

  const replay = useCallback(() => {
    loopCountRef.current = 0;
    setLoopCount(0);
    setIsFinished(false);
    setUserPaused(false);
    hasAdvancedRef.current = false;
    prevTimeRef.current = 0;
    void player.seekTo(0).then(() => {
      player.loop = false;
      player.volume = 1;
      player.muted = false;
      player.play();
    });
  }, [player]);

  const togglePlayPause = useCallback(() => {
    if (isFinished) {
      replay();
      return;
    }

    setUserPaused((prev) => {
      const next = !prev;
      if (next) {
        player.pause();
      } else {
        player.loop = false;
        player.volume = 1;
        player.muted = false;
        player.play();
      }
      return next;
    });
  }, [isFinished, player, replay]);

  useEffect(() => {
    if (!enabled || userPaused || isFinished) return;

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
      const nextLoop = loopCountRef.current + 1;
      loopCountRef.current = nextLoop;
      setLoopCount(nextLoop);
      setCompletedVisitToken(visitToken);
      hasAdvancedRef.current = false;
      prevTimeRef.current = 0;

      if (nextLoop >= MAX_LOOPS) {
        setIsFinished(true);
        player.pause();
      } else {
        void player.seekTo(0).then(() => {
          player.play();
        });
      }
      return;
    }

    prevTimeRef.current = current;
  }, [
    enabled,
    userPaused,
    isFinished,
    visitToken,
    status.currentTime,
    status.didJustFinish,
    status.duration,
    fallbackDurationSec,
    player,
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
    isPlaying: enabled && !userPaused && !isFinished && status.playing,
    userPaused,
    isFinished,
    loopCount,
    pause,
    replay,
    togglePlayPause,
    isLoaded: status.isLoaded,
  };
}

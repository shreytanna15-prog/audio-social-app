import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { discardPreviewRecording } from '@/features/audio/data/recording-repository';
import {
  createLayer,
  hasRecordableContent,
  nextLayerName,
  projectDurationSeconds,
  selectedLayer,
} from '@/features/audio/domain/project';
import { useRecordingPlayback } from '@/features/audio/hooks/use-recording-playback';
import { useSoftCleanQueue } from '@/features/audio/hooks/use-soft-clean-queue';
import { useTakeCaptureBridge } from '@/features/audio/hooks/use-take-capture-bridge';
import { attachVocalTake } from '@/features/audio/services/attach-vocal-take.service';
import { recordingSessionService } from '@/features/audio/services/recording-session.service';
import { useAudioSessionStore } from '@/features/audio/store/audio-session.store';
import type { StoredEditChain } from '@/features/audio/types/edit-chips';
import type { AudioProject, ProjectLayer } from '@/features/audio/types/project';
import { afterNextPaint } from '@/features/audio/utils/next-paint';
import {
  fingerprintQuickRecordProject,
  useQuickRecordStore,
} from '@/features/studio/store/quick-record.store';

/** UI cap shown on Quick Record (matches timer display). */
export const QUICK_RECORD_MAX_SECONDS = 180;

type UseQuickRecordSessionOptions = {
  /** When false, ignore capture preview handoffs (stacked under edit). */
  captureEnabled?: boolean;
};

export function useQuickRecordSession(options: UseQuickRecordSessionOptions = {}) {
  const [isFocused, setIsFocused] = useState(true);
  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => setIsFocused(false);
    }, []),
  );
  const captureEnabled = (options.captureEnabled ?? true) && isFocused;
  const { back, canGoBack, replace, push } = useRouter();

  const project = useQuickRecordStore((state) => state.project);
  const initialFingerprint = useQuickRecordStore((state) => state.initialFingerprint);
  const setStoreProject = useQuickRecordStore((state) => state.setProject);
  const resetStore = useQuickRecordStore((state) => state.reset);
  const applyStem = useQuickRecordStore((state) => state.applyStem);

  const status = useAudioSessionStore((state) => state.status);
  const hasActiveSession = useAudioSessionStore((state) => state.hasActiveSession);
  const startRecording = useAudioSessionStore((state) => state.startRecording);
  const handleMainAction = useAudioSessionStore((state) => state.handleMainAction);
  const resetSession = useAudioSessionStore((state) => state.resetSession);

  const capturingLayerIdRef = useRef<string | null>(null);
  const recordOriginSecondsRef = useRef(0);
  /** Scrub/playhead ground truth — player.currentTime can lag right after seek. */
  const playheadSecondsRef = useRef(0);
  const wasPlayingBeforeScrubRef = useRef(false);
  const recordReplaceAllRef = useRef(true);
  const punchEndSecondsRef = useRef<number | null>(null);
  /** Seek only after soft-clean — seeking during URI swap releases the player. */
  const pendingSeekRef = useRef<number | null>(null);
  const wasCleaningRef = useRef(false);
  const projectRef = useRef(project);
  projectRef.current = project; // keep in sync when store updates from edit/FX
  const isLeavingRef = useRef(false);
  const mountedRef = useRef(true);
  const [recordOriginSeconds, setRecordOriginSeconds] = useState(0);
  /** Non-null while the user is dragging the playhead. */
  const [scrubSeconds, setScrubSeconds] = useState<number | null>(null);

  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    [],
  );

  const vocal = selectedLayer(project);
  const isRecording = hasActiveSession;
  const isOptimizing = status === 'optimizing';
  const durationSeconds = projectDurationSeconds(project);
  const stemUri = vocal?.stemUri ?? null;
  const baselineUri = vocal?.baselineUri ?? stemUri;
  const sourceUri = vocal?.sourceUri ?? null;
  const peaks = vocal?.peaks ?? [];
  const editChain = vocal?.editChain;
  const hasTake = Boolean(stemUri);

  const playback = useRecordingPlayback(stemUri ?? '', {
    fallbackDurationSeconds: durationSeconds,
  });

  // Keep playhead ref in sync while idle / playing (not while capturing).
  useEffect(() => {
    if (isRecording) {
      return;
    }
    playheadSecondsRef.current = playback.currentTime;
  }, [isRecording, playback.currentTime]);

  const commitProject = useCallback(
    (nextProject: AudioProject) => {
      projectRef.current = nextProject;
      setStoreProject(nextProject);
    },
    [setStoreProject],
  );

  const getProject = useCallback(() => projectRef.current, []);

  const { cleaningLayerIds, enqueueSoftClean, awaitSoftCleanQueue } = useSoftCleanQueue({
    getProject,
    onProjectChange: commitProject,
  });

  const ensureVocalLayer = useCallback((): ProjectLayer => {
    const current = projectRef.current;
    const selected = selectedLayer(current);
    if (selected?.kind === 'vocal') {
      return selected;
    }

    const layer = createLayer({
      kind: 'vocal',
      name: nextLayerName(current.layers, 'vocal'),
    });
    const nextProject: AudioProject = {
      ...current,
      layers: [layer],
      selectedLayerId: layer.id,
    };
    commitProject(nextProject);
    return layer;
  }, [commitProject]);

  const handleAttachTake = useCallback(
    async (input: {
      layerId: string;
      stemUri: string;
      sourceUri: string | null;
      durationSeconds: number;
    }) => {
      const originSeconds = recordOriginSecondsRef.current;
      const replaceAll = recordReplaceAllRef.current;
      recordReplaceAllRef.current = true;

      const result = await attachVocalTake({
        project: projectRef.current,
        layerId: input.layerId,
        stemUri: input.stemUri,
        sourceUri: input.sourceUri,
        durationSeconds: input.durationSeconds,
        originSeconds,
        replaceAll,
      });

      punchEndSecondsRef.current = replaceAll
        ? result.project.layers.find((layer) => layer.id === input.layerId)
            ?.durationSeconds ?? input.durationSeconds
        : originSeconds + input.durationSeconds;

      if (!mountedRef.current) {
        return result.stemUri;
      }

      commitProject(result.project);
      return result.stemUri;
    },
    [commitProject],
  );

  const handleTakeAttached = useCallback(
    (layerId: string, attachedUri: string) => {
      const seekTo = punchEndSecondsRef.current;
      punchEndSecondsRef.current = null;
      pendingSeekRef.current =
        seekTo != null && Number.isFinite(seekTo) ? Math.max(0, seekTo) : null;
      // Clean the committed source/stem (same URI after attach) — prefer store.
      const layer = projectRef.current.layers.find((item) => item.id === layerId);
      const uriToClean = layer?.sourceUri ?? layer?.stemUri ?? attachedUri;
      enqueueSoftClean(layerId, uriToClean);
    },
    [enqueueSoftClean],
  );

  // Apply deferred seek after SpectralGate swaps the stem URI.
  useEffect(() => {
    const cleaning = cleaningLayerIds.length > 0;
    if (wasCleaningRef.current && !cleaning) {
      const seekTo = pendingSeekRef.current;
      pendingSeekRef.current = null;
      if (seekTo != null) {
        playheadSecondsRef.current = seekTo;
        playback.markResumeAt(seekTo);
        void playback.seekTo(seekTo).catch(() => {
          // Player may still be remounting; ignore one-shot failures.
        });
      }
    }
    wasCleaningRef.current = cleaning;
  }, [cleaningLayerIds.length, playback]);

  useTakeCaptureBridge({
    enabled: captureEnabled,
    capturingLayerIdRef,
    onAttach: handleAttachTake,
    onAttached: handleTakeAttached,
  });

  const isCleaning = cleaningLayerIds.length > 0;
  const isBusy = isOptimizing || isCleaning;

  const startRecord = useCallback(() => {
    if (hasActiveSession || isBusy) {
      return;
    }

    playback.pause();
    const vocalLayer = ensureVocalLayer();
    const existingStem = Boolean(vocalLayer.stemUri);
    const layerDuration = Math.max(0, vocalLayer.durationSeconds || 0);
    // Prefer scrubbed playhead; clamp to take bounds so near-end = extend.
    const playheadSeconds = existingStem
      ? Math.min(layerDuration, Math.max(0, playheadSecondsRef.current))
      : 0;

    recordOriginSecondsRef.current = playheadSeconds;
    setRecordOriginSeconds(playheadSeconds);
    recordReplaceAllRef.current = !existingStem;
    capturingLayerIdRef.current = vocalLayer.id;

    console.warn(
      `[QuickRecord] punch-in origin=${playheadSeconds.toFixed(2)}s replaceAll=${!existingStem} take=${layerDuration.toFixed(2)}s`,
    );

    void (async () => {
      await afterNextPaint();
      void startRecording();
    })();
  }, [
    ensureVocalLayer,
    hasActiveSession,
    isBusy,
    playback,
    startRecording,
  ]);

  const stopRecord = useCallback(() => {
    recordingSessionService.requestStop();
    void handleMainAction();
    setRecordOriginSeconds(0);
  }, [handleMainAction]);

  useEffect(() => {
    if (!isRecording) {
      return;
    }

    const interval = setInterval(() => {
      const seconds = recordingSessionService.getTick().durationMillis / 1000;
      if (seconds >= QUICK_RECORD_MAX_SECONDS) {
        stopRecord();
      }
    }, 200);
    return () => clearInterval(interval);
  }, [isRecording, stopRecord]);

  const toggleRecord = useCallback(() => {
    if (isRecording) {
      stopRecord();
      return;
    }
    startRecord();
  }, [isRecording, startRecord, stopRecord]);

  const onStemChange = useCallback(
    (layerId: string, nextStemUri: string, nextEditChain?: StoredEditChain) => {
      applyStem(layerId, nextStemUri, nextEditChain);
      projectRef.current = useQuickRecordStore.getState().project;
    },
    [applyStem],
  );

  const isDirty =
    fingerprintQuickRecordProject(project) !== initialFingerprint;

  const leaveToAudio = useCallback(() => {
    if (canGoBack()) {
      back();
      return;
    }
    replace('/(tabs)/audio');
  }, [back, canGoBack, replace]);

  const discard = useCallback(async () => {
    await resetSession();
    for (const layer of projectRef.current.layers) {
      await discardPreviewRecording(layer.stemUri ?? '', layer.sourceUri);
    }
    resetStore();
    projectRef.current = useQuickRecordStore.getState().project;
    isLeavingRef.current = true;
    leaveToAudio();
  }, [leaveToAudio, resetSession, resetStore]);

  const requestClose = useCallback(() => {
    if (isRecording || isBusy) {
      return;
    }

    if (isDirty && !isLeavingRef.current) {
      Alert.alert('Discard recording?', 'Your take will be lost.', [
        { text: 'Keep editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => void discard() },
      ]);
      return;
    }

    leaveToAudio();
  }, [discard, isBusy, isDirty, isRecording, leaveToAudio]);

  const goNext = useCallback(async () => {
    if (!hasTake || isRecording || isBusy) {
      return;
    }

    await awaitSoftCleanQueue();
    if (!hasRecordableContent(projectRef.current)) {
      Alert.alert('Nothing to edit', 'Record a take first.');
      return;
    }

    push('/studio/quick-record/edit' as never);
  }, [awaitSoftCleanQueue, hasTake, isBusy, isRecording, push]);

  const togglePlayback = useCallback(() => {
    if (!hasTake || isRecording || isBusy) {
      return;
    }
    playback.togglePlayback();
  }, [hasTake, isBusy, isRecording, playback]);

  const seekTo = useCallback(
    async (seconds: number) => {
      if (isRecording || isBusy) {
        return;
      }
      const next = Math.max(0, seconds);
      playheadSecondsRef.current = next;
      playback.markResumeAt(next);
      try {
        await playback.seekTo(next);
      } catch {
        // Ignore seeks against a player mid-remount.
      }
    },
    [isBusy, isRecording, playback],
  );

  /** Pause audio for the drag; remember whether to resume on release. */
  const beginScrub = useCallback(() => {
    if (isRecording || isBusy || !hasTake) {
      return;
    }
    wasPlayingBeforeScrubRef.current = playback.isPlaying;
    if (playback.isPlaying) {
      playback.pause();
    }
  }, [hasTake, isBusy, isRecording, playback]);

  /** Update playhead UI/ref while dragging — no playback. */
  const scrubTo = useCallback(
    (seconds: number) => {
      if (isRecording || isBusy) {
        return;
      }
      const next = Math.max(0, seconds);
      playheadSecondsRef.current = next;
      playback.markResumeAt(next);
      setScrubSeconds(next);
    },
    [isBusy, isRecording, playback],
  );

  /** Seek to final position; resume only if play was active before the drag. */
  const endScrub = useCallback(
    async (seconds: number) => {
      if (isRecording || isBusy) {
        setScrubSeconds(null);
        return;
      }
      const shouldResume = wasPlayingBeforeScrubRef.current;
      wasPlayingBeforeScrubRef.current = false;
      const next = Math.max(0, seconds);
      playheadSecondsRef.current = next;
      playback.markResumeAt(next);
      setScrubSeconds(null);
      try {
        await playback.seekTo(next);
      } catch {
        // Ignore seeks against a player mid-remount.
      }
      if (shouldResume) {
        playback.playFromAnchor();
      }
    },
    [isBusy, isRecording, playback],
  );

  const displayPlayheadSeconds =
    scrubSeconds != null ? scrubSeconds : playback.currentTime;

  return {
    project,
    vocal,
    layerId: vocal?.id ?? null,
    stemUri,
    baselineUri,
    sourceUri,
    peaks,
    editChain,
    durationSeconds,
    isRecording,
    isOptimizing,
    isCleaning,
    isBusy,
    hasTake,
    isDirty,
    isPlaying: playback.isPlaying,
    isScrubbing: scrubSeconds != null,
    currentTime: displayPlayheadSeconds,
    recordOriginSeconds: isRecording ? recordOriginSeconds : 0,
    playbackDuration: playback.duration,
    maxSeconds: QUICK_RECORD_MAX_SECONDS,
    startRecord,
    stopRecord,
    toggleRecord,
    togglePlayback,
    pausePlayback: playback.pause,
    seekTo,
    beginScrub,
    scrubTo,
    endScrub,
    goNext,
    discard,
    requestClose,
    onStemChange,
    awaitSoftCleanQueue,
    leaveToAudio,
  };
}

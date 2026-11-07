import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { discardPreviewRecording } from '@/features/audio/data/recording-repository';
import { fromStoredEditChain } from '@/features/audio/domain/edit-chain-persistence';
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
import type {
  EditChainSelection,
  StoredEditChain,
} from '@/features/audio/types/edit-chips';
import type { AudioProject, ProjectLayer } from '@/features/audio/types/project';
import { afterNextPaint } from '@/features/audio/utils/next-paint';
import { applyCaptureFx } from '@/features/studio/services/apply-capture-fx.service';
import {
  fingerprintQuickRecordProject,
  normalizeCaptureFxSelection,
  useQuickRecordStore,
} from '@/features/studio/store/quick-record.store';
import { useStudioProjectContextStore } from '@/features/studio/store/studio-project-context.store';
import { leaveStudioSession } from '@/features/studio/utils/leave-studio-session';

/** UI cap shown on Quick Record (matches timer display). */
export const QUICK_RECORD_MAX_SECONDS = 180;

type UseQuickRecordSessionOptions = {
  /** When false, ignore capture preview handoffs (stacked under edit). */
  captureEnabled?: boolean;
};

export function useQuickRecordSession(options: UseQuickRecordSessionOptions = {}) {
  const [isFocused, setIsFocused] = useState(true);
  const captureEnabled = (options.captureEnabled ?? true) && isFocused;
  const { replace, push, dismissTo, back, canGoBack } = useRouter();
  const { projectId: projectIdParam } = useLocalSearchParams<{
    projectId?: string;
  }>();
  const resolvedProjectId = Array.isArray(projectIdParam)
    ? projectIdParam[0]
    : projectIdParam;

  // Keep project handoff if the route param arrives after the Projects push.
  useEffect(() => {
    if (typeof resolvedProjectId === 'string' && resolvedProjectId.length > 0) {
      useStudioProjectContextStore.getState().setProjectId(resolvedProjectId);
    }
  }, [resolvedProjectId]);

  const project = useQuickRecordStore((state) => state.project);
  const title = useQuickRecordStore((state) => state.title);
  const initialFingerprint = useQuickRecordStore((state) => state.initialFingerprint);
  const setStoreProject = useQuickRecordStore((state) => state.setProject);
  const setTitle = useQuickRecordStore((state) => state.setTitle);
  const resetStore = useQuickRecordStore((state) => state.reset);
  const applyStem = useQuickRecordStore((state) => state.applyStem);
  const applyCaptureFxStem = useQuickRecordStore((state) => state.applyCaptureFxStem);
  const setCaptureFxSelectionStore = useQuickRecordStore(
    (state) => state.setCaptureFxSelection,
  );
  const captureFxSelection = useQuickRecordStore((state) => state.captureFxSelection);

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
  /**
   * Covers stop → WAV finalize → attach → soft-clean so the overlay never
   * flickers off between optimizing and SpectralGate.
   */
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isApplyingCaptureFx, setIsApplyingCaptureFx] = useState(false);
  const softCleanEnqueuedRef = useRef(false);
  const pendingCaptureFxApplyRef = useRef(false);
  const captureFxApplyGenRef = useRef(0);

  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    [],
  );

  /** Stop mic + wipe take/progress (no navigation). */
  const abandonInProgressCapture = useCallback(async () => {
    recordingSessionService.requestStop();
    softCleanEnqueuedRef.current = false;
    setIsFinalizing(false);
    await resetSession();
    for (const layer of projectRef.current.layers) {
      await discardPreviewRecording(layer.stemUri ?? '', layer.sourceUri);
    }
    resetStore();
    projectRef.current = useQuickRecordStore.getState().project;
    capturingLayerIdRef.current = null;
    recordOriginSecondsRef.current = 0;
    setRecordOriginSeconds(0);
    playheadSecondsRef.current = 0;
    setScrubSeconds(null);
  }, [resetSession, resetStore]);

  // Leaving the capture screen mid-record must kill the global session.
  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => {
        setIsFocused(false);
        const stillRecording = useAudioSessionStore.getState().hasActiveSession;
        if (stillRecording) {
          void abandonInProgressCapture();
        }
      };
    }, [abandonInProgressCapture]),
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
  const captureFx = vocal?.captureFx;
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
      softCleanEnqueuedRef.current = true;
      enqueueSoftClean(layerId, uriToClean);
    },
    [enqueueSoftClean],
  );

  const handleTakeSettled = useCallback(() => {
    // Attach failed (or no layer) — nothing to soft-clean; drop the overlay.
    if (!softCleanEnqueuedRef.current) {
      setIsFinalizing(false);
    }
  }, []);

  const runCaptureFxApply = useCallback(
    async (layerId: string) => {
      const generation = ++captureFxApplyGenRef.current;
      const layer = projectRef.current.layers.find((item) => item.id === layerId);
      // Prefer post-soft-clean baseline so FX never stack on a prior FX stem.
      const baseUri = layer?.baselineUri ?? layer?.stemUri;
      if (!layer?.stemUri || !baseUri) {
        return;
      }

      setIsApplyingCaptureFx(true);
      try {
        const selection = useQuickRecordStore.getState().captureFxSelection;
        const nextStem = await applyCaptureFx({
          baselineUri: baseUri,
          selection,
        });
        if (!mountedRef.current || captureFxApplyGenRef.current !== generation) {
          return;
        }
        applyCaptureFxStem(layerId, nextStem);
        projectRef.current = useQuickRecordStore.getState().project;
      } catch (error) {
        console.warn('[CaptureFx] apply failed', error);
      } finally {
        if (mountedRef.current && captureFxApplyGenRef.current === generation) {
          setIsApplyingCaptureFx(false);
        }
      }
    },
    [applyCaptureFxStem],
  );

  // After SpectralGate: apply capture FX, then deferred seek, then clear overlay.
  useEffect(() => {
    const cleaning = cleaningLayerIds.length > 0;
    if (wasCleaningRef.current && !cleaning) {
      softCleanEnqueuedRef.current = false;
      const layerId =
        capturingLayerIdRef.current ??
        projectRef.current.selectedLayerId ??
        projectRef.current.layers[0]?.id ??
        null;

      void (async () => {
        // Soft-clean completion always re-applies current selection (covers
        // chip changes made while cleaning). Clear deferred flag to avoid a second pass.
        pendingCaptureFxApplyRef.current = false;
        if (layerId) {
          await runCaptureFxApply(layerId);
        }
        if (!mountedRef.current) {
          return;
        }
        const seekTo = pendingSeekRef.current;
        pendingSeekRef.current = null;
        if (seekTo != null) {
          playheadSecondsRef.current = seekTo;
          playback.markResumeAt(seekTo);
          void playback.seekTo(seekTo).catch(() => {
            // Player may still be remounting; ignore one-shot failures.
          });
        }
        setIsFinalizing(false);
        capturingLayerIdRef.current = null;
      })();
    }
    wasCleaningRef.current = cleaning;
  }, [cleaningLayerIds.length, playback, runCaptureFxApply]);

  const prevStatusForFinalizeRef = useRef(status);
  useEffect(() => {
    const prev = prevStatusForFinalizeRef.current;
    prevStatusForFinalizeRef.current = status;
    if (!isFinalizing) {
      return;
    }
    // optimizing → idle without preview means capture/stage failed.
    if (prev === 'optimizing' && status === 'idle' && !softCleanEnqueuedRef.current) {
      setIsFinalizing(false);
    }
  }, [isFinalizing, status]);

  useTakeCaptureBridge({
    enabled: captureEnabled,
    capturingLayerIdRef,
    onAttach: handleAttachTake,
    onAttached: handleTakeAttached,
    onSettled: handleTakeSettled,
  });

  const isCleaning = cleaningLayerIds.length > 0;
  const isBusy =
    isFinalizing || isOptimizing || isCleaning || isApplyingCaptureFx;

  // Deferred capture-FX apply after record/clean pipeline finishes.
  useEffect(() => {
    if (isBusy || !pendingCaptureFxApplyRef.current) {
      return;
    }
    const layerId =
      projectRef.current.selectedLayerId ??
      projectRef.current.layers[0]?.id ??
      null;
    const hasStem = Boolean(
      layerId &&
        projectRef.current.layers.find((layer) => layer.id === layerId)?.stemUri,
    );
    if (!layerId || !hasStem) {
      pendingCaptureFxApplyRef.current = false;
      return;
    }
    pendingCaptureFxApplyRef.current = false;
    setIsFinalizing(true);
    void (async () => {
      await runCaptureFxApply(layerId);
      if (mountedRef.current) {
        setIsFinalizing(false);
      }
    })();
  }, [isBusy, runCaptureFxApply]);

  const setCaptureFxSelection = useCallback(
    (selection: EditChainSelection) => {
      setCaptureFxSelectionStore(normalizeCaptureFxSelection(selection));

      const layer = selectedLayer(projectRef.current);
      if (!layer?.stemUri) {
        // Empty project — selection only until a take exists.
        return;
      }

      if (isRecording || isBusy) {
        pendingCaptureFxApplyRef.current = true;
        return;
      }

      setIsFinalizing(true);
      void (async () => {
        await runCaptureFxApply(layer.id);
        if (mountedRef.current) {
          setIsFinalizing(false);
        }
      })();
    },
    [isBusy, isRecording, runCaptureFxApply, setCaptureFxSelectionStore],
  );

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

  const beginPostRecordBusy = useCallback(() => {
    softCleanEnqueuedRef.current = false;
    setIsFinalizing(true);
  }, []);

  const stopRecord = useCallback(() => {
    beginPostRecordBusy();
    recordingSessionService.requestStop();
    void handleMainAction();
    setRecordOriginSeconds(0);
  }, [beginPostRecordBusy, handleMainAction]);

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
      // Keep capture chips in sync when edit-screen FX change the stem.
      // Use the store setter (selection only) — do not re-run capture apply.
      if (nextEditChain !== undefined) {
        useQuickRecordStore
          .getState()
          .setCaptureFxSelection(
            normalizeCaptureFxSelection(fromStoredEditChain(nextEditChain)),
          );
      }
      projectRef.current = useQuickRecordStore.getState().project;
    },
    [applyStem],
  );

  const isDirty =
    fingerprintQuickRecordProject(project, title) !== initialFingerprint;

  const leaveToHome = useCallback(() => {
    leaveStudioSession(
      { back, canGoBack, dismissTo, replace },
      resolvedProjectId ?? useStudioProjectContextStore.getState().projectId,
    );
  }, [back, canGoBack, dismissTo, replace, resolvedProjectId]);

  /** @deprecated Prefer leaveToHome — kept for call sites mid-rename. */
  const leaveToAudio = leaveToHome;

  const discard = useCallback(async () => {
    isLeavingRef.current = true;
    await abandonInProgressCapture();
    leaveToAudio();
  }, [abandonInProgressCapture, leaveToAudio]);

  /**
   * Leave Quick Record (Discard + hardware back):
   * - Empty → leave
   * - Recording / take / dirty → confirm, then stop + clear + leave
   * Blur still hard-stops a live mic so it can't keep running off-screen.
   */
  const requestClose = useCallback(() => {
    if (isLeavingRef.current) {
      return;
    }

    const hasSomethingToLose = isRecording || isBusy || isDirty;
    if (hasSomethingToLose) {
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

    const projectId =
      useStudioProjectContextStore.getState().projectId ?? undefined;
    push({
      pathname: '/studio/quick-record/edit',
      params: projectId ? { projectId } : undefined,
    } as never);
  }, [awaitSoftCleanQueue, hasTake, isBusy, isRecording, push]);

  const togglePlayback = useCallback(() => {
    if (!hasTake || isRecording || isBusy) {
      return;
    }
    // Keep session playhead/resume-anchor in sync when restarting from EOF.
    if (!playback.isPlaying) {
      const dur = Math.max(playback.duration, durationSeconds);
      if (dur > 0 && playback.currentTime >= dur - 0.5) {
        playheadSecondsRef.current = 0;
        playback.markResumeAt(0);
      }
    }
    playback.togglePlayback();
  }, [durationSeconds, hasTake, isBusy, isRecording, playback]);

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
    title,
    setTitle,
    vocal,
    layerId: vocal?.id ?? null,
    stemUri,
    baselineUri,
    sourceUri,
    peaks,
    editChain,
    captureFx,
    captureFxSelection,
    setCaptureFxSelection,
    durationSeconds,
    isRecording,
    isOptimizing,
    isCleaning,
    isFinalizing,
    isApplyingCaptureFx,
    isBusy,
    beginPostRecordBusy,
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
    leaveToHome,
    leaveToAudio,
  };
}

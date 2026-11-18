import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { discardPreviewRecording } from '@/features/audio/data/recording-repository';
import {
  canAddLayer,
  createLayer,
  hasRecordableContent,
  nextLayerName,
  projectDurationSeconds,
  selectedLayer,
} from '@/features/audio/domain/project';
import { peakBarCountForDuration } from '@/features/audio/domain/timeline';
import { useSoftCleanQueue } from '@/features/audio/hooks/use-soft-clean-queue';
import type { StudioPlaybackTrack } from '@/features/audio/hooks/use-studio-playback';
import { useTakeCaptureBridge } from '@/features/audio/hooks/use-take-capture-bridge';
import { attachVocalTake } from '@/features/audio/services/attach-vocal-take.service';
import {
  pickBeatFile,
  prepareBeatFile,
} from '@/features/audio/services/beat-import.service';
import { extractPeaksFromWav } from '@/features/audio/services/peak-extract.service';
import { recordingSessionService } from '@/features/audio/services/recording-session.service';
import { useAudioSessionStore } from '@/features/audio/store/audio-session.store';
import type { StoredEditChain } from '@/features/audio/types/edit-chips';
import {
  MAX_PROJECT_LAYERS,
  type AudioProject,
  type ProjectLayer,
} from '@/features/audio/types/project';
import type { StudioSavePayload } from '@/features/audio/types/studio';
import { afterNextPaint } from '@/features/audio/utils/next-paint';

type UseMultitrackSessionOptions = {
  initialProject: AudioProject;
  isPending: boolean;
  isSaving: boolean;
  onSave: (payload: StudioSavePayload) => Promise<boolean>;
  onPersist?: (payload: StudioSavePayload) => Promise<boolean>;
  onClose: () => void;
  onDiscard: () => void;
};

type PersistJob = {
  fingerprint: string;
  payload: StudioSavePayload;
};

function fingerprintProject(project: AudioProject): string {
  return JSON.stringify({
    selectedLayerId: project.selectedLayerId,
    layers: project.layers.map((layer) => ({
      id: layer.id,
      kind: layer.kind,
      stemUri: layer.stemUri,
      muted: layer.muted,
      editChain: layer.editChain ?? null,
      durationSeconds: layer.durationSeconds,
      offsetMs: layer.offsetMs,
    })),
  });
}

export function useMultitrackSession({
  initialProject,
  isPending,
  isSaving,
  onSave,
  onPersist,
  onClose,
  onDiscard,
}: UseMultitrackSessionOptions) {
  const [project, setProject] = useState<AudioProject>(initialProject);
  const [recordingLayerId, setRecordingLayerId] = useState<string | null>(null);
  const [recordOriginSeconds, setRecordOriginSeconds] = useState(0);
  const [isImportingBeat, setIsImportingBeat] = useState(false);
  const [persistStatus, setPersistStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  /** Stop → finalize → attach → soft-clean; keeps overlay continuous. */
  const [isFinalizing, setIsFinalizing] = useState(false);
  const softCleanEnqueuedRef = useRef(false);
  const wasCleaningRef = useRef(false);

  const status = useAudioSessionStore((state) => state.status);
  // Metering is deliberately not read here: it lands ten times a second, and
  // subscribing at this level would re-render the whole studio at that rate.
  // The live lane subscribes to it directly instead.
  const hasActiveSession = useAudioSessionStore((state) => state.hasActiveSession);
  const startRecording = useAudioSessionStore((state) => state.startRecording);
  const handleMainAction = useAudioSessionStore((state) => state.handleMainAction);
  const resetSession = useAudioSessionStore((state) => state.resetSession);
  const prevStatusForFinalizeRef = useRef(status);

  const initialFingerprint = useMemo(
    () => fingerprintProject(initialProject),
    [initialProject],
  );
  const persistedFingerprintRef = useRef(initialFingerprint);
  const persistRunRef = useRef<Promise<void> | null>(null);
  const pendingJobRef = useRef<PersistJob | null>(null);
  const isLeavingRef = useRef(false);
  const capturingLayerIdRef = useRef<string | null>(null);
  const recordOriginSecondsRef = useRef(0);
  const recordReplaceAllRef = useRef(false);
  const peakAttemptsRef = useRef(new Set<string>());
  const projectRef = useRef(project);
  projectRef.current = project;
  const mountedRef = useRef(true);

  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    [],
  );

  const current = selectedLayer(project);
  const isRecording = hasActiveSession;
  const durationSeconds = projectDurationSeconds(project);
  const isOptimizing = status === 'optimizing';
  const canAdd = canAddLayer(project.layers);

  useEffect(() => {
    if (isRecording) {
      return;
    }

    const attempted = peakAttemptsRef.current;
    const missing = project.layers.filter((layer) => {
      if (!layer.stemUri) {
        return false;
      }

      const expected = peakBarCountForDuration(layer.durationSeconds);
      const tooCoarse = layer.peaks.length > 0 && layer.peaks.length < expected * 0.5;
      const key = `${layer.id}:${layer.stemUri}:${expected}`;
      return (layer.peaks.length === 0 || tooCoarse) && !attempted.has(key);
    });
    if (missing.length === 0) {
      return;
    }

    let cancelled = false;
    void (async () => {
      const peakMap = new Map<string, number[]>();
      for (const layer of missing) {
        if (!layer.stemUri) {
          continue;
        }
        const expected = peakBarCountForDuration(layer.durationSeconds);
        // Marked up front so a file we cannot read is not retried forever.
        attempted.add(`${layer.id}:${layer.stemUri}:${expected}`);
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
        peakMap.set(layer.id, await extractPeaksFromWav(layer.stemUri, expected));
      }
      if (cancelled) {
        return;
      }

      setProject((currentProject) => {
        const next = {
          ...currentProject,
          layers: currentProject.layers.map((layer) => {
            const peaks = peakMap.get(layer.id);
            if (!peaks) {
              return layer;
            }

            const expected = peakBarCountForDuration(layer.durationSeconds);
            const tooCoarse = layer.peaks.length < expected * 0.5;
            return layer.peaks.length === 0 || tooCoarse ? { ...layer, peaks } : layer;
          }),
        };
        projectRef.current = next;
        return next;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [isRecording, project.layers]);

  const enqueuePersist = useCallback(
    (job: PersistJob) => {
      if (!onPersist) {
        return;
      }

      pendingJobRef.current = job;
      if (persistRunRef.current) {
        return;
      }

      persistRunRef.current = (async () => {
        try {
          let next = pendingJobRef.current;
          while (next) {
            pendingJobRef.current = null;
            setPersistStatus('saving');
            const persisted = await onPersist(next.payload);
            if (persisted) {
              persistedFingerprintRef.current = next.fingerprint;
            }
            setPersistStatus(persisted ? 'idle' : 'error');
            next = pendingJobRef.current;
          }
        } finally {
          persistRunRef.current = null;
        }
      })();
    },
    [onPersist],
  );

  const commitProject = useCallback(
    (nextProject: AudioProject, options?: { persist?: boolean }) => {
      projectRef.current = nextProject;
      setProject(nextProject);

      // Never let an emptied project overwrite a saved one in the background.
      if (options?.persist === false || !onPersist || !hasRecordableContent(nextProject)) {
        return;
      }

      const payload: StudioSavePayload = { project: nextProject };
      enqueuePersist({
        fingerprint: fingerprintProject(nextProject),
        payload,
      });
    },
    [enqueuePersist, onPersist],
  );

  const getProject = useCallback(() => projectRef.current, []);

  const { cleaningLayerIds, enqueueSoftClean, awaitSoftCleanQueue } = useSoftCleanQueue({
    getProject,
    onProjectChange: commitProject,
  });

  const handleAttachTake = useCallback(
    async (input: {
      layerId: string;
      stemUri: string;
      sourceUri: string | null;
      durationSeconds: number;
    }) => {
      const originSeconds = recordOriginSecondsRef.current;
      const replaceAll = recordReplaceAllRef.current;
      recordReplaceAllRef.current = false;

      const result = await attachVocalTake({
        project: projectRef.current,
        layerId: input.layerId,
        stemUri: input.stemUri,
        sourceUri: input.sourceUri,
        durationSeconds: input.durationSeconds,
        originSeconds,
        replaceAll,
      });

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
      softCleanEnqueuedRef.current = true;
      enqueueSoftClean(layerId, attachedUri);
    },
    [enqueueSoftClean],
  );

  const handleCaptureSettled = useCallback(() => {
    setRecordingLayerId(null);
    if (!softCleanEnqueuedRef.current) {
      setIsFinalizing(false);
    }
  }, []);

  useEffect(() => {
    const cleaning = cleaningLayerIds.length > 0;
    if (wasCleaningRef.current && !cleaning) {
      setIsFinalizing(false);
      softCleanEnqueuedRef.current = false;
    }
    wasCleaningRef.current = cleaning;
  }, [cleaningLayerIds.length]);

  useEffect(() => {
    const prev = prevStatusForFinalizeRef.current;
    prevStatusForFinalizeRef.current = status;
    if (!isFinalizing) {
      return;
    }
    if (prev === 'optimizing' && status === 'idle' && !softCleanEnqueuedRef.current) {
      setIsFinalizing(false);
    }
  }, [isFinalizing, status]);

  useTakeCaptureBridge({
    capturingLayerIdRef,
    onAttach: handleAttachTake,
    onAttached: handleTakeAttached,
    onSettled: handleCaptureSettled,
  });

  const ensureVocalLayer = useCallback((): ProjectLayer | null => {
    const currentProject = projectRef.current;
    const selected = selectedLayer(currentProject);
    if (selected?.kind === 'vocal') {
      return selected;
    }

    if (!canAddLayer(currentProject.layers)) {
      Alert.alert(
        'Layer limit',
        `This project already has ${MAX_PROJECT_LAYERS} layers.`,
      );
      return null;
    }

    const layer = createLayer({
      kind: 'vocal',
      name: nextLayerName(currentProject.layers, 'vocal'),
    });

    const nextProject: AudioProject = {
      ...currentProject,
      layers: [...currentProject.layers, layer],
      selectedLayerId: layer.id,
    };
    projectRef.current = nextProject;
    setProject(nextProject);
    return layer;
  }, []);

  const beginPostRecordBusy = useCallback(() => {
    softCleanEnqueuedRef.current = false;
    setIsFinalizing(true);
  }, []);

  const handleStopPress = useCallback(() => {
    beginPostRecordBusy();
    recordingSessionService.requestStop();
    void handleMainAction();
  }, [beginPostRecordBusy, handleMainAction]);

  const handleRecordPress = useCallback(
    (origin: 'playhead' | 'start' = 'playhead', playheadSeconds = 0) => {
      if (hasActiveSession || isOptimizing || isFinalizing || isSaving || isImportingBeat) {
        return;
      }

      const vocal = ensureVocalLayer();
      if (!vocal) {
        return;
      }

      const originSeconds = origin === 'start' ? 0 : Math.max(0, playheadSeconds);
      recordOriginSecondsRef.current = originSeconds;
      recordReplaceAllRef.current = origin === 'start';
      setRecordOriginSeconds(originSeconds);
      capturingLayerIdRef.current = vocal.id;
      setRecordingLayerId(vocal.id);
      void (async () => {
        await afterNextPaint();
        void startRecording();
      })();
    },
    [
      ensureVocalLayer,
      hasActiveSession,
      isFinalizing,
      isImportingBeat,
      isOptimizing,
      isSaving,
      startRecording,
    ],
  );

  const addBeat = useCallback(async () => {
    if (isRecording || isOptimizing || isImportingBeat) {
      return;
    }

    if (!canAddLayer(projectRef.current.layers)) {
      Alert.alert(
        'Layer limit',
        `This project already has ${MAX_PROJECT_LAYERS} layers.`,
      );
      return;
    }

    // Claim UI before the native picker so rapid taps cannot reopen it.
    setIsImportingBeat(true);
    try {
      const picked = await pickBeatFile();
      if (!picked) {
        return;
      }

      await afterNextPaint();

      const beat = await prepareBeatFile(picked.uri);
      const peaks = await extractPeaksFromWav(
        beat.uri,
        peakBarCountForDuration(beat.durationSeconds),
      );
      const currentProject = projectRef.current;
      const layer = createLayer({
        kind: 'beat',
        name: nextLayerName(currentProject.layers, 'beat'),
        stemUri: beat.uri,
        baselineUri: beat.uri,
        sourceUri: beat.uri,
        durationSeconds: beat.durationSeconds,
        peaks,
      });

      commitProject({
        ...currentProject,
        layers: [...currentProject.layers, layer],
        selectedLayerId: layer.id,
      });
    } catch (error) {
      Alert.alert(
        'Could not add beat',
        error instanceof Error ? error.message : 'Could not import that file.',
      );
    } finally {
      setIsImportingBeat(false);
    }
  }, [commitProject, isImportingBeat, isOptimizing, isRecording]);

  const addVocalLayer = useCallback(async () => {
    const currentProject = projectRef.current;
    if (!canAddLayer(currentProject.layers) || isRecording || isOptimizing || isImportingBeat) {
      if (!canAddLayer(currentProject.layers)) {
        Alert.alert(
          'Layer limit',
          `This project already has ${MAX_PROJECT_LAYERS} layers.`,
        );
      }
      return;
    }

    const layer = createLayer({
      kind: 'vocal',
      name: nextLayerName(currentProject.layers, 'vocal'),
    });

    const nextProject: AudioProject = {
      ...currentProject,
      layers: [...currentProject.layers, layer],
      selectedLayerId: layer.id,
    };
    projectRef.current = nextProject;
    setProject(nextProject);
  }, [isImportingBeat, isOptimizing, isRecording]);

  const selectLayer = useCallback((layerId: string) => {
    setProject((currentProject) => {
      const next = { ...currentProject, selectedLayerId: layerId };
      projectRef.current = next;
      return next;
    });
  }, []);

  const renameLayer = useCallback(
    (layerId: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) {
        return;
      }
      const currentProject = projectRef.current;
      const nextLayers = currentProject.layers.map((layer) =>
        layer.id === layerId ? { ...layer, name: trimmed } : layer,
      );
      commitProject({ ...currentProject, layers: nextLayers });
    },
    [commitProject],
  );

  const toggleMute = useCallback(
    (layerId: string) => {
      const currentProject = projectRef.current;
      const nextLayers = currentProject.layers.map((layer) =>
        layer.id === layerId ? { ...layer, muted: !layer.muted } : layer,
      );
      commitProject({ ...currentProject, layers: nextLayers });
    },
    [commitProject],
  );

  const removeLayer = useCallback(
    (layerId: string) => {
      if (isRecording || isOptimizing || isSaving) {
        return;
      }

      const target = projectRef.current.layers.find((layer) => layer.id === layerId);
      if (!target) {
        return;
      }

      const apply = () => {
        const latest = projectRef.current;
        const removedIndex = latest.layers.findIndex((layer) => layer.id === layerId);
        const remaining = latest.layers.filter((layer) => layer.id !== layerId);
        const nextSelectedId =
          latest.selectedLayerId === layerId
            ? (remaining[Math.min(removedIndex, remaining.length - 1)]?.id ?? null)
            : latest.selectedLayerId;

        commitProject({
          ...latest,
          layers: remaining,
          selectedLayerId: nextSelectedId,
        });

        // Only clears the take's temp files; saved stems stay on disk.
        void discardPreviewRecording(target.stemUri ?? '', target.sourceUri);
      };

      if (!target.stemUri) {
        apply();
        return;
      }

      Alert.alert('Remove layer', `Remove ${target.name} from this recording?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: apply },
      ]);
    },
    [commitProject, isOptimizing, isRecording, isSaving],
  );

  const applyVocalStem = useCallback(
    (layerId: string, stemUri: string, editChain: StoredEditChain | undefined) => {
      const currentProject = projectRef.current;
      const nextLayers = currentProject.layers.map((layer) =>
        layer.id === layerId ? { ...layer, stemUri, editChain } : layer,
      );
      commitProject({ ...currentProject, layers: nextLayers });
    },
    [commitProject],
  );

  const persistPendingWork = useCallback(async (): Promise<boolean> => {
    if (isRecording || isOptimizing) {
      return false;
    }

    // A gate still running holds the final stem for a layer, so it has to land
    // before the project is fingerprinted and mixed down.
    setPersistStatus('saving');
    await awaitSoftCleanQueue();
    await persistRunRef.current;
    setPersistStatus('idle');

    const latest = projectRef.current;
    const currentFingerprint = fingerprintProject(latest);
    const needsWrite =
      isPending || currentFingerprint !== persistedFingerprintRef.current;

    if (!needsWrite) {
      return true;
    }

    if (!hasRecordableContent(latest)) {
      Alert.alert('Nothing to save', 'Record or import a layer first.');
      return false;
    }

    // The repository mixes the unmuted stems down while it writes the project.
    const saved = await onSave({ project: latest });

    if (!saved) {
      setPersistStatus('error');
      return false;
    }

    persistedFingerprintRef.current = currentFingerprint;
    return true;
  }, [awaitSoftCleanQueue, isOptimizing, isPending, isRecording, onSave]);

  const handleDone = useCallback(async () => {
    if (!(await persistPendingWork())) {
      return;
    }

    isLeavingRef.current = true;
    onClose();
  }, [onClose, persistPendingWork]);

  const handleDiscard = useCallback(async () => {
    await resetSession();
    for (const layer of project.layers) {
      await discardPreviewRecording(layer.stemUri ?? '', layer.sourceUri);
    }
    isLeavingRef.current = true;
    onDiscard();
  }, [onDiscard, project.layers, resetSession]);

  const backingTracks = useMemo(() => {
    if (!isRecording) {
      return [] as { uri: string; offsetSeconds: number }[];
    }

    return project.layers
      .filter(
        (layer) => !layer.muted && layer.stemUri && layer.id !== recordingLayerId,
      )
      .map((layer) => ({
        uri: layer.stemUri as string,
        offsetSeconds: layer.offsetMs / 1000,
      }));
  }, [isRecording, project.layers, recordingLayerId]);

  /** Every unmuted stem, so the transport plays the timeline and not one layer. */
  const playbackTracks = useMemo<StudioPlaybackTrack[]>(
    () =>
      project.layers
        .filter((layer) => !layer.muted && layer.stemUri)
        .map((layer) => ({
          id: layer.id,
          uri: layer.stemUri as string,
          offsetSeconds: layer.offsetMs / 1000,
        })),
    [project.layers],
  );

  const isDirty = fingerprintProject(project) !== initialFingerprint;

  const shouldPromptBeforeLeaving = useCallback(
    () =>
      isPending &&
      isDirty &&
      !isLeavingRef.current &&
      !isSaving &&
      !isRecording &&
      !isOptimizing &&
      !isFinalizing,
    [isDirty, isFinalizing, isOptimizing, isPending, isRecording, isSaving],
  );

  return {
    project,
    current,
    durationSeconds,
    isRecording,
    recordingLayerId,
    recordOriginSeconds,
    cleaningLayerIds,
    isOptimizing,
    isFinalizing,
    isImportingBeat,
    isSaving,
    persistStatus,
    canAdd,
    backingTracks,
    playbackTracks,
    beginPostRecordBusy,
    handleRecordPress,
    handleStopPress,
    addBeat,
    addVocalLayer,
    selectLayer,
    renameLayer,
    toggleMute,
    removeLayer,
    applyVocalStem,
    handleDone,
    handleDiscard,
    persistPendingWork,
    shouldPromptBeforeLeaving,
    isDirty,
  };
}

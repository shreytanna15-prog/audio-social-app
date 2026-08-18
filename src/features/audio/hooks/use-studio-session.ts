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
import type { StudioPlaybackTrack } from '@/features/audio/hooks/use-studio-playback';
import {
  pickBeatFile,
  prepareBeatFile,
} from '@/features/audio/services/beat-import.service';
import { extractPeaksFromWav } from '@/features/audio/services/peak-extract.service';
import { mergeVocalPunchIn } from '@/features/audio/services/punch-in-merge.service';
import { recordingSessionService } from '@/features/audio/services/recording-session.service';
import { useAudioSessionStore } from '@/features/audio/store/audio-session.store';
import type { StoredEditChain } from '@/features/audio/types/edit-chips';
import type { AudioProject, ProjectLayer } from '@/features/audio/types/project';
import type { StudioSavePayload } from '@/features/audio/types/studio';
import { afterNextPaint } from '@/features/audio/utils/next-paint';

type UseStudioSessionOptions = {
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

export function useStudioSession({
  initialProject,
  isPending,
  isSaving,
  onSave,
  onPersist,
  onClose,
  onDiscard,
}: UseStudioSessionOptions) {
  const [project, setProject] = useState<AudioProject>(initialProject);
  const [recordingLayerId, setRecordingLayerId] = useState<string | null>(null);
  const [recordOriginSeconds, setRecordOriginSeconds] = useState(0);
  const [cleaningLayerIds, setCleaningLayerIds] = useState<string[]>([]);
  const [isImportingBeat, setIsImportingBeat] = useState(false);
  const [persistStatus, setPersistStatus] = useState<'idle' | 'saving' | 'error'>('idle');

  const status = useAudioSessionStore((state) => state.status);
  // Metering is deliberately not read here: it lands ten times a second, and
  // subscribing at this level would re-render the whole studio at that rate.
  // The live lane subscribes to it directly instead.
  const hasActiveSession = useAudioSessionStore((state) => state.hasActiveSession);
  const isPaused = useAudioSessionStore((state) => state.isPaused);
  const previewUri = useAudioSessionStore((state) => state.previewUri);
  const sourcePreGateUri = useAudioSessionStore((state) => state.sourcePreGateUri);
  const frozenDurationMillis = useAudioSessionStore((state) => state.frozenDurationMillis);
  const startRecording = useAudioSessionStore((state) => state.startRecording);
  const handleMainAction = useAudioSessionStore((state) => state.handleMainAction);
  const handlePauseResume = useAudioSessionStore((state) => state.handlePauseResume);
  const handoffToEditor = useAudioSessionStore((state) => state.handoffToEditor);
  const resetSession = useAudioSessionStore((state) => state.resetSession);

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
  // Cleans are chained so two native gate passes never overlap, and so Done can
  // wait on whatever is still running.
  const cleanQueueRef = useRef<Promise<void>>(Promise.resolve());
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

  const attachVocalTake = useCallback(
    async (input: {
      layerId: string;
      stemUri: string;
      sourceUri: string | null;
      durationSeconds: number;
    }) => {
      const currentProject = projectRef.current;
      const layer = currentProject.layers.find((item) => item.id === input.layerId);
      const originSeconds = recordOriginSecondsRef.current;
      const replaceAll = recordReplaceAllRef.current;
      recordReplaceAllRef.current = false;

      let stemUri = input.stemUri;
      let durationSeconds = input.durationSeconds;
      let offsetMs = Math.round(originSeconds * 1000);
      let merged = false;

      if (layer) {
        try {
          const mergedTake = await mergeVocalPunchIn({
            layer,
            newUri: input.stemUri,
            takeDurationSeconds: input.durationSeconds,
            originSeconds,
            replaceAll,
          });
          stemUri = mergedTake.uri;
          durationSeconds = mergedTake.durationSeconds;
          offsetMs = mergedTake.offsetMs;
          merged = mergedTake.merged;
        } catch (error) {
          console.warn('[Studio] punch-in merge failed; keeping offset take.', error);
          stemUri = input.stemUri;
          durationSeconds = input.durationSeconds;
          offsetMs = Math.round(originSeconds * 1000);
          merged = false;
        }
      }

      const sourceUri = stemUri;
      const previousStemUri = layer?.stemUri ?? null;

      const nextLayers = currentProject.layers.map((item) => {
        if (item.id !== input.layerId) {
          return item;
        }

        return {
          ...item,
          stemUri,
          baselineUri: stemUri,
          sourceUri,
          durationSeconds,
          offsetMs,
          peaks: [],
          editChain: undefined,
        };
      });

      const nextProject: AudioProject = {
        ...currentProject,
        layers: nextLayers,
        selectedLayerId: input.layerId,
      };
      commitProject(nextProject);

      if (
        (merged || replaceAll) &&
        previousStemUri &&
        previousStemUri !== stemUri
      ) {
        void discardPreviewRecording(previousStemUri);
      }
      if (merged && input.stemUri !== stemUri) {
        void discardPreviewRecording(input.stemUri, input.sourceUri);
      }

      const peaks = await extractPeaksFromWav(
        stemUri,
        peakBarCountForDuration(durationSeconds),
      );

      if (!mountedRef.current) {
        return stemUri;
      }

      const latest = projectRef.current;
      const attached = latest.layers.find((item) => item.id === input.layerId);
      if (attached?.stemUri !== stemUri) {
        return stemUri;
      }

      commitProject({
        ...latest,
        layers: latest.layers.map((item) =>
          item.id === input.layerId ? { ...item, peaks } : item,
        ),
      });

      return stemUri;
    },
    [commitProject],
  );

  /**
   * Soft-gates a take that is already visible in its lane, then swaps the stem.
   *
   * The gate takes seconds, so anything the user does to the layer meanwhile
   * wins: a removed layer, a re-record, or an applied effect all make the
   * result stale and it is thrown away rather than clobbering their work.
   */
  const runSoftClean = useCallback(
    (layerId: string, rawUri: string) => {
      setCleaningLayerIds((ids) => (ids.includes(layerId) ? ids : [...ids, layerId]));

      // Must never reject: Done awaits this chain, so a thrown error here would
      // leave saving permanently broken.
      cleanQueueRef.current = cleanQueueRef.current.then(async () => {
        try {
          const cleanedUri = await recordingSessionService.softClean(rawUri);

          if (!cleanedUri || !mountedRef.current) {
            return;
          }

          const layer = projectRef.current.layers.find((item) => item.id === layerId);
          const untouched = layer?.stemUri === rawUri && layer?.sourceUri === rawUri;

          if (!untouched) {
            await discardPreviewRecording(cleanedUri);
            return;
          }

          const peaks = await extractPeaksFromWav(
            cleanedUri,
            peakBarCountForDuration(layer.durationSeconds),
          );

          if (!mountedRef.current) {
            return;
          }

          const latest = projectRef.current;
          commitProject({
            ...latest,
            layers: latest.layers.map((item) =>
              item.id === layerId
                ? { ...item, stemUri: cleanedUri, baselineUri: cleanedUri, peaks }
                : item,
            ),
          });
        } catch (error) {
          console.warn('[Optimize] soft clean swap failed; keeping raw take.', error);
        } finally {
          if (mountedRef.current) {
            setCleaningLayerIds((ids) => ids.filter((id) => id !== layerId));
          }
        }
      });
    },
    [commitProject],
  );

  useEffect(() => {
    if (status !== 'preview' || !previewUri) {
      return;
    }

    const layerId = capturingLayerIdRef.current;
    const stemUri = previewUri;
    const sourceUri = sourcePreGateUri;
    const takeDuration = frozenDurationMillis / 1000;
    capturingLayerIdRef.current = null;
    setRecordingLayerId(null);
    handoffToEditor();

    if (!layerId) {
      return;
    }

    void attachVocalTake({
      layerId,
      stemUri,
      sourceUri,
      durationSeconds: takeDuration,
    })
      .then((attachedUri) => {
        runSoftClean(layerId, attachedUri);
      })
      .catch((error: unknown) => {
        console.warn('[Studio] could not attach take to layer.', error);
      });
  }, [
    attachVocalTake,
    frozenDurationMillis,
    handoffToEditor,
    previewUri,
    runSoftClean,
    sourcePreGateUri,
    status,
  ]);

  const ensureVocalLayer = useCallback((): ProjectLayer | null => {
    const currentProject = projectRef.current;
    const selected = selectedLayer(currentProject);
    if (selected?.kind === 'vocal') {
      return selected;
    }

    if (!canAddLayer(currentProject.layers)) {
      Alert.alert('Layer limit', 'This project already has 4 layers.');
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

  const handleStopPress = useCallback(() => {
    recordingSessionService.requestStop();
    void handleMainAction();
  }, [handleMainAction]);

  const handleRecordPress = useCallback(
    (origin: 'playhead' | 'start' = 'playhead', playheadSeconds = 0) => {
      if (hasActiveSession || isOptimizing || isSaving || isImportingBeat) {
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
      Alert.alert('Layer limit', 'This project already has 4 layers.');
      return;
    }

    try {
      const picked = await pickBeatFile();
      if (!picked) {
        return;
      }

      // Decoding a full song takes seconds, so claim the slot in the stack now.
      setIsImportingBeat(true);
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
        Alert.alert('Layer limit', 'This project already has 4 layers.');
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
    await cleanQueueRef.current;
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
  }, [isOptimizing, isPending, isRecording, onSave]);

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
      !isOptimizing,
    [isDirty, isOptimizing, isPending, isRecording, isSaving],
  );

  return {
    project,
    current,
    durationSeconds,
    isRecording,
    recordingLayerId,
    recordOriginSeconds,
    cleaningLayerIds,
    isPaused,
    isOptimizing,
    isImportingBeat,
    isSaving,
    persistStatus,
    canAdd,
    backingTracks,
    playbackTracks,
    handleRecordPress,
    handleStopPress,
    handlePauseResume,
    addBeat,
    addVocalLayer,
    selectLayer,
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

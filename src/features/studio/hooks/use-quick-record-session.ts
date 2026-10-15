import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { discardPreviewRecording } from '@/features/audio/data/recording-repository';
import { toStoredEditChain } from '@/features/audio/domain/edit-chain-persistence';
import {
  createEmptyProject,
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
import { useRecordingsStore } from '@/features/audio/store/recordings.store';
import type { StoredEditChain } from '@/features/audio/types/edit-chips';
import type { AudioProject, ProjectLayer } from '@/features/audio/types/project';
import { afterNextPaint } from '@/features/audio/utils/next-paint';

/** UI cap shown on Quick Record (matches timer display). */
export const QUICK_RECORD_MAX_SECONDS = 180;

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

function createQuickRecordProject(): AudioProject {
  const layer = createLayer({
    kind: 'vocal',
    name: nextLayerName([], 'vocal'),
  });
  return {
    ...createEmptyProject(),
    layers: [layer],
    selectedLayerId: layer.id,
  };
}

export function useQuickRecordSession() {
  const { back, canGoBack, replace } = useRouter();
  const [project, setProject] = useState<AudioProject>(createQuickRecordProject);
  const [isSaving, setIsSaving] = useState(false);
  const [fxProcessing, setFxProcessing] = useState(false);

  const status = useAudioSessionStore((state) => state.status);
  const hasActiveSession = useAudioSessionStore((state) => state.hasActiveSession);
  const startRecording = useAudioSessionStore((state) => state.startRecording);
  const handleMainAction = useAudioSessionStore((state) => state.handleMainAction);
  const resetSession = useAudioSessionStore((state) => state.resetSession);
  const saveProject = useRecordingsStore((state) => state.saveProject);
  const storeSaving = useRecordingsStore((state) => state.isSaving);

  const initialFingerprint = useMemo(
    () => fingerprintProject(createQuickRecordProject()),
    [],
  );
  const capturingLayerIdRef = useRef<string | null>(null);
  const projectRef = useRef(project);
  projectRef.current = project;
  const isLeavingRef = useRef(false);
  const mountedRef = useRef(true);

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

  const commitProject = useCallback((nextProject: AudioProject) => {
    projectRef.current = nextProject;
    setProject(nextProject);
  }, []);

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
      const result = await attachVocalTake({
        project: projectRef.current,
        layerId: input.layerId,
        stemUri: input.stemUri,
        sourceUri: input.sourceUri,
        durationSeconds: input.durationSeconds,
        originSeconds: 0,
        replaceAll: true,
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
      enqueueSoftClean(layerId, attachedUri);
    },
    [enqueueSoftClean],
  );

  useTakeCaptureBridge({
    capturingLayerIdRef,
    onAttach: handleAttachTake,
    onAttached: handleTakeAttached,
  });

  const startRecord = useCallback(() => {
    if (hasActiveSession || isOptimizing || isSaving || storeSaving || fxProcessing) {
      return;
    }

    playback.pause();
    const vocalLayer = ensureVocalLayer();
    capturingLayerIdRef.current = vocalLayer.id;
    void (async () => {
      await afterNextPaint();
      void startRecording();
    })();
  }, [
    ensureVocalLayer,
    fxProcessing,
    hasActiveSession,
    isOptimizing,
    isSaving,
    playback,
    startRecording,
    storeSaving,
  ]);

  const stopRecord = useCallback(() => {
    recordingSessionService.requestStop();
    void handleMainAction();
  }, [handleMainAction]);

  // Cap length without subscribing metering/elapsed into this hook (avoids
  // re-rendering the waveform parent at 10 Hz).
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

  const applyVocalStem = useCallback(
    (layerId: string, nextStemUri: string, nextEditChain: StoredEditChain | undefined) => {
      const currentProject = projectRef.current;
      commitProject({
        ...currentProject,
        layers: currentProject.layers.map((layer) =>
          layer.id === layerId
            ? { ...layer, stemUri: nextStemUri, editChain: nextEditChain }
            : layer,
        ),
      });
    },
    [commitProject],
  );

  const onStemChange = useCallback(
    (layerId: string, nextStemUri: string, nextEditChain?: StoredEditChain) => {
      applyVocalStem(layerId, nextStemUri, nextEditChain);
    },
    [applyVocalStem],
  );

  const isDirty = fingerprintProject(project) !== initialFingerprint;

  const closeScreen = useCallback(() => {
    if (canGoBack()) {
      back();
      return;
    }
    replace('/(tabs)/audio');
  }, [back, canGoBack, replace]);

  const save = useCallback(async () => {
    if (isRecording || isOptimizing || isSaving || storeSaving) {
      return false;
    }

    setIsSaving(true);
    try {
      await awaitSoftCleanQueue();
      const latest = projectRef.current;

      if (!hasRecordableContent(latest)) {
        Alert.alert('Nothing to save', 'Record a take first.');
        return false;
      }

      const saved = await saveProject({ project: latest });
      if (!saved) {
        return false;
      }

      isLeavingRef.current = true;
      closeScreen();
      return true;
    } finally {
      if (mountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [
    awaitSoftCleanQueue,
    closeScreen,
    isOptimizing,
    isRecording,
    isSaving,
    saveProject,
    storeSaving,
  ]);

  const discard = useCallback(async () => {
    await resetSession();
    for (const layer of projectRef.current.layers) {
      await discardPreviewRecording(layer.stemUri ?? '', layer.sourceUri);
    }
    isLeavingRef.current = true;
    closeScreen();
  }, [closeScreen, resetSession]);

  const requestClose = useCallback(() => {
    if (isRecording || isOptimizing) {
      return;
    }

    if (isDirty && !isLeavingRef.current && !isSaving && !storeSaving) {
      Alert.alert('Discard recording?', 'Your take will be lost.', [
        { text: 'Keep editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => void discard() },
      ]);
      return;
    }

    closeScreen();
  }, [closeScreen, discard, isDirty, isOptimizing, isRecording, isSaving, storeSaving]);

  const togglePlayback = useCallback(() => {
    if (!hasTake || isRecording || isOptimizing) {
      return;
    }
    playback.togglePlayback();
  }, [hasTake, isOptimizing, isRecording, playback]);

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
    isSaving: isSaving || storeSaving,
    isCleaning: cleaningLayerIds.length > 0,
    fxProcessing,
    setFxProcessing,
    hasTake,
    isDirty,
    isPlaying: playback.isPlaying,
    currentTime: playback.currentTime,
    playbackDuration: playback.duration,
    maxSeconds: QUICK_RECORD_MAX_SECONDS,
    startRecord,
    stopRecord,
    toggleRecord,
    togglePlayback,
    pausePlayback: playback.pause,
    seekTo: playback.seekTo,
    save,
    discard,
    requestClose,
    onStemChange,
    toStoredEditChain,
  };
}

import { useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';

import {
  createLayer,
  nextLayerName,
} from '@/features/audio/domain/project';
import { useRecordingEditorUnsavedGuard } from '@/features/audio/hooks/use-recording-editor-unsaved-guard';
import { useStudioPlayback } from '@/features/audio/hooks/use-studio-playback';
import { recordingSessionService } from '@/features/audio/services/recording-session.service';
import { useRecordingsStore } from '@/features/audio/store';
import { PROJECT_VERSION, type AudioProject } from '@/features/audio/types/project';
import type { StudioSavePayload } from '@/features/audio/types/studio';
import { useMultitrackSession } from '@/features/studio/hooks/use-multitrack-session';
import { useMultitrackEntryStore } from '@/features/studio/store/multitrack-entry.store';

function createPendingMultitrackProject(): AudioProject {
  const layer = createLayer({
    kind: 'vocal',
    name: nextLayerName([], 'vocal'),
  });
  return {
    version: PROJECT_VERSION,
    layers: [layer],
    selectedLayerId: layer.id,
  };
}

/**
 * Composes existing multitrack session + mix playback for the Noir Multitrack screen.
 * No attach / soft-clean / punch logic lives here — that stays in the session.
 */
export function useMultitrackStudioScreen() {
  const { replace } = useRouter();
  const isSaving = useRecordingsStore((state) => state.isSaving);
  const saveProject = useRecordingsStore((state) => state.saveProject);

  const initialProject = useMemo(() => {
    const pending = useMultitrackEntryStore.getState().consumePendingProject();
    return pending ?? createPendingMultitrackProject();
  }, []);

  const leaveToHome = useCallback(() => {
    replace('/(tabs)');
  }, [replace]);

  const handleSave = useCallback(
    async (payload: StudioSavePayload): Promise<boolean> => {
      if (isSaving) {
        return false;
      }
      const saved = await saveProject(payload);
      return saved != null;
    },
    [isSaving, saveProject],
  );

  const studio = useMultitrackSession({
    initialProject,
    isPending: true,
    isSaving,
    onSave: handleSave,
    onClose: leaveToHome,
    onDiscard: leaveToHome,
  });

  const playback = useStudioPlayback(
    studio.playbackTracks,
    studio.durationSeconds,
    !studio.isRecording,
  );

  const [windowStartSeconds, setWindowStartSeconds] = useState(0);
  const [fxProcessing, setFxProcessing] = useState(false);
  const [scrubbing, setScrubbing] = useState(false);
  const wasPlayingRef = useRef(false);

  useRecordingEditorUnsavedGuard({
    enabled: true,
    shouldPrompt: studio.shouldPromptBeforeLeaving,
    onSave: studio.persistPendingWork,
  });

  const duration = Math.max(studio.durationSeconds, playback.duration);
  const selected = studio.current;
  const busy =
    isSaving ||
    studio.isOptimizing ||
    studio.isImportingBeat ||
    studio.persistStatus === 'saving' ||
    fxProcessing;
  const canEditLayers = !busy && !studio.isRecording;
  const isCleaningSelected =
    selected != null && studio.cleaningLayerIds.includes(selected.id);

  const beginScrub = useCallback(() => {
    wasPlayingRef.current = playback.isPlaying;
    if (playback.isPlaying) {
      playback.pause();
    }
    setScrubbing(true);
  }, [playback]);

  const scrubTo = useCallback(
    (seconds: number) => {
      playback.seekTo(seconds);
    },
    [playback],
  );

  const endScrub = useCallback(
    (seconds: number) => {
      playback.seekTo(seconds);
      setScrubbing(false);
      if (wasPlayingRef.current) {
        wasPlayingRef.current = false;
        playback.play();
      }
    },
    [playback],
  );

  const togglePlayback = useCallback(() => {
    if (!playback.hasTracks) {
      Alert.alert('Nothing to play', 'Record, add a beat, or unmute a layer first.');
      return;
    }
    playback.togglePlayback();
  }, [playback]);

  const toggleRecord = useCallback(() => {
    if (studio.isRecording) {
      recordingSessionService.requestStop();
      studio.handleStopPress();
      return;
    }
    playback.pause();
    studio.handleRecordPress('playhead', playback.currentTime);
  }, [playback, studio]);

  const save = useCallback(async () => {
    await studio.handleDone();
  }, [studio]);

  const discard = useCallback(() => {
    void studio.handleDiscard();
  }, [studio]);

  const overlayVisible =
    busy || isCleaningSelected || studio.cleaningLayerIds.length > 0;
  const overlayTitle =
    isSaving || studio.persistStatus === 'saving'
      ? 'Saving…'
      : fxProcessing
        ? 'Applying FX…'
        : studio.isImportingBeat
          ? 'Importing beat…'
          : studio.isOptimizing
            ? 'Finishing recording…'
            : 'Cleaning take…';

  const hasTake = studio.playbackTracks.length > 0 || studio.project.layers.some((l) => l.stemUri);

  return {
    studio,
    playback,
    duration,
    selected,
    busy,
    canEditLayers,
    isCleaningSelected,
    windowStartSeconds,
    setWindowStartSeconds,
    scrubbing,
    beginScrub,
    scrubTo,
    endScrub,
    togglePlayback,
    toggleRecord,
    save,
    discard,
    leave: leaveToHome,
    setFxProcessing,
    overlayVisible,
    overlayTitle,
    hasTake,
  };
}

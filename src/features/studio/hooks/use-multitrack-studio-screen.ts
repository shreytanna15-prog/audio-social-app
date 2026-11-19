import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { getErrorMessage } from '@/core/api/errors';
import {
  createLayer,
  hasMixableContent,
  nextLayerName,
} from '@/features/audio/domain/project';
import { useRecordingEditorUnsavedGuard } from '@/features/audio/hooks/use-recording-editor-unsaved-guard';
import { useStudioPlayback } from '@/features/audio/hooks/use-studio-playback';
import { PROJECT_VERSION, type AudioProject } from '@/features/audio/types/project';
import type { StudioSavePayload } from '@/features/audio/types/studio';
import { useMultitrackSession } from '@/features/studio/hooks/use-multitrack-session';
import { useMultitrackEntryStore } from '@/features/studio/store/multitrack-entry.store';
import { leaveStudioSession } from '@/features/studio/utils/leave-studio-session';
import { resolveStudioProjectId } from '@/features/studio/utils/resolve-studio-project-id';
import { useBackupTrack, useSaveTrackDraft } from '@/features/tracks';

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

/** Audio-only fingerprint — title/selection changes must not force re-backup. */
function audioFingerprint(project: AudioProject): string {
  return JSON.stringify({
    layers: project.layers.map((layer) => ({
      id: layer.id,
      kind: layer.kind,
      stemUri: layer.stemUri,
      sourceUri: layer.sourceUri ?? null,
      baselineUri: layer.baselineUri ?? null,
      muted: layer.muted,
      editChain: layer.editChain ?? null,
      captureFx: layer.captureFx ?? null,
      durationSeconds: layer.durationSeconds,
      offsetMs: layer.offsetMs,
    })),
  });
}

type SyncState = 'local' | 'syncing' | 'synced';

type UseMultitrackStudioScreenOptions = {
  confirmRemoveLayer?: (layerName: string, onConfirm: () => void) => void;
  confirmDiscardSession?: (onConfirm: () => void) => void;
};

/**
 * Composes multitrack session + mix playback + Save / cloud / Publish like SINGLE.
 */
export function useMultitrackStudioScreen(
  options: UseMultitrackStudioScreenOptions = {},
) {
  const { confirmRemoveLayer, confirmDiscardSession } = options;
  const { replace, dismissTo, back, canGoBack } = useRouter();
  const { projectId: projectIdParam } = useLocalSearchParams<{
    projectId?: string;
  }>();
  const resolvedProjectId = Array.isArray(projectIdParam)
    ? projectIdParam[0]
    : projectIdParam;
  const saveDraft = useSaveTrackDraft();
  const backup = useBackupTrack();

  const boot = useMemo(() => {
    const pending = useMultitrackEntryStore.getState().consumePendingEntry();
    if (pending) {
      return {
        project: pending.project,
        trackId: pending.trackId?.trim() || null,
        title: pending.title?.trim() || 'Untitled Session',
        storageState: pending.storageState ?? null,
      };
    }
    return {
      project: createPendingMultitrackProject(),
      trackId: null as string | null,
      title: 'Untitled Session',
      storageState: null as string | null,
    };
  }, []);

  const [trackId, setTrackId] = useState<string | null>(boot.trackId);
  const [title, setTitle] = useState(boot.title);
  const titleRef = useRef(title);
  titleRef.current = title;
  const bootTitleRef = useRef(boot.title);
  const trackIdRef = useRef(trackId);
  trackIdRef.current = trackId;

  const [isSaving, setIsSaving] = useState(false);
  const [fxProcessing, setFxProcessing] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>(
    boot.storageState === 'SYNCED' ? 'synced' : 'local',
  );
  const [syncedFingerprint, setSyncedFingerprint] = useState<string | null>(
    boot.storageState === 'SYNCED' ? audioFingerprint(boot.project) : null,
  );
  const mountedRef = useRef(true);
  const isLeavingRef = useRef(false);

  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    [],
  );

  const leaveToHome = useCallback(() => {
    leaveStudioSession(
      { back, canGoBack, dismissTo, replace },
      resolvedProjectId,
    );
  }, [back, canGoBack, dismissTo, replace, resolvedProjectId]);

  const leaveToLibrary = useCallback(() => {
    try {
      dismissTo('/(tabs)/library' as Href);
    } catch {
      replace('/(tabs)/library' as Href);
    }
  }, [dismissTo, replace]);

  const persistDraft = useCallback(
    async (project: AudioProject, titleOverride?: string) => {
      if (!hasMixableContent(project)) {
        throw new Error(
          'Nothing to save. Add or unmute at least one audio layer first.',
        );
      }

      const nextTitle =
        (titleOverride ?? titleRef.current).trim() || 'Untitled Session';
      const recording = await saveDraft.mutateAsync({
        project,
        kind: 'MULTI',
        title: nextTitle,
        projectId: resolveStudioProjectId(projectIdParam),
        trackId: trackIdRef.current ?? undefined,
      });

      setTrackId(recording.id);
      trackIdRef.current = recording.id;
      setTitle(nextTitle);
      titleRef.current = nextTitle;
      bootTitleRef.current = nextTitle;
      return { id: recording.id, title: nextTitle };
    },
    [projectIdParam, saveDraft],
  );

  const handleSave = useCallback(
    async (payload: StudioSavePayload): Promise<boolean> => {
      if (saveDraft.isPending || isSaving) {
        return false;
      }
      setIsSaving(true);
      try {
        await persistDraft(
          payload.project,
          payload.title?.trim() || titleRef.current,
        );
        return true;
      } catch (error) {
        Alert.alert(
          'Could not save',
          getErrorMessage(
            error,
            'Save failed. Check your connection and try again.',
          ),
        );
        return false;
      } finally {
        if (mountedRef.current) {
          setIsSaving(false);
        }
      }
    },
    [isSaving, persistDraft, saveDraft.isPending],
  );

  const studio = useMultitrackSession({
    initialProject: boot.project,
    isPending: true,
    isSaving: isSaving || saveDraft.isPending,
    onSave: handleSave,
    onClose: leaveToHome,
    onDiscard: leaveToHome,
    confirmRemoveLayer,
  });

  const playback = useStudioPlayback(
    studio.playbackTracks,
    studio.mixDuration,
    !studio.isRecording,
  );

  const [windowStartSeconds, setWindowStartSeconds] = useState(0);
  const [scrubbing, setScrubbing] = useState(false);
  const wasPlayingRef = useRef(false);
  const wasCleaningRef = useRef(false);

  const discard = useCallback(() => {
    // Covers title-dirty too — session isLeaving only gates audio dirty.
    isLeavingRef.current = true;
    void studio.handleDiscard();
  }, [studio]);

  const titleDirty =
    title.trim() !== (bootTitleRef.current.trim() || 'Untitled Session');
  const shouldPromptBeforeLeaving = useCallback(
    () =>
      !isLeavingRef.current &&
      (studio.shouldPromptBeforeLeaving() || titleDirty),
    [studio, titleDirty],
  );

  useRecordingEditorUnsavedGuard({
    enabled: true,
    shouldPrompt: shouldPromptBeforeLeaving,
    onSave: studio.persistPendingWork,
    title: 'Discard changes?',
    message: 'Unsaved changes to this session will be lost.',
    onPromptLeave: confirmDiscardSession
      ? () => {
          confirmDiscardSession(() => {
            void discard();
          });
        }
      : undefined,
  });

  // Transport / ruler end = unmuted mix only. Lane layout may still be longer
  // so muted clips remain visible past the audible end.
  const duration = studio.mixDuration;
  const layoutDuration = Math.max(studio.durationSeconds, studio.mixDuration);
  const selected = studio.current;
  const busy =
    isSaving ||
    saveDraft.isPending ||
    studio.isFinalizing ||
    studio.isOptimizing ||
    studio.isImportingBeat ||
    studio.persistStatus === 'saving' ||
    fxProcessing ||
    syncState === 'syncing';
  const canEditLayers = !busy && !studio.isRecording;
  const isCleaningSelected =
    selected != null && studio.cleaningLayerIds.includes(selected.id);

  const cleaningCount = studio.cleaningLayerIds.length;
  const isFinalizing = studio.isFinalizing;
  const consumePendingSeek = studio.consumePendingSeek;
  useEffect(() => {
    const cleaning = cleaningCount > 0 || isFinalizing;
    if (wasCleaningRef.current && !cleaning) {
      const seekTo = consumePendingSeek() ?? 0;
      playback.seekTo(seekTo);
    }
    wasCleaningRef.current = cleaning;
  }, [cleaningCount, consumePendingSeek, isFinalizing, playback]);

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
      studio.handleStopPress();
      return;
    }
    playback.pause();
    studio.handleRecordPress('playhead', playback.currentTime);
  }, [playback, studio]);

  const save = useCallback(async () => {
    if (busy || studio.isRecording) {
      return;
    }
    await studio.handleDone();
  }, [busy, studio]);

  const saveToCloud = useCallback(
    async (nextTitle: string) => {
      if (studio.isRecording || busy) {
        throw new Error('Finish editing before backing up.');
      }

      const trimmed = nextTitle.trim() || titleRef.current || 'Untitled Session';
      setTitle(trimmed);
      titleRef.current = trimmed;

      setSyncState('syncing');
      try {
        const ok = await studio.persistPendingWork();
        if (!ok) {
          throw new Error(
            'Nothing to save. Add or unmute at least one audio layer first.',
          );
        }
        const id = trackIdRef.current;
        if (!id) {
          throw new Error('Save failed before backup.');
        }
        const layerIds = studio.project.layers
          .filter((layer) => Boolean(layer.stemUri))
          .map((layer) => layer.id);
        await backup.mutateAsync({ trackId: id, layerIds });
        if (mountedRef.current) {
          setSyncedFingerprint(audioFingerprint(studio.project));
          setSyncState('synced');
        }
      } catch (error) {
        if (mountedRef.current) {
          setSyncState('local');
        }
        throw error;
      }
    },
    [backup, busy, studio],
  );

  const finishPublished = useCallback(() => {
    isLeavingRef.current = true;
    leaveToLibrary();
  }, [leaveToLibrary]);

  const requestLeave = useCallback(() => {
    if (!shouldPromptBeforeLeaving()) {
      isLeavingRef.current = true;
      leaveToHome();
      return;
    }
    if (confirmDiscardSession) {
      confirmDiscardSession(() => {
        void discard();
      });
      return;
    }
    Alert.alert('Discard changes?', 'Unsaved changes to this session will be lost.', [
      { text: 'Keep editing', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          void discard();
        },
      },
    ]);
  }, [confirmDiscardSession, discard, leaveToHome, shouldPromptBeforeLeaving]);

  const currentFingerprint = audioFingerprint(studio.project);
  const audioChangedSinceSync =
    syncState === 'synced' &&
    syncedFingerprint !== null &&
    syncedFingerprint !== currentFingerprint;
  const isSynced = syncState === 'synced' && !audioChangedSinceSync;

  const overlayVisible =
    busy || isCleaningSelected || studio.cleaningLayerIds.length > 0;
  const overlayTitle =
    isSaving || saveDraft.isPending || studio.persistStatus === 'saving'
      ? 'Saving…'
      : syncState === 'syncing'
        ? 'Uploading…'
        : fxProcessing
          ? 'Applying FX…'
          : studio.isImportingBeat
            ? 'Importing beat…'
            : 'Cleaning take…';

  const hasTake =
    studio.playbackTracks.length > 0 ||
    studio.project.layers.some((layer) => layer.stemUri);

  return {
    studio,
    playback,
    duration,
    layoutDuration,
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
    saveToCloud,
    finishPublished,
    discard,
    requestLeave,
    leave: leaveToHome,
    setFxProcessing,
    overlayVisible,
    overlayTitle,
    hasTake,
    title,
    setTitle,
    trackId,
    isSynced,
    isSyncing: syncState === 'syncing',
    isSaving: isSaving || saveDraft.isPending,
  };
}

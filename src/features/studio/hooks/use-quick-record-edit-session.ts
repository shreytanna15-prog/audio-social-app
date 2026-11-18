import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { getErrorMessage } from '@/core/api/errors';
import { hasRecordableContent } from '@/features/audio/domain/project';
import type { AudioProject } from '@/features/audio/types/project';
import { useQuickRecordSession } from '@/features/studio/hooks/use-quick-record-session';
import {
  fingerprintQuickRecordProject,
  useQuickRecordStore,
} from '@/features/studio/store/quick-record.store';
import { useStudioProjectContextStore } from '@/features/studio/store/studio-project-context.store';
import { leaveStudioSession } from '@/features/studio/utils/leave-studio-session';
import { resolveStudioProjectId } from '@/features/studio/utils/resolve-studio-project-id';
import { useBackupTrack, useSaveTrackDraft } from '@/features/tracks';

type SyncState = 'local' | 'syncing' | 'synced';

/**
 * Audio-only fingerprint: ignores the title and layer selection so that only
 * changes that affect the uploaded audio invalidate a successful sync.
 */
function audioFingerprint(project: AudioProject): string {
  return fingerprintQuickRecordProject({ ...project, selectedLayerId: null });
}

export function useQuickRecordEditSession() {
  const { back, canGoBack, replace, dismissTo } = useRouter();
  const {
    projectId: projectIdParam,
    storageState: storageStateParam,
    discardTarget,
    isNew: isNewParam,
  } = useLocalSearchParams<{
    projectId?: string;
    storageState?: string;
    discardTarget?: 'home' | 'library';
    /** Fresh import / new take — Discard should confirm even when fingerprint is clean. */
    isNew?: string;
  }>();
  const session = useQuickRecordSession();
  const resetStore = useQuickRecordStore((state) => state.reset);
  const trackId = useQuickRecordStore((state) => state.trackId);
  const saveDraft = useSaveTrackDraft();
  const backup = useBackupTrack();
  const [isSaving, setIsSaving] = useState(false);
  const [fxProcessing, setFxProcessing] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>(
    storageStateParam === 'SYNCED' ? 'synced' : 'local',
  );
  // Audio fingerprint captured when the take was last uploaded. If the audio
  // changes afterwards (FX, re-record), the cloud copy is stale and the track
  // must be backed up again before it can be published.
  const [syncedFingerprint, setSyncedFingerprint] = useState<string | null>(
    storageStateParam === 'SYNCED'
      ? audioFingerprint(useQuickRecordStore.getState().project)
      : null,
  );
  const mountedRef = useRef(true);
  // Prevents the empty-take guard from racing discard/save exit navigation.
  const isLeavingRef = useRef(false);
  // Import / library reopen: Discard chrome, no capture parent under this edit screen.
  const fromImport = !!discardTarget;
  const isNew =
    isNewParam === '1' || isNewParam === 'true' || isNewParam === 'yes';

  useEffect(
    () => () => {
      mountedRef.current = false;
    },
    [],
  );

  useEffect(() => {
    if (isLeavingRef.current || session.hasTake) {
      return;
    }
    // Capture flow only — import/library edit must never bounce to Quick Record.
    if (fromImport) {
      return;
    }
    replace('/studio/quick-record');
  }, [fromImport, replace, session.hasTake]);

  const goBackToCapture = useCallback(() => {
    if (
      session.isRecording ||
      session.isBusy ||
      fxProcessing ||
      isSaving ||
      syncState === 'syncing'
    ) {
      return;
    }
    if (canGoBack()) {
      back();
      return;
    }
    replace('/(tabs)');
  }, [
    back,
    canGoBack,
    fxProcessing,
    isSaving,
    replace,
    session.isBusy,
    session.isRecording,
    syncState,
  ]);

  const discardImported = useCallback(() => {
    isLeavingRef.current = true;
    const target = discardTarget === 'library' ? '/(tabs)/library' : '/(tabs)';
    resetStore();
    useStudioProjectContextStore.getState().clearProjectId();
    try {
      dismissTo(target as Href);
    } catch {
      replace(target as Href);
    }
  }, [dismissTo, replace, resetStore, discardTarget]);

  /** Persist the take locally + create/update the draft track. Returns its id. */
  const persistDraft = useCallback(
    async (titleOverride?: string): Promise<{ id: string; title: string }> => {
      await session.awaitSoftCleanQueue();
      const latest = useQuickRecordStore.getState().project;

      if (!hasRecordableContent(latest)) {
        throw new Error('Nothing to save. Record a take first.');
      }

      const layer =
        latest.layers.find((item) => item.id === latest.selectedLayerId) ??
        latest.layers[0];

      if (!layer?.stemUri) {
        throw new Error('Nothing to save. Record a take first.');
      }

      const store = useQuickRecordStore.getState();
      const title = (titleOverride ?? store.title).trim() || 'Untitled take';
      const projectId = resolveStudioProjectId(projectIdParam);

      const recording = await saveDraft.mutateAsync({
        project: latest,
        mixdownUri: layer.stemUri,
        title,
        kind: 'SINGLE',
        projectId,
        trackId: store.trackId ?? undefined,
      });

      useQuickRecordStore.getState().setTrackId(recording.id);
      // Keep the in-memory title in sync without re-hitting the API.
      useQuickRecordStore.setState({ title });
      return { id: recording.id, title };
    },
    [projectIdParam, saveDraft, session],
  );

  const save = useCallback(async () => {
    if (
      session.isRecording ||
      session.isBusy ||
      isSaving ||
      syncState === 'syncing' ||
      saveDraft.isPending
    ) {
      return false;
    }

    setIsSaving(true);
    try {
      await persistDraft();
      isLeavingRef.current = true;
      resetStore();
      leaveStudioSession(
        { back, canGoBack, dismissTo, replace },
        resolveStudioProjectId(projectIdParam),
        { unwindToProject: Boolean(projectIdParam) },
      );
      return true;
    } catch (error) {
      console.log('Quick Record save failed:', error);
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
  }, [
    back,
    canGoBack,
    dismissTo,
    isSaving,
    persistDraft,
    projectIdParam,
    replace,
    resetStore,
    saveDraft.isPending,
    session.isBusy,
    session.isRecording,
    syncState,
  ]);

  /** Save the draft locally + metadata, then upload audio so the track is SYNCED. */
  const saveToCloud = useCallback(
    async (title: string) => {
      if (session.isRecording || session.isBusy || isSaving) {
        throw new Error('Finish editing before backing up.');
      }

      setSyncState('syncing');
      try {
        const saved = await persistDraft(title);
        await backup.mutateAsync({ trackId: saved.id });
        if (mountedRef.current) {
          setSyncedFingerprint(
            audioFingerprint(useQuickRecordStore.getState().project),
          );
          setSyncState('synced');
        }
      } catch (error) {
        if (mountedRef.current) {
          setSyncState('local');
        }
        throw error;
      }
    },
    [backup, isSaving, persistDraft, session],
  );

  const finishPublished = useCallback(() => {
    isLeavingRef.current = true;
    resetStore();
    useStudioProjectContextStore.getState().clearProjectId();
    try {
      dismissTo('/(tabs)/library' as Href);
    } catch {
      replace('/(tabs)/library' as Href);
    }
  }, [dismissTo, replace, resetStore]);

  const currentFingerprint = audioFingerprint(session.project);
  const audioChangedSinceSync =
    syncState === 'synced' &&
    syncedFingerprint !== null &&
    syncedFingerprint !== currentFingerprint;
  const isSynced = syncState === 'synced' && !audioChangedSinceSync;

  const overlayTitle = isSaving
    ? 'Saving…'
    : fxProcessing
      ? 'Applying FX…'
      : session.isOptimizing
        ? 'Finishing recording…'
        : 'Cleaning take…';

  const overlayVisible = useMemo(
    () => session.isBusy || fxProcessing || isSaving,
    [fxProcessing, isSaving, session.isBusy],
  );

  return {
    ...session,
    trackId,
    isSaving: isSaving || saveDraft.isPending,
    isSyncing: syncState === 'syncing',
    isSynced,
    fxProcessing,
    setFxProcessing,
    overlayTitle,
    overlayVisible,
    save,
    saveToCloud,
    finishPublished,
    goBackToCapture,
    fromImport,
    isNew,
    discardTarget: discardTarget === 'library' || discardTarget === 'home'
      ? discardTarget
      : undefined,
    discardImported,
  };
}

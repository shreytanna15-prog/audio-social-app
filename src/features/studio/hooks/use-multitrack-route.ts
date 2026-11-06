import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { getErrorMessage } from '@/core/api/errors';
import { discardPreviewRecording } from '@/features/audio/data/recording-repository';
import { loadProjectById, updateProject } from '@/features/audio/data/project-repository';
import {
  createEmptyProject,
  createImportLayerProject,
} from '@/features/audio/domain/project';
import { peakBarCountForDuration } from '@/features/audio/domain/timeline';
import { extractPeaksFromWav } from '@/features/audio/services/peak-extract.service';
import type { RecordingEditorRouteParams } from '@/features/audio/types/recording-editor-route';
import type { AudioProject } from '@/features/audio/types/project';
import type { StudioEditorProps, StudioSavePayload } from '@/features/audio/types/studio';
import { useSaveTrackDraft } from '@/features/tracks';
import { hasLocalProject } from '@/features/tracks/utils/resolve-local-track';

type StudioReadyState = {
  status: 'ready';
  editor: StudioEditorProps;
};

export type MultitrackRouteState =
  | { status: 'loading' }
  | { status: 'error' }
  | StudioReadyState;

/** @deprecated Prefer `MultitrackRouteState`. */
export type StudioRouteState = MultitrackRouteState;

export function useMultitrackRoute(): MultitrackRouteState {
  const router = useRouter();
  const { id, uri, duration, sourcePreGateUri } =
    useLocalSearchParams<RecordingEditorRouteParams>();

  const saveDraft = useSaveTrackDraft();
  const isSaving = saveDraft.isPending;
  const isPending = id === 'new';
  const trackId = isPending ? null : String(id);

  const [initialProject, setInitialProject] = useState<AudioProject | null>(null);
  const [projectReady, setProjectReady] = useState(false);
  const [trackTitle, setTrackTitle] = useState('Untitled session');
  const loadedKeyRef = useRef<string | null>(null);
  const pendingUri = Array.isArray(uri) ? uri[0] : uri;
  const pendingSource = Array.isArray(sourcePreGateUri)
    ? sourcePreGateUri[0]
    : sourcePreGateUri;
  const loadKey = isPending
    ? `pending:${pendingUri ?? ''}:${duration ?? ''}:${pendingSource ?? ''}`
    : `saved:${id}`;

  useEffect(() => {
    let cancelled = false;

    async function resolveProject(): Promise<void> {
      if (!isPending && trackId) {
        if (!hasLocalProject(trackId)) {
          if (!cancelled) {
            loadedKeyRef.current = loadKey;
            setInitialProject(null);
            setProjectReady(true);
          }
          return;
        }

        const loaded = await loadProjectById(trackId);
        if (!cancelled) {
          loadedKeyRef.current = loadKey;
          setInitialProject(loaded);
          setTrackTitle('Untitled session');
          setProjectReady(true);
        }
        return;
      }

      const durationSeconds = Number(duration ?? 0);

      if (!pendingUri) {
        if (!cancelled) {
          loadedKeyRef.current = loadKey;
          setInitialProject(createEmptyProject());
          setProjectReady(true);
        }
        return;
      }

      const peaks = await extractPeaksFromWav(
        pendingUri,
        peakBarCountForDuration(
          Number.isNaN(durationSeconds) ? 0 : durationSeconds,
        ),
      );
      if (cancelled) {
        return;
      }

      loadedKeyRef.current = loadKey;
      setInitialProject(
        createImportLayerProject({
          stemUri: pendingUri,
          sourceUri: pendingSource || pendingUri,
          durationSeconds: Number.isNaN(durationSeconds) ? 0 : durationSeconds,
          peaks,
        }),
      );
      setProjectReady(true);
    }

    if (loadedKeyRef.current === loadKey) {
      return;
    }

    setProjectReady(false);
    void resolveProject();

    return () => {
      cancelled = true;
    };
  }, [
    duration,
    id,
    isPending,
    loadKey,
    pendingSource,
    pendingUri,
    trackId,
  ]);

  const leave = useCallback(() => {
    router.replace('/(tabs)');
  }, [router]);

  const handleSave = useCallback(
    async (payload: StudioSavePayload): Promise<boolean> => {
      if (saveDraft.isPending) {
        return false;
      }

      try {
        await saveDraft.mutateAsync({
          project: payload.project,
          mixdownUri: payload.mixdownUri,
          kind: 'MULTI',
          title: payload.title?.trim() || trackTitle || 'Untitled session',
          trackId: trackId ?? undefined,
        });
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
      }
    },
    [saveDraft, trackId, trackTitle],
  );

  const handlePersist = useCallback(
    async (payload: StudioSavePayload): Promise<boolean> => {
      if (isPending || !trackId) {
        return false;
      }

      try {
        await updateProject({
          id: trackId,
          project: payload.project,
          mixdownUri: payload.mixdownUri,
          kind: 'MULTI',
          title: payload.title?.trim() || trackTitle || 'Untitled session',
          keepSourceFiles: true,
          skipIndex: true,
        });
        return true;
      } catch {
        return false;
      }
    },
    [isPending, trackId, trackTitle],
  );

  const handleDiscard = useCallback(async () => {
    if (isPending && initialProject) {
      for (const layer of initialProject.layers) {
        await discardPreviewRecording(layer.stemUri ?? '', layer.sourceUri);
      }
    }

    leave();
  }, [initialProject, isPending, leave]);

  if (!projectReady) {
    return { status: 'loading' };
  }

  if (!initialProject) {
    return { status: 'error' };
  }

  return {
    status: 'ready',
    editor: {
      initialProject,
      title: isPending ? 'New recording' : trackTitle,
      isPending,
      recordingId: trackId,
      isSaving,
      onSave: handleSave,
      onPersist: isPending ? undefined : handlePersist,
      onClose: leave,
      onDiscard: handleDiscard,
    },
  };
}

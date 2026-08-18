import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { discardPreviewRecording } from '@/features/audio/data/recording-repository';
import { loadProjectForRecording } from '@/features/audio/data/project-repository';
import {
  createEmptyProject,
  createImportLayerProject,
} from '@/features/audio/domain/project';
import { peakBarCountForDuration } from '@/features/audio/domain/timeline';
import { extractPeaksFromWav } from '@/features/audio/services/peak-extract.service';
import { useRecordingsStore } from '@/features/audio/store';
import type { RecordingEditorRouteParams } from '@/features/audio/types/recording-editor-route';
import type { AudioProject } from '@/features/audio/types/project';
import type { StudioEditorProps, StudioSavePayload } from '@/features/audio/types/studio';

type StudioReadyState = {
  status: 'ready';
  editor: StudioEditorProps;
};

export type StudioRouteState =
  | { status: 'loading' }
  | { status: 'error' }
  | StudioReadyState;

export function useStudioRoute(): StudioRouteState {
  const router = useRouter();
  const { id, uri, duration, sourcePreGateUri } =
    useLocalSearchParams<RecordingEditorRouteParams>();

  const recordings = useRecordingsStore((state) => state.recordings);
  const isLoading = useRecordingsStore((state) => state.isLoading);
  const isSaving = useRecordingsStore((state) => state.isSaving);
  const saveProject = useRecordingsStore((state) => state.saveProject);
  const updateProject = useRecordingsStore((state) => state.updateProject);
  const persistProject = useRecordingsStore((state) => state.persistProject);
  const isPending = id === 'new';

  const savedRecording = useMemo(() => {
    if (isPending) {
      return null;
    }
    return recordings.find((recording) => recording.id === id) ?? null;
  }, [id, isPending, recordings]);

  const [initialProject, setInitialProject] = useState<AudioProject | null>(null);
  const [projectReady, setProjectReady] = useState(false);
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
      if (!isPending && isLoading) {
        return;
      }

      if (!isPending) {
        if (!savedRecording) {
          if (!cancelled) {
            loadedKeyRef.current = loadKey;
            setInitialProject(null);
            setProjectReady(true);
          }
          return;
        }

        const loaded = await loadProjectForRecording(savedRecording);
        if (!cancelled) {
          loadedKeyRef.current = loadKey;
          setInitialProject(loaded);
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
        peakBarCountForDuration(Number.isNaN(durationSeconds) ? 0 : durationSeconds),
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

    // Auto-save replaces `savedRecording` in the store. Reloading here would
    // unmount the studio and flash a spinner after every take.
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
    isLoading,
    isPending,
    loadKey,
    pendingSource,
    pendingUri,
    savedRecording?.id,
  ]);

  const leave = useCallback(() => {
    router.dismissTo('/audio');
  }, [router]);

  const handleSave = useCallback(
    async (payload: StudioSavePayload): Promise<boolean> => {
      if (isSaving) {
        return false;
      }

      const saved = isPending
        ? await saveProject(payload)
        : await updateProject({ id, ...payload });

      return saved != null;
    },
    [id, isPending, isSaving, saveProject, updateProject],
  );

  const handlePersist = useCallback(
    async (payload: StudioSavePayload): Promise<boolean> => {
      if (isPending || !id) {
        return false;
      }

      const persisted = await persistProject({ id, ...payload });
      return persisted != null;
    },
    [id, isPending, persistProject],
  );

  const handleDiscard = useCallback(async () => {
    if (isPending && initialProject) {
      for (const layer of initialProject.layers) {
        await discardPreviewRecording(layer.stemUri ?? '', layer.sourceUri);
      }
    }

    leave();
  }, [initialProject, isPending, leave]);

  const recordingIndex = recordings.findIndex((item) => item.id === id);

  if (!isPending && isLoading && !projectReady) {
    return { status: 'loading' };
  }

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
      title: isPending
        ? 'New recording'
        : `Recording ${recordingIndex + 1}`,
      isPending,
      recordingId: isPending ? null : String(id),
      isSaving,
      onSave: handleSave,
      onPersist: isPending ? undefined : handlePersist,
      onClose: leave,
      onDiscard: handleDiscard,
    },
  };
}

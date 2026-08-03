import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';

import { discardPreviewRecording } from '@/features/audio/data/recording-repository';
import {
  resolveBaselineRecordingUri,
  resolvePristineRecordingUri,
} from '@/features/audio/utils/recording-paths';

import type { RecordingEditorRouteParams } from '@/features/audio/types/recording-editor-route';
import type { RecordingEditorProps } from '@/features/audio/types/recording-editor';
import type { RecordingEditorSavePayload } from '@/features/audio/types/recording-editor-save';
import { useRecordingsStore } from '@/features/audio/store';

type RecordingEditorReadyState = {
  status: 'ready';
  editor: RecordingEditorProps;
};

export type RecordingEditorRouteState =
  | { status: 'loading' }
  | { status: 'error' }
  | RecordingEditorReadyState;

export function useRecordingEditorRoute(): RecordingEditorRouteState {
  const router = useRouter();
  const { id, uri, duration, sourcePreGateUri } =
    useLocalSearchParams<RecordingEditorRouteParams>();

  const recordings = useRecordingsStore((state) => state.recordings);
  const isLoading = useRecordingsStore((state) => state.isLoading);
  const isSaving = useRecordingsStore((state) => state.isSaving);
  const saveRecording = useRecordingsStore((state) => state.saveRecording);
  const updateRecording = useRecordingsStore((state) => state.updateRecording);
  const isPending = id === 'new';

  const savedRecording = useMemo(() => {
    if (isPending) {
      return null;
    }
    return recordings.find((recording) => recording.id === id) ?? null;
  }, [id, isPending, recordings]);

  const playbackUri = isPending ? uri : savedRecording?.uri;

  const pristineUri = isPending
    ? uri
    : savedRecording
      ? resolveBaselineRecordingUri(savedRecording) ?? savedRecording.uri
      : undefined;

  const resolvedSourcePreGateUri = (() => {
    if (isPending) {
      const raw = Array.isArray(sourcePreGateUri)
        ? sourcePreGateUri[0]
        : sourcePreGateUri;
      return raw || null;
    }

    return savedRecording ? resolvePristineRecordingUri(savedRecording) : null;
  })();

  const initialEditChain = savedRecording?.editChain;

  const durationSeconds = isPending
    ? Number(duration ?? 0)
    : (savedRecording?.duration ?? 0);

  const recordingIndex = recordings.findIndex((item) => item.id === id);

  const handleSave = useCallback(
    async ({
      sourceUri,
      baselineUri,
      editChain,
      sourcePreGateUri: saveSourcePreGateUri,
    }: RecordingEditorSavePayload): Promise<boolean> => {
      if (isSaving) {
        return false;
      }

      const saved = isPending
        ? await saveRecording({
            sourceUri,
            baselineUri,
            durationSeconds,
            editChain,
            sourcePreGateUri: saveSourcePreGateUri ?? resolvedSourcePreGateUri,
          })
        : await updateRecording({
            id,
            sourceUri,
            baselineUri,
            durationSeconds,
            editChain,
            sourcePreGateUri: saveSourcePreGateUri ?? resolvedSourcePreGateUri,
          });

      if (saved) {
        router.back();
        return true;
      }

      return false;
    },
    [
      durationSeconds,
      id,
      isPending,
      isSaving,
      resolvedSourcePreGateUri,
      router,
      saveRecording,
      updateRecording,
    ],
  );

  const handleDiscard = useCallback(async () => {
    if (isPending && playbackUri) {
      await discardPreviewRecording(playbackUri, resolvedSourcePreGateUri);
    }

    router.back();
  }, [isPending, playbackUri, resolvedSourcePreGateUri, router]);

  if (!isPending && isLoading) {
    return { status: 'loading' };
  }

  if (!playbackUri || !pristineUri || Number.isNaN(durationSeconds)) {
    return { status: 'error' };
  }

  return {
    status: 'ready',
    editor: {
      source: {
        pristineUri,
        playbackUri,
        sourcePreGateUri: resolvedSourcePreGateUri,
        initialEditChain,
      },
      title: isPending
        ? 'Review your recording'
        : `Recording ${recordingIndex + 1}`,
      durationSeconds,
      isPending,
      isSaving,
      onSave: handleSave,
      onDiscard: handleDiscard,
    },
  };
}

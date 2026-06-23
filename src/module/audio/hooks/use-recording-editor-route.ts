import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';

import { useRecordings } from '@/module/audio/context';
import { discardPreviewRecording } from '@/module/audio/data/recording-repository';
import type {
  RecordingEditorMode,
  RecordingEditorRouteParams,
} from '@/module/audio/types/recording-editor-route';

type RecordingEditorReadyState = {
  status: 'ready';
  mode: RecordingEditorMode;
  originalUri: string;
  durationSeconds: number;
  screenTitle: string;
  contentTitle: string;
  isSaving: boolean;
  onSave: (sourceUri: string) => Promise<void>;
  onDiscard: () => Promise<void>;
};

export type RecordingEditorRouteState =
  | { status: 'loading' }
  | { status: 'error' }
  | RecordingEditorReadyState;

export function useRecordingEditorRoute(): RecordingEditorRouteState {
  const router = useRouter();
  const { id, uri, duration } = useLocalSearchParams<RecordingEditorRouteParams>();
  const { recordings, isLoading, isSaving, saveRecording } = useRecordings();

  const isPending = id === 'new';

  const savedRecording = useMemo(
    () => (isPending ? null : recordings.find((recording) => recording.id === id) ?? null),
    [id, isPending, recordings],
  );

  const originalUri = isPending ? uri : savedRecording?.uri;
  const durationSeconds = isPending
    ? Number(duration ?? 0)
    : (savedRecording?.duration ?? 0);

  const recordingIndex = useMemo(
    () => recordings.findIndex((item) => item.id === id),
    [id, recordings],
  );

  const handleSave = useCallback(
    async (sourceUri: string) => {
      if (isSaving) {
        return;
      }

      const saved = await saveRecording({
        sourceUri,
        durationSeconds,
      });

      if (saved) {
        router.back();
      }
    },
    [durationSeconds, isSaving, router, saveRecording],
  );

  const handleDiscard = useCallback(async () => {
    if (isPending && originalUri) {
      await discardPreviewRecording(originalUri);
    }

    router.back();
  }, [isPending, originalUri, router]);

  if (!isPending && isLoading) {
    return { status: 'loading' };
  }

  if (!originalUri || Number.isNaN(durationSeconds)) {
    return { status: 'error' };
  }

  return {
    status: 'ready',
    mode: isPending ? 'pending' : 'saved',
    originalUri,
    durationSeconds,
    screenTitle: isPending ? 'New recording' : 'Edit recording',
    contentTitle: isPending
      ? 'Review your recording'
      : `Recording ${recordingIndex + 1}`,
    isSaving,
    onSave: handleSave,
    onDiscard: handleDiscard,
  };
}

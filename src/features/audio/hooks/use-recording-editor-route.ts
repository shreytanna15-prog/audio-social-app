import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo } from "react";

import { discardPreviewRecording } from "@/features/audio/data/recording-repository";
import { resolvePristineRecordingUri } from "@/features/audio/utils/recording-paths";
import { isKnownRecordingMode } from "@/features/audio/types/recording-mode";

import type { RecordingEditorRouteParams } from "@/features/audio/types/recording-editor-route";
import type { RecordingEditorProps } from "@/features/audio/types/recording-editor";
import type { RecordingEditorSavePayload } from "@/features/audio/types/recording-editor-save";
import { useRecordingsStore } from "@/features/audio/store";

type RecordingEditorReadyState = {
  status: "ready";
  editor: RecordingEditorProps;
};

export type RecordingEditorRouteState =
  | { status: "loading" }
  | { status: "error" }
  | RecordingEditorReadyState;

export function useRecordingEditorRoute(): RecordingEditorRouteState {
  const router = useRouter();
  const { id, uri, duration, recordingMode } =
    useLocalSearchParams<RecordingEditorRouteParams>();

  const recordings = useRecordingsStore((state) => state.recordings);
  const isLoading = useRecordingsStore((state) => state.isLoading);
  const isSaving = useRecordingsStore((state) => state.isSaving);
  const saveRecording = useRecordingsStore((state) => state.saveRecording);
  const updateRecording = useRecordingsStore((state) => state.updateRecording);
  const isPending = id === "new";

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
      ? resolvePristineRecordingUri(savedRecording)
      : undefined;

  const initialAppliedEffects = savedRecording?.appliedEffects ?? [];

  const durationSeconds = isPending
    ? Number(duration ?? 0)
    : (savedRecording?.duration ?? 0);

  const recordingIndex = recordings.findIndex((item) => item.id === id);

  const handleSave = useCallback(
    async ({ sourceUri, appliedEffects }: RecordingEditorSavePayload) => {
      if (isSaving) return;

      const saved = isPending
        ? await saveRecording({ sourceUri, durationSeconds, appliedEffects })
        : await updateRecording({
            id,
            sourceUri,
            durationSeconds,
            appliedEffects,
          });

      if (saved) {
        router.back();
      }
    },
    [
      durationSeconds,
      id,
      isPending,
      isSaving,
      router,
      saveRecording,
      updateRecording,
    ],
  );

  const handleDiscard = useCallback(async () => {
    if (isPending && playbackUri) {
      await discardPreviewRecording(playbackUri);
    }

    router.back();
  }, [isPending, playbackUri, router]);

  if (!isPending && isLoading) {
    return { status: "loading" };
  }

  if (!playbackUri || !pristineUri || Number.isNaN(durationSeconds)) {
    return { status: "error" };
  }

  const editorRecordingMode = (() => {
    const rawMode = Array.isArray(recordingMode) ? recordingMode[0] : recordingMode;

    if (isKnownRecordingMode(rawMode)) {
      return rawMode;
    }

    return null;
  })();

  return {
    status: "ready",
    editor: {
      source: {
        pristineUri,
        playbackUri,
        initialAppliedEffects,
        recordingMode: editorRecordingMode,
      },
      title: isPending
        ? "Review your recording"
        : `Recording ${recordingIndex + 1}`,
      durationSeconds,
      isPending,
      isSaving,
      onSave: handleSave,
      onDiscard: handleDiscard,
    },
  };
}

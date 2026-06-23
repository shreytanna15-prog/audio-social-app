import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo } from "react";

import { resolvePristineRecordingUri } from "@/module/audio/data/recording-paths";
import { discardPreviewRecording } from "@/module/audio/data/recording-repository";

import type {
  RecordingEditorMode,
  RecordingEditorRouteParams,
} from "@/module/audio/types/recording-editor-route";
import type { RecordingEditorSavePayload } from "@/module/audio/types/recording-editor-save";
import { useRecordings } from "@/store";

type RecordingEditorReadyState = {
  status: "ready";
  mode: RecordingEditorMode;
  pristineUri: string;
  playbackUri: string;
  initialAppliedEffects: RecordingEditorSavePayload["appliedEffects"];
  durationSeconds: number;
  screenTitle: string;
  contentTitle: string;
  isSaving: boolean;
  onSave: (payload: RecordingEditorSavePayload) => Promise<void>;
  onDiscard: () => Promise<void>;
};

export type RecordingEditorRouteState =
  | { status: "loading" }
  | { status: "error" }
  | RecordingEditorReadyState;

export function useRecordingEditorRoute(): RecordingEditorRouteState {
  const router = useRouter();
  const { id, uri, duration } =
    useLocalSearchParams<RecordingEditorRouteParams>();

  const { recordings, isLoading, isSaving, saveRecording, updateRecording } =
    useRecordings();
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

  return {
    status: "ready",
    mode: isPending ? "pending" : "saved",
    pristineUri,
    playbackUri,
    initialAppliedEffects,
    durationSeconds,
    screenTitle: isPending ? "New recording" : "Edit recording",
    contentTitle: isPending
      ? "Review your recording"
      : `Recording ${recordingIndex + 1}`,
    isSaving,
    onSave: handleSave,
    onDiscard: handleDiscard,
  };
}

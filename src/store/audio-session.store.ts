import { useMemo } from "react";
import { Alert } from "react-native";
import { create } from "zustand";

import {
  discardPreviewRecording,
  stagePreviewRecording,
} from "@/module/audio/data/recording-repository";
import {
  INITIAL_METERING_BARS,
  METERING_BAR_COUNT,
  buildRecorderSyncPatch,
  type RecorderTick,
} from "@/module/audio/domain/recorder-session.helpers";
import { recorderService } from "@/module/audio/services/recorder.service";
import type { RecorderStatus } from "@/module/audio/types/recorder";

export { METERING_BAR_COUNT } from "@/module/audio/domain/recorder-session.helpers";
export type { RecorderStatus } from "@/module/audio/types/recorder";

let frozenDurationMillis = 0;

export type AudioSessionState = {
  status: RecorderStatus;
  timerSeconds: number;
  meteringBars: number[];
  previewUri: string | null;
  hasActiveSession: boolean;
  isPaused: boolean;
  handleMainAction: () => Promise<void>;
  handlePauseResume: () => void;
  resetSession: () => Promise<void>;
  handoffToEditor: () => void;
};

export type AudioSessionContextValue = AudioSessionState;

type AudioSessionActions = {
  initialize: () => Promise<void>;
  syncRecorderState: (recorderState: RecorderTick) => void;
  startRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => Promise<void>;
};

type AudioSessionStore = AudioSessionState & AudioSessionActions;

export const useAudioSessionStore = create<AudioSessionStore>((set, get) => ({
  status: "idle",
  timerSeconds: 0,
  meteringBars: INITIAL_METERING_BARS,
  previewUri: null,
  hasActiveSession: false,
  isPaused: false,

  initialize: async () => {
    const granted = await recorderService.initialize();

    if (!granted) {
      Alert.alert(
        "Permission required",
        "Microphone access is needed to record audio.",
      );
    }
  },

  syncRecorderState: (recorderState) => {
    const session = get();
    const patch = buildRecorderSyncPatch(
      recorderState,
      session,
      frozenDurationMillis,
    );

    if (
      patch.timerSeconds === session.timerSeconds &&
      patch.status === session.status &&
      patch.meteringBars === session.meteringBars
    ) {
      return;
    }

    set(patch);
  },

  startRecording: async () => {
    const { previewUri } = get();

    if (previewUri) {
      await discardPreviewRecording(previewUri);
    }

    set({
      previewUri: null,
      isPaused: false,
      hasActiveSession: true,
      meteringBars: Array(METERING_BAR_COUNT).fill(0.15),
      status: "recording",
    });

    await recorderService.prepareAndRecord();
  },

  pauseRecording: () => {
    const { hasActiveSession, isPaused } = get();
    if (!hasActiveSession || isPaused) return;

    recorderService.pause();
    set({
      isPaused: true,
      status: "paused",
    });
  },

  resumeRecording: () => {
    const { hasActiveSession, isPaused } = get();
    if (!hasActiveSession || !isPaused) return;

    recorderService.resume();
    set({
      isPaused: false,
      status: "recording",
    });
  },

  stopRecording: async () => {
    const { hasActiveSession } = get();
    if (!hasActiveSession) return;

    const { uri, durationMillis } = await recorderService.stop();
    frozenDurationMillis = durationMillis;

    if (uri) {
      try {
        const stagedUri = await stagePreviewRecording(uri);
        set({
          previewUri: stagedUri,
          hasActiveSession: false,
          isPaused: false,
          status: "preview",
          timerSeconds: Math.floor(frozenDurationMillis / 1000),
        });
        return;
      } catch (error) {
        console.log("Error staging preview recording:", error);
        Alert.alert("Error", "Could not prepare recording for preview.");
      }
    }

    set({
      previewUri: null,
      hasActiveSession: false,
      isPaused: false,
      status: "idle",
      timerSeconds: 0,
    });
  },

  resetSession: async () => {
    const { hasActiveSession, previewUri } = get();

    if (hasActiveSession) {
      await recorderService.stopIfActive();
    }

    if (previewUri) {
      await discardPreviewRecording(previewUri);
    }

    frozenDurationMillis = 0;

    set({
      hasActiveSession: false,
      isPaused: false,
      previewUri: null,
      meteringBars: Array(METERING_BAR_COUNT).fill(0.15),
      timerSeconds: 0,
      status: "idle",
    });
  },

  handoffToEditor: () => {
    frozenDurationMillis = 0;

    set({
      hasActiveSession: false,
      isPaused: false,
      previewUri: null,
      meteringBars: Array(METERING_BAR_COUNT).fill(0.15),
      timerSeconds: 0,
      status: "idle",
    });
  },

  handleMainAction: async () => {
    const { hasActiveSession, stopRecording, startRecording } = get();

    if (hasActiveSession) {
      await stopRecording();
      return;
    }

    await startRecording();
  },

  handlePauseResume: () => {
    const { isPaused, resumeRecording, pauseRecording } = get();

    if (isPaused) {
      resumeRecording();
      return;
    }

    pauseRecording();
  },
}));

export function useAudioSession(): AudioSessionState {
  const status = useAudioSessionStore((state) => state.status);
  const timerSeconds = useAudioSessionStore((state) => state.timerSeconds);
  const meteringBars = useAudioSessionStore((state) => state.meteringBars);
  const previewUri = useAudioSessionStore((state) => state.previewUri);
  const hasActiveSession = useAudioSessionStore(
    (state) => state.hasActiveSession,
  );
  const isPaused = useAudioSessionStore((state) => state.isPaused);
  const handleMainAction = useAudioSessionStore(
    (state) => state.handleMainAction,
  );
  const handlePauseResume = useAudioSessionStore(
    (state) => state.handlePauseResume,
  );
  const resetSession = useAudioSessionStore((state) => state.resetSession);
  const handoffToEditor = useAudioSessionStore(
    (state) => state.handoffToEditor,
  );

  return useMemo(
    () => ({
      status,
      timerSeconds,
      meteringBars,
      previewUri,
      hasActiveSession,
      isPaused,
      handleMainAction,
      handlePauseResume,
      resetSession,
      handoffToEditor,
    }),
    [
      status,
      timerSeconds,
      meteringBars,
      previewUri,
      hasActiveSession,
      isPaused,
      handleMainAction,
      handlePauseResume,
      resetSession,
      handoffToEditor,
    ],
  );
}

import { Alert } from "react-native";
import { create } from "zustand";

import { discardPreviewRecording, stagePreviewRecording } from "@/module/audio/data/recording-repository";
import { recorderService } from "@/module/audio/services/recorder.service";
import {
  INITIAL_METERING_BARS,
  METERING_BAR_COUNT,
  buildRecorderSyncPatch,
  type RecorderTick,
} from "@/module/audio/domain/recorder-session.helpers";
import type { RecorderStatus } from "@/module/audio/types/recorder";
export { METERING_BAR_COUNT } from "@/module/audio/domain/recorder-session.helpers";

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
};

type AudioSessionStore = AudioSessionState & AudioSessionActions;

const START_RECORDING_STATE: Partial<AudioSessionState> = {
  previewUri: null,
  isPaused: false,
  hasActiveSession: true,
  meteringBars: Array(METERING_BAR_COUNT).fill(0.15),
  status: "recording",
};

const IDEL_RECORDING_STATE: Partial<AudioSessionState> = {
  isPaused: false,
  hasActiveSession: false,
  previewUri: null,
  status: "idle",
  timerSeconds: 0,
};

const stopRecording = async (): Promise<{
  frozenDurationMillis: number;
  stagedUri: string;
} | null> => {
  const { uri, durationMillis } = await recorderService.stop();
  frozenDurationMillis = durationMillis;

  if (uri) {
    try {
      const stagedUri = await stagePreviewRecording(uri);

      return { frozenDurationMillis, stagedUri };
    } catch (error) {
      console.log("Error staging preview recording:", error);
      Alert.alert("Error", "Could not prepare recording for preview.");
      return null;
    }
  }

  return null;
};

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
      meteringBars: Array(METERING_BAR_COUNT).fill(0.15),
      ...IDEL_RECORDING_STATE,
    });
  },

  handoffToEditor: () => {
    frozenDurationMillis = 0;

    set({
      meteringBars: Array(METERING_BAR_COUNT).fill(0.15),
      ...IDEL_RECORDING_STATE,
    });
  },

  handleMainAction: async () => {
    const { hasActiveSession, previewUri } = get();

    if (hasActiveSession) {
      set({
        hasActiveSession: false,
        isPaused: false,
        status: "optimizing",
      });

      // Let the optimizing overlay paint before heavy FFmpeg work starts.
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });

      const result = await stopRecording();

      if (result) {
        set({
          previewUri: result.stagedUri,
          hasActiveSession: false,
          isPaused: false,
          status: "preview",
          timerSeconds: Math.floor(result.frozenDurationMillis / 1000),
        });
        return;
      }
      set(IDEL_RECORDING_STATE);
      return;
    }

    if (previewUri) {
      await discardPreviewRecording(previewUri);
    }

    set(START_RECORDING_STATE);

    await recorderService.prepareAndRecord();
  },

  handlePauseResume: () => {
    const { isPaused, hasActiveSession } = get();
    if (!hasActiveSession) return;

    if (isPaused) {
      recorderService.resume();

      set({ isPaused: false, status: "recording" });
      return;
    }

    recorderService.pause();
    set({ isPaused: true, status: "paused" });
  },
}));

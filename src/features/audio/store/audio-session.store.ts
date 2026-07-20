import { create } from 'zustand';

import {
  INITIAL_METERING_BARS,
  METERING_BAR_COUNT,
  buildRecorderSyncPatch,
  type RecorderTick,
} from '@/features/audio/domain/recorder-session.helpers';
import { recordingSessionService } from '@/features/audio/services/recording-session.service';
import type { RecorderStatus } from '@/features/audio/types/recorder';
import type { RecordingMode } from '@/features/audio/types/recording-mode';
export { METERING_BAR_COUNT } from '@/features/audio/domain/recorder-session.helpers';

export type AudioSessionState = {
  status: RecorderStatus;
  timerSeconds: number;
  meteringBars: number[];
  previewUri: string | null;
  hasActiveSession: boolean;
  isPaused: boolean;
  recordingMode: RecordingMode | null;
  frozenDurationMillis: number;
};

export type AudioSessionContextValue = AudioSessionState;

type AudioSessionActions = {
  initialize: () => Promise<void>;
  syncRecorderState: (recorderState: RecorderTick) => void;
  startRecording: (mode: RecordingMode) => Promise<void>;
  handleMainAction: () => Promise<void>;
  handlePauseResume: () => void;
  resetSession: () => Promise<void>;
  handoffToEditor: () => void;
};

type AudioSessionStore = AudioSessionState & AudioSessionActions;

const START_RECORDING_STATE: Partial<AudioSessionState> = {
  previewUri: null,
  isPaused: false,
  hasActiveSession: true,
  meteringBars: Array(METERING_BAR_COUNT).fill(0.15),
  status: 'recording',
};

const IDLE_RECORDING_STATE: Partial<AudioSessionState> = {
  isPaused: false,
  hasActiveSession: false,
  previewUri: null,
  status: 'idle',
  timerSeconds: 0,
  recordingMode: null,
  frozenDurationMillis: 0,
};

export const useAudioSessionStore = create<AudioSessionStore>((set, get) => ({
  status: 'idle',
  timerSeconds: 0,
  meteringBars: INITIAL_METERING_BARS,
  previewUri: null,
  hasActiveSession: false,
  isPaused: false,
  recordingMode: null,
  frozenDurationMillis: 0,

  initialize: async () => {
    await recordingSessionService.initializeRecorder();
  },

  syncRecorderState: (recorderState) => {
    const session = get();
    const patch = buildRecorderSyncPatch(
      recorderState,
      session,
      session.frozenDurationMillis,
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

  startRecording: async (mode) => {
    const { previewUri } = get();

    set({
      ...START_RECORDING_STATE,
      recordingMode: mode,
    });

    await recordingSessionService.startNewSession(mode, previewUri);
  },

  handleMainAction: async () => {
    const { hasActiveSession, recordingMode } = get();

    if (!hasActiveSession) {
      return;
    }

    const mode = recordingMode ?? 'speech';

    set({
      hasActiveSession: false,
      isPaused: false,
      status: 'optimizing',
    });

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });

    const result = await recordingSessionService.finalizeRecording(mode);

    if (result) {
      set({
        previewUri: result.stagedUri,
        frozenDurationMillis: result.frozenDurationMillis,
        status: 'preview',
        timerSeconds: Math.floor(result.frozenDurationMillis / 1000),
      });
      return;
    }

    set(IDLE_RECORDING_STATE);
  },

  handlePauseResume: () => {
    const { isPaused, hasActiveSession } = get();
    if (!hasActiveSession) return;

    if (isPaused) {
      recordingSessionService.resume();
      set({ isPaused: false, status: 'recording' });
      return;
    }

    recordingSessionService.pause();
    set({ isPaused: true, status: 'paused' });
  },

  resetSession: async () => {
    const { hasActiveSession, previewUri } = get();
    await recordingSessionService.abortSession(hasActiveSession, previewUri);

    set({
      meteringBars: Array(METERING_BAR_COUNT).fill(0.15),
      ...IDLE_RECORDING_STATE,
    });
  },

  handoffToEditor: () => {
    set({
      meteringBars: Array(METERING_BAR_COUNT).fill(0.15),
      ...IDLE_RECORDING_STATE,
    });
  },
}));

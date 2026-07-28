import { create } from 'zustand';
import { Alert } from 'react-native';

import {
  INITIAL_METERING_BARS,
  METERING_BAR_COUNT,
  buildRecorderSyncPatch,
  type RecorderTick,
} from '@/features/audio/domain/recorder-session.helpers';
import { importAudioForPreview } from '@/features/audio/services/audio-import.service';
import { recordingSessionService } from '@/features/audio/services/recording-session.service';
import type { RecorderStatus } from '@/features/audio/types/recorder';

export { METERING_BAR_COUNT } from '@/features/audio/domain/recorder-session.helpers';

export type AudioSessionState = {
  status: RecorderStatus;
  timerSeconds: number;
  meteringBars: number[];
  previewUri: string | null;
  sourcePreGateUri: string | null;
  hasActiveSession: boolean;
  isPaused: boolean;
  frozenDurationMillis: number;
};

export type AudioSessionContextValue = AudioSessionState;

type AudioSessionActions = {
  initialize: () => Promise<void>;
  syncRecorderState: (recorderState: RecorderTick) => void;
  startRecording: () => Promise<void>;
  importAudio: () => Promise<void>;
  handleMainAction: () => Promise<void>;
  handlePauseResume: () => void;
  resetSession: () => Promise<void>;
  handoffToEditor: () => void;
};

type AudioSessionStore = AudioSessionState & AudioSessionActions;

const START_RECORDING_STATE: Partial<AudioSessionState> = {
  previewUri: null,
  sourcePreGateUri: null,
  isPaused: false,
  hasActiveSession: true,
  meteringBars: Array(METERING_BAR_COUNT).fill(0.15),
  status: 'recording',
};

const IDLE_RECORDING_STATE: Partial<AudioSessionState> = {
  isPaused: false,
  hasActiveSession: false,
  previewUri: null,
  sourcePreGateUri: null,
  status: 'idle',
  timerSeconds: 0,
  frozenDurationMillis: 0,
};

export const useAudioSessionStore = create<AudioSessionStore>((set, get) => ({
  status: 'idle',
  timerSeconds: 0,
  meteringBars: INITIAL_METERING_BARS,
  previewUri: null,
  sourcePreGateUri: null,
  hasActiveSession: false,
  isPaused: false,
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

  startRecording: async () => {
    const { previewUri, sourcePreGateUri } = get();

    set({
      ...START_RECORDING_STATE,
    });

    try {
      await recordingSessionService.startNewSession(previewUri, sourcePreGateUri);
    } catch (error) {
      console.warn('[Recorder] Failed to start capture session.', error);
      await recordingSessionService.abortSession(true, null);
      set({
        meteringBars: Array(METERING_BAR_COUNT).fill(0.15),
        ...IDLE_RECORDING_STATE,
      });
      Alert.alert('Error', 'Could not start recording.');
    }
  },

  importAudio: async () => {
    const { hasActiveSession, previewUri, sourcePreGateUri } = get();
    if (hasActiveSession) {
      return;
    }

    set({
      status: 'optimizing',
      previewUri: null,
      sourcePreGateUri: null,
    });

    try {
      if (previewUri || sourcePreGateUri) {
        const { discardPreviewRecording } = await import(
          '@/features/audio/data/recording-repository'
        );
        await discardPreviewRecording(previewUri ?? '', sourcePreGateUri);
      }

      const staged = await importAudioForPreview();
      if (!staged) {
        set(IDLE_RECORDING_STATE);
        return;
      }

      set({
        previewUri: staged.pendingUri,
        sourcePreGateUri: staged.sourcePreGateUri,
        frozenDurationMillis: Math.round(staged.durationSeconds * 1000),
        status: 'preview',
        timerSeconds: Math.floor(staged.durationSeconds),
        hasActiveSession: false,
        isPaused: false,
      });
    } catch (error) {
      console.warn('[Import] Failed to import audio.', error);
      set(IDLE_RECORDING_STATE);
      Alert.alert(
        'Import failed',
        error instanceof Error ? error.message : 'Could not import that audio file.',
      );
    }
  },

  handleMainAction: async () => {
    const { hasActiveSession } = get();

    if (!hasActiveSession) {
      return;
    }

    set({
      hasActiveSession: false,
      isPaused: false,
      status: 'optimizing',
    });

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });

    const result = await recordingSessionService.finalizeRecording();

    if (result) {
      set({
        previewUri: result.stagedUri,
        sourcePreGateUri: result.sourcePreGateUri,
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
    const { hasActiveSession, previewUri, sourcePreGateUri } = get();
    await recordingSessionService.abortSession(hasActiveSession, previewUri);

    if (sourcePreGateUri) {
      const { discardPreviewRecording } = await import(
        '@/features/audio/data/recording-repository'
      );
      await discardPreviewRecording('', sourcePreGateUri);
    }

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

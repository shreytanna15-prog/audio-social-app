import { Alert } from 'react-native';

import {
  discardPreviewRecording,
  stagePreviewRecording,
} from '@/features/audio/data/recording-repository';
import { recorderService } from '@/features/audio/services/recorder.service';
import type { RecordingMode } from '@/features/audio/types/recording-mode';

export type FinalizeResult = {
  frozenDurationMillis: number;
  stagedUri: string;
};

export const recordingSessionService = {
  async initializeRecorder(): Promise<boolean> {
    const granted = await recorderService.initialize();

    if (!granted) {
      Alert.alert(
        'Permission required',
        'Microphone access is needed to record audio.',
      );
    }

    return granted;
  },

  async startNewSession(
    mode: RecordingMode,
    existingPreviewUri: string | null,
  ): Promise<void> {
    if (existingPreviewUri) {
      await discardPreviewRecording(existingPreviewUri);
    }

    await recorderService.prepareAndRecord();
  },

  async finalizeRecording(mode: RecordingMode): Promise<FinalizeResult | null> {
    const { uri, durationMillis } = await recorderService.stop();

    if (!uri) {
      return null;
    }

    try {
      const durationSeconds = durationMillis / 1000;
      const stagedUri = await stagePreviewRecording(uri, mode, durationSeconds);

      return { frozenDurationMillis: durationMillis, stagedUri };
    } catch (error) {
      console.log('Error staging preview recording:', error);
      Alert.alert('Error', 'Could not prepare recording for preview.');
      return null;
    }
  },

  async abortSession(
    hasActiveSession: boolean,
    previewUri: string | null,
  ): Promise<void> {
    if (hasActiveSession) {
      await recorderService.stopIfActive();
    }

    if (previewUri) {
      await discardPreviewRecording(previewUri);
    }
  },

  pause(): void {
    recorderService.pause();
  },

  resume(): void {
    recorderService.resume();
  },
};

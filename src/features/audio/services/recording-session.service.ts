import { Alert } from 'react-native';

import {
  discardPreviewRecording,
  stageAudioForPreview,
  type StageAudioResult,
} from '@/features/audio/data/recording-repository';
import { expoPcmCaptureService } from '@/features/audio/services/expo-pcm-capture.service';
import { recorderService } from '@/features/audio/services/recorder.service';

export type FinalizeResult = StageAudioResult & {
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
    existingPreviewUri: string | null,
    existingSourcePreGateUri?: string | null,
  ): Promise<void> {
    if (existingPreviewUri || existingSourcePreGateUri) {
      await discardPreviewRecording(
        existingPreviewUri ?? '',
        existingSourcePreGateUri,
      );
    }

    console.warn('[Recorded] backend=expo-pcm');
    await expoPcmCaptureService.start();
  },

  async finalizeRecording(): Promise<FinalizeResult | null> {
    try {
      const result = await expoPcmCaptureService.stop();
      if (!result.uri) {
        return null;
      }

      const durationSeconds = result.durationMillis / 1000;
      const staged = await stageAudioForPreview(result.uri, durationSeconds);

      return {
        ...staged,
        frozenDurationMillis: result.durationMillis,
        stagedUri: staged.pendingUri,
      };
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
      await expoPcmCaptureService.abort();
    }

    if (previewUri) {
      await discardPreviewRecording(previewUri);
    }
  },

  pause(): void {
    expoPcmCaptureService.pause();
  },

  resume(): void {
    expoPcmCaptureService.resume();
  },
};

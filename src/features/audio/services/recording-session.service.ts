import { Alert } from 'react-native';

import {
  discardPreviewRecording,
  softCleanTake,
  stageRawTake,
  type StagedRawTake,
} from '@/features/audio/data/recording-repository';
import { expoPcmCaptureService } from '@/features/audio/services/expo-pcm-capture.service';
import { recorderService } from '@/features/audio/services/recorder.service';

export type RawCapture = {
  uri: string;
  durationMillis: number;
};

export type StagedTake = StagedRawTake & {
  frozenDurationMillis: number;
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

  /**
   * Same-tick freeze. After this returns, no more PCM is appended, even if the
   * native stream is still draining.
   */
  requestStop(): { durationMillis: number } {
    return expoPcmCaptureService.requestStop();
  },

  /**
   * Closes the native stream and writes the WAV header. Call after `requestStop`.
   */
  async stopCapture(): Promise<RawCapture | null> {
    try {
      const result = await expoPcmCaptureService.stop();
      return result.uri ? result : null;
    } catch (error) {
      console.log('Error stopping capture:', error);
      return null;
    }
  },

  /** Fast: copies the capture into the pending folder so it can be shown. */
  async stageRaw(capture: RawCapture): Promise<StagedTake | null> {
    try {
      const staged = await stageRawTake(capture.uri, capture.durationMillis / 1000);

      return { ...staged, frozenDurationMillis: capture.durationMillis };
    } catch (error) {
      console.log('Error staging preview recording:', error);
      Alert.alert('Error', 'Could not prepare recording for preview.');
      return null;
    }
  },

  /**
   * Slow: soft gate over a staged take. Returns null when the gate is
   * unavailable or fails, in which case the raw take stays as-is.
   */
  async softClean(rawUri: string): Promise<string | null> {
    try {
      return await softCleanTake(rawUri);
    } catch (error) {
      console.warn('[Optimize] background soft clean failed; keeping raw take.', error);
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

  getTick() {
    return expoPcmCaptureService.getTick();
  },

  startMeterPreview(): Promise<void> {
    return expoPcmCaptureService.startMeterPreview();
  },

  stopMeterPreview(): void {
    expoPcmCaptureService.stopMeterPreview();
  },
};

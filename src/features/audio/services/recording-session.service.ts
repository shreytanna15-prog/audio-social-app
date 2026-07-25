import { Alert } from 'react-native';
import {
  discardPreviewRecording,
  stagePreviewRecording,
} from '@/features/audio/data/recording-repository';
import { expoPcmCaptureService } from '@/features/audio/services/expo-pcm-capture.service';
import { nitroSoundCaptureService } from '@/features/audio/services/nitro-sound-capture.service';
import { recorderService } from '@/features/audio/services/recorder.service';
import { logRecorderMode } from '@/features/audio/domain/recorder-mode-log';
import type { RecordingMode } from '@/features/audio/types/recording-mode';

export type FinalizeResult = {
  frozenDurationMillis: number;
  stagedUri: string;
};

export type CaptureBackend = 'aac' | 'expo-pcm' | 'nitro-sound';

function captureBackendForMode(mode: RecordingMode): CaptureBackend {
  if (mode === 'raw' || mode === 'gate-lab') {
    return 'expo-pcm';
  }

  if (mode === 'nitro-m4a') {
    return 'nitro-sound';
  }

  return 'aac';
}

let activeBackend: CaptureBackend = 'aac';

export const recordingSessionService = {
  getActiveBackend(): CaptureBackend {
    return activeBackend;
  },

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

    activeBackend = captureBackendForMode(mode);
    logRecorderMode('Recorded', mode);

    if (activeBackend === 'expo-pcm') {
      await expoPcmCaptureService.start();
      return;
    }

    if (activeBackend === 'nitro-sound') {
      await nitroSoundCaptureService.start();
      return;
    }

    await recorderService.prepareAndRecord();
  },

  async finalizeRecording(mode: RecordingMode): Promise<FinalizeResult | null> {
    const backend = captureBackendForMode(mode);
    activeBackend = backend;

    try {
      let uri: string | null = null;
      let durationMillis = 0;

      if (backend === 'expo-pcm') {
        const result = await expoPcmCaptureService.stop();
        uri = result.uri;
        durationMillis = result.durationMillis;
      } else if (backend === 'nitro-sound') {
        const result = await nitroSoundCaptureService.stop();
        uri = result.uri;
        durationMillis = result.durationMillis;
      } else {
        const result = await recorderService.stop();
        uri = result.uri;
        durationMillis = result.durationMillis;
      }

      if (!uri) {
        return null;
      }

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
      if (activeBackend === 'expo-pcm') {
        await expoPcmCaptureService.abort();
      } else if (activeBackend === 'nitro-sound') {
        await nitroSoundCaptureService.abort();
      } else {
        await recorderService.stopIfActive();
      }
    }

    if (previewUri) {
      await discardPreviewRecording(previewUri);
    }

    activeBackend = 'aac';
  },

  pause(): void {
    if (activeBackend === 'expo-pcm') {
      expoPcmCaptureService.pause();
      return;
    }

    if (activeBackend === 'nitro-sound') {
      nitroSoundCaptureService.pause();
      return;
    }

    recorderService.pause();
  },

  resume(): void {
    if (activeBackend === 'expo-pcm') {
      expoPcmCaptureService.resume();
      return;
    }

    if (activeBackend === 'nitro-sound') {
      nitroSoundCaptureService.resume();
      return;
    }

    recorderService.resume();
  },
};

import {
  AudioManager,
  AudioRecorder,
  FileDirectory,
  FileFormat,
  FilePreset,
} from 'react-native-audio-api';

import { toFileUri } from '@/features/audio/utils/ffmpeg-path';

type CaptureTick = {
  isRecording: boolean;
  isPaused: boolean;
  durationMillis: number;
  metering: number;
};

let recorder: AudioRecorder | null = null;
let isRecording = false;
let isPaused = false;
let lastMetering = -160;

function ensureRecorder(): AudioRecorder {
  if (recorder) {
    return recorder;
  }

  AudioManager.setAudioSessionOptions({
    iosCategory: 'record',
    iosMode: 'default',
    iosOptions: [],
  });

  const next = new AudioRecorder();
  const enabled = next.enableFileOutput({
    format: FileFormat.Wav,
    preset: FilePreset.Lossless,
    directory: FileDirectory.Document,
    subDirectory: 'temp',
    fileNamePrefix: 'swm-wav-capture',
    channelCount: 1,
  });

  if (enabled.status === 'error') {
    throw new Error(enabled.message || 'SWM enableFileOutput failed.');
  }

  recorder = next;
  return next;
}

function resetSessionState(): void {
  isRecording = false;
  isPaused = false;
  lastMetering = -160;
}

function durationMillisFromRecorder(active: AudioRecorder): number {
  const seconds = active.getCurrentDuration();
  if (!Number.isFinite(seconds) || seconds < 0) {
    return 0;
  }

  return Math.round(seconds * 1000);
}

function normalizeCaptureUri(path: string): string {
  return toFileUri(path);
}

export const swmAudioCaptureService = {
  getTick(): CaptureTick {
    const active = recorder;
    return {
      isRecording,
      isPaused,
      durationMillis: active && isRecording ? durationMillisFromRecorder(active) : 0,
      metering: lastMetering,
    };
  },

  async start(): Promise<void> {
    if (isRecording) {
      return;
    }

    const permissions = await AudioManager.requestRecordingPermissions();
    if (permissions !== 'Granted') {
      throw new Error('Microphone permission is required for SWM WAV capture.');
    }

    const active = ensureRecorder();

    try {
      await AudioManager.setAudioSessionActivity(false);
    } catch {
      // Session may already be inactive.
    }

    try {
      await AudioManager.setAudioSessionActivity(true);
    } catch (error) {
      throw new Error(
        `Could not activate audio session for SWM capture: ${String(error)}`,
      );
    }

    const result = await active.start();
    if (result.status === 'error') {
      try {
        await AudioManager.setAudioSessionActivity(false);
      } catch {
        // ignore
      }
      throw new Error(result.message || 'SWM AudioRecorder start failed.');
    }

    isRecording = true;
    isPaused = false;
    lastMetering = -40;
    console.warn('[CaptureSWM] WAV started');
  },

  pause(): void {
    if (!isRecording || isPaused || !recorder) {
      return;
    }

    recorder.pause();
    isPaused = true;
  },

  resume(): void {
    if (!isRecording || !isPaused || !recorder) {
      return;
    }

    recorder.resume();
    isPaused = false;
  },

  async stop(): Promise<{ uri: string; durationMillis: number }> {
    if (!isRecording || !recorder) {
      throw new Error('SWM WAV capture is not active.');
    }

    const active = recorder;
    const result = await active.stop();

    try {
      await AudioManager.setAudioSessionActivity(false);
    } catch {
      // ignore
    }

    resetSessionState();

    if (result.status === 'error') {
      throw new Error(result.message || 'SWM AudioRecorder stop failed.');
    }

    const path = result.paths[0];
    if (!path) {
      throw new Error('SWM AudioRecorder stop returned no file path.');
    }

    const uri = normalizeCaptureUri(path);
    const durationMillis = Math.max(0, Math.round((result.duration || 0) * 1000));

    console.warn(
      `[CaptureSWM] WAV stopped uri=${uri} durationMs=${durationMillis}`,
    );

    return { uri, durationMillis };
  },

  async abort(): Promise<void> {
    if (!recorder) {
      resetSessionState();
      return;
    }

    try {
      if (isRecording) {
        await recorder.stop();
      }
    } catch {
      // ignore
    }

    try {
      await AudioManager.setAudioSessionActivity(false);
    } catch {
      // ignore
    }

    resetSessionState();
  },
};

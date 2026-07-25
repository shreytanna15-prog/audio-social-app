import { PermissionsAndroid, Platform } from 'react-native';
import {
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  AVEncoderAudioQualityIOSType,
  createSound,
  OutputFormatAndroidType,
  type AudioSet,
  type RecordBackType,
} from 'react-native-nitro-sound';

import { toFileUri } from '@/features/audio/utils/ffmpeg-path';

type CaptureTick = {
  isRecording: boolean;
  isPaused: boolean;
  durationMillis: number;
  metering: number;
};

type NitroSoundInstance = ReturnType<typeof createSound>;

const HIGH_QUALITY_AUDIO_SET: AudioSet = {
  AudioSamplingRate: 48_000,
  AudioEncodingBitRate: 192_000,
  AudioChannels: 1,
  AudioQuality: 'high',
  AVSampleRateKeyIOS: 48_000,
  AVNumberOfChannelsKeyIOS: 1,
  AVFormatIDKeyIOS: 'aac',
  AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
  AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
  AudioSourceAndroid: AudioSourceAndroidType.MIC,
  OutputFormatAndroid: OutputFormatAndroidType.MPEG_4,
};

let sound: NitroSoundInstance | null = null;
let isRecording = false;
let isPaused = false;
let durationMillis = 0;
let lastMetering = -160;

function ensureSound(): NitroSoundInstance {
  if (!sound) {
    sound = createSound();
    sound.setSubscriptionDuration(0.1);
  }

  return sound;
}

function resetSessionState(): void {
  isRecording = false;
  isPaused = false;
  durationMillis = 0;
  lastMetering = -160;
}

function clearRecordListener(): void {
  try {
    sound?.removeRecordBackListener();
  } catch {
    // ignore
  }
}

function handleRecordBack(event: RecordBackType): void {
  if (!isRecording) {
    return;
  }

  durationMillis = Math.max(0, Math.round(event.currentPosition || 0));
  if (typeof event.currentMetering === 'number') {
    lastMetering = event.currentMetering;
  }
}

async function ensureAndroidMicPermission(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
  );

  if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
    throw new Error('Microphone permission is required for Nitro M4A capture.');
  }
}

function normalizeCaptureUri(path: string): string {
  return toFileUri(path);
}

export const nitroSoundCaptureService = {
  getTick(): CaptureTick {
    return {
      isRecording,
      isPaused,
      durationMillis,
      metering: lastMetering,
    };
  },

  async start(): Promise<void> {
    if (isRecording) {
      return;
    }

    await ensureAndroidMicPermission();

    const active = ensureSound();
    clearRecordListener();
    active.addRecordBackListener(handleRecordBack);

    resetSessionState();
    isRecording = true;

    try {
      await active.startRecorder(undefined, HIGH_QUALITY_AUDIO_SET, true);
      console.warn('[CaptureNitro] M4A/MP4 started');
    } catch (error) {
      clearRecordListener();
      resetSessionState();
      throw error;
    }
  },

  pause(): void {
    if (!isRecording || isPaused || !sound) {
      return;
    }

    void sound.pauseRecorder().then(() => {
      isPaused = true;
    });
  },

  resume(): void {
    if (!isRecording || !isPaused || !sound) {
      return;
    }

    void sound.resumeRecorder().then(() => {
      isPaused = false;
    });
  },

  async stop(): Promise<{ uri: string; durationMillis: number }> {
    if (!isRecording || !sound) {
      throw new Error('Nitro sound capture is not active.');
    }

    const active = sound;
    const path = await active.stopRecorder();
    clearRecordListener();

    const finalDuration = durationMillis;
    resetSessionState();

    if (!path) {
      throw new Error('Nitro stopRecorder returned no file path.');
    }

    const uri = normalizeCaptureUri(path);
    console.warn(
      `[CaptureNitro] stopped uri=${uri} durationMs=${finalDuration}`,
    );

    return { uri, durationMillis: finalDuration };
  },

  async abort(): Promise<void> {
    if (!sound) {
      resetSessionState();
      return;
    }

    try {
      if (isRecording) {
        await sound.stopRecorder();
      }
    } catch {
      // ignore
    }

    clearRecordListener();
    resetSessionState();
  },
};

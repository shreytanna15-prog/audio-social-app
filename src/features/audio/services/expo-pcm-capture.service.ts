import { File } from 'expo-file-system';
import { documentDirectory } from 'expo-file-system/legacy';
import { setAudioModeAsync } from 'expo-audio';
import type { EventSubscription } from 'expo-modules-core';

import {
  createStreamingWavWriter,
  float32PcmToInt16Bytes,
  peakLevelFromFloat32Pcm,
  peakLevelFromInt16Pcm,
  type StreamingWavWriter,
} from '@/features/audio/utils/wav-pcm';
import { toFileUri } from '@/features/audio/utils/ffmpeg-path';

type CaptureTick = {
  isRecording: boolean;
  isPaused: boolean;
  durationMillis: number;
  metering: number;
};

type AudioStreamInstance = {
  start: () => Promise<void>;
  stop: () => void;
  sampleRate: number;
  channels: number;
  addListener: (
    event: string,
    listener: (payload: {
      data: ArrayBuffer;
      sampleRate: number;
      channels: number;
      timestamp: number;
    }) => void,
  ) => EventSubscription;
};

type AudioStreamModule = {
  AudioStream: new (options: {
    sampleRate: number;
    channels: number;
    encoding: string;
  }) => AudioStreamInstance;
};

const TARGET_SAMPLE_RATE = 48_000;
const TARGET_CHANNELS = 1;
const ENCODING = 'int16' as const;

let stream: AudioStreamInstance | null = null;
let bufferSub: EventSubscription | null = null;
let writer: StreamingWavWriter | null = null;
let startedAtMs = 0;
let pausedAtMs = 0;
let pausedTotalMs = 0;
let isRecording = false;
let isPaused = false;
let lastMetering = -160;
let actualSampleRate = TARGET_SAMPLE_RATE;
let actualChannels = TARGET_CHANNELS;

function dbFromPeak(peak01: number): number {
  if (peak01 <= 0.00001) {
    return -160;
  }

  return Math.max(-160, Math.min(0, 20 * Math.log10(peak01)));
}

function createCaptureWavUri(): string {
  if (!documentDirectory) {
    throw new Error('Document directory is not available.');
  }

  const uri = toFileUri(
    `${documentDirectory}temp/expo-pcm-capture-${Date.now()}.wav`,
  );
  const parent = new File(uri).parentDirectory;
  if (!parent.exists) {
    parent.create({ intermediates: true, idempotent: true });
  }
  return uri;
}

function getAudioStreamModule(): AudioStreamModule {
  // Not re-exported from expo-audio root in 56.0.12; use the native module directly.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const AudioModule = require('expo-audio/build/AudioModule').default as AudioStreamModule;

  if (typeof AudioModule?.AudioStream !== 'function') {
    throw new Error(
      'Expo AudioStream is not available in this build. Rebuild the dev client with expo-audio.',
    );
  }

  return AudioModule;
}

function clearStreamListeners(): void {
  bufferSub?.remove();
  bufferSub = null;
}

function resetSessionState(): void {
  isRecording = false;
  isPaused = false;
  startedAtMs = 0;
  pausedAtMs = 0;
  pausedTotalMs = 0;
  lastMetering = -160;
  actualSampleRate = TARGET_SAMPLE_RATE;
  actualChannels = TARGET_CHANNELS;
}

function elapsedMillis(): number {
  if (!isRecording || startedAtMs <= 0) {
    return 0;
  }

  const pausedExtra = isPaused && pausedAtMs > 0 ? Date.now() - pausedAtMs : 0;
  return Math.max(0, Date.now() - startedAtMs - pausedTotalMs - pausedExtra);
}

function handleBuffer(payload: {
  data: ArrayBuffer;
  sampleRate: number;
  channels: number;
}): void {
  if (!isRecording || isPaused || !writer) {
    return;
  }

  actualSampleRate = payload.sampleRate || actualSampleRate;
  actualChannels = payload.channels || actualChannels;

  const raw = new Uint8Array(payload.data);
  const pcmBytes =
    ENCODING === 'int16' ? raw : float32PcmToInt16Bytes(raw);

  writer.appendInt16Pcm(pcmBytes);

  const peak =
    ENCODING === 'int16'
      ? peakLevelFromInt16Pcm(pcmBytes)
      : peakLevelFromFloat32Pcm(raw);
  lastMetering = dbFromPeak(peak);
}

export const expoPcmCaptureService = {
  getTick(): CaptureTick {
    return {
      isRecording,
      isPaused,
      durationMillis: elapsedMillis(),
      metering: lastMetering,
    };
  },

  async start(): Promise<void> {
    if (isRecording) {
      return;
    }

    await setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: true,
    });

    const AudioModule = getAudioStreamModule();
    const nextStream = new AudioModule.AudioStream({
      sampleRate: TARGET_SAMPLE_RATE,
      channels: TARGET_CHANNELS,
      encoding: ENCODING,
    });

    const nextWriter = createStreamingWavWriter(createCaptureWavUri());

    clearStreamListeners();
    bufferSub = nextStream.addListener('audioStreamBuffer', handleBuffer);

    stream = nextStream;
    writer = nextWriter;
    resetSessionState();
    isRecording = true;
    startedAtMs = Date.now();

    await nextStream.start();
    console.warn('[CaptureA] Expo WAV started');
  },

  pause(): void {
    if (!isRecording || isPaused) {
      return;
    }

    isPaused = true;
    pausedAtMs = Date.now();
  },

  resume(): void {
    if (!isRecording || !isPaused) {
      return;
    }

    pausedTotalMs += Date.now() - pausedAtMs;
    pausedAtMs = 0;
    isPaused = false;
  },

  async stop(): Promise<{ uri: string; durationMillis: number }> {
    if (!isRecording || !writer || !stream) {
      throw new Error('Expo PCM capture is not active.');
    }

    const durationMillis = elapsedMillis();
    const activeWriter = writer;
    const activeStream = stream;

    try {
      activeStream.stop();
    } catch {
      // Stream may already be stopped.
    }

    clearStreamListeners();
    stream = null;

    activeWriter.finalize(actualSampleRate, actualChannels);
    const uri = activeWriter.uri;
    writer = null;
    resetSessionState();

    console.warn(
      `[CaptureA] Expo WAV stopped uri=${uri} durationMs=${durationMillis}`,
    );

    return { uri, durationMillis };
  },

  async abort(): Promise<void> {
    try {
      stream?.stop();
    } catch {
      // ignore
    }

    clearStreamListeners();
    stream = null;
    writer?.discard();
    writer = null;
    resetSessionState();
  },
};

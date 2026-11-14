import { File } from 'expo-file-system';
import { documentDirectory } from 'expo-file-system/legacy';
import { setAudioModeAsync } from 'expo-audio';
import type { EventSubscription } from 'expo-modules-core';

import { useInputMonitorStore } from '@/features/audio/store/input-monitor.store';
import {
  createStreamingWavWriter,
  durationMillisFromPcmBytes,
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

type AudioStreamTick = {
  durationMillis?: number;
  meteringDb?: number;
  sampleRate?: number;
  channels?: number;
};

type AudioStreamInstance = {
  start: () => Promise<void>;
  stop: () => void;
  pause?: () => void;
  resume?: () => void;
  abort?: () => void;
  setInputMonitor?: (enabled: boolean) => void;
  setMonitorGain?: (gain: number) => void;
  sampleRate: number;
  channels: number;
  supportsNativeWrite?: boolean;
  outputUri?: string | null;
  durationMillis?: number;
  lastMeteringDb?: number;
  addListener: (
    event: string,
    listener: (payload: AudioStreamTick & {
      data?: ArrayBuffer;
      timestamp?: number;
    }) => void,
  ) => EventSubscription;
};

type AudioStreamModule = {
  AudioStream: new (options: {
    sampleRate: number;
    channels: number;
    encoding: string;
    outputUri?: string;
    nativeWrite?: boolean;
    emitBuffersToJs?: boolean;
    inputMonitor?: boolean;
    monitorGain?: number;
  }) => AudioStreamInstance;
};

const TARGET_SAMPLE_RATE = 48_000;
const TARGET_CHANNELS = 1;
const ENCODING = 'int16' as const;
/** Metering only drives a 20 px bar, so a coarse scan of each buffer is plenty. */
const METERING_STRIDE = 32;

let stream: AudioStreamInstance | null = null;
let bufferSub: EventSubscription | null = null;
let tickSub: EventSubscription | null = null;
let writer: StreamingWavWriter | null = null;
let captureUri: string | null = null;
let nativeWriteActive = false;
let isRecording = false;
let isMeterPreview = false;
let isPaused = false;
let lastMetering = -160;
let actualSampleRate = TARGET_SAMPLE_RATE;
let actualChannels = TARGET_CHANNELS;
let capturedDurationMillis = 0;

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
  // Input-monitor sidetone lives in patches/expo-audio+56.0.12.patch (postinstall +
  // expo.autolinking.buildFromSource so Android compiles patched Kotlin, not the stale AAR).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const AudioModule = require('expo-audio/build/AudioModule').default as AudioStreamModule;

  if (typeof AudioModule?.AudioStream !== 'function') {
    throw new Error(
      'Expo AudioStream is not available in this build. Rebuild the dev client with expo-audio.',
    );
  }

  return AudioModule;
}

/** True when patched expo-audio exposes live headphone sidetone APIs. */
function supportsInputMonitor(instance: AudioStreamInstance): boolean {
  return typeof instance.setInputMonitor === 'function';
}

function clearStreamListeners(): void {
  bufferSub?.remove();
  bufferSub = null;
  tickSub?.remove();
  tickSub = null;
}

function resetSessionState(): void {
  isRecording = false;
  isMeterPreview = false;
  isPaused = false;
  lastMetering = -160;
  actualSampleRate = TARGET_SAMPLE_RATE;
  actualChannels = TARGET_CHANNELS;
  capturedDurationMillis = 0;
  nativeWriteActive = false;
  captureUri = null;
}

function deleteCaptureFile(uri: string | null): void {
  if (!uri) {
    return;
  }

  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // Best-effort cleanup.
  }
}

/**
 * Length of the take measured from the PCM actually written, which also makes
 * pause bookkeeping unnecessary — a paused take simply stops accumulating bytes.
 */
function capturedMillis(): number {
  if (nativeWriteActive && stream) {
    const fromNative = Number(stream.durationMillis);
    if (Number.isFinite(fromNative) && fromNative > 0) {
      return fromNative;
    }
  }

  if (!writer) {
    return capturedDurationMillis;
  }

  return durationMillisFromPcmBytes(
    writer.getByteLength(),
    actualSampleRate,
    actualChannels,
  );
}

function handleTick(payload: AudioStreamTick): void {
  if (!isRecording && !isMeterPreview) {
    return;
  }

  if (typeof payload.sampleRate === 'number' && payload.sampleRate > 0) {
    actualSampleRate = payload.sampleRate;
  }
  if (typeof payload.channels === 'number' && payload.channels > 0) {
    actualChannels = payload.channels;
  }
  if (
    isRecording &&
    typeof payload.durationMillis === 'number' &&
    Number.isFinite(payload.durationMillis)
  ) {
    capturedDurationMillis = payload.durationMillis;
  }
  if (typeof payload.meteringDb === 'number' && Number.isFinite(payload.meteringDb)) {
    lastMetering = payload.meteringDb;
  }
}

function handleBuffer(payload: {
  data?: ArrayBuffer;
  sampleRate?: number;
  channels?: number;
}): void {
  if ((!isRecording && !isMeterPreview) || isPaused || !payload.data) {
    return;
  }

  actualSampleRate = payload.sampleRate || actualSampleRate;
  actualChannels = payload.channels || actualChannels;

  const raw = new Uint8Array(payload.data);
  const pcmBytes =
    ENCODING === 'int16' ? raw : float32PcmToInt16Bytes(raw);

  if (isRecording && writer) {
    writer.appendInt16Pcm(pcmBytes);
  }

  const peak =
    ENCODING === 'int16'
      ? peakLevelFromInt16Pcm(pcmBytes, METERING_STRIDE)
      : peakLevelFromFloat32Pcm(raw);
  lastMetering = dbFromPeak(peak);
}

function stopMeterPreviewInternal(): void {
  if (!isMeterPreview) {
    return;
  }

  isMeterPreview = false;
  try {
    stream?.stop();
  } catch {
    // Stream may already be stopped.
  }
  clearStreamListeners();
  stream = null;
  lastMetering = -160;
}

export const expoPcmCaptureService = {
  getTick(): CaptureTick {
    return {
      isRecording,
      isPaused,
      durationMillis: isRecording ? capturedMillis() : capturedDurationMillis,
      metering: lastMetering,
    };
  },

  isMeterPreviewActive(): boolean {
    return isMeterPreview;
  },

  async startMeterPreview(): Promise<void> {
    if (isRecording || isMeterPreview) {
      return;
    }

    await setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: true,
    });

    // Record may have claimed the mic while we awaited audio mode.
    if (isRecording || isMeterPreview) {
      return;
    }

    const AudioModule = getAudioStreamModule();
    const nextStream = new AudioModule.AudioStream({
      sampleRate: TARGET_SAMPLE_RATE,
      channels: TARGET_CHANNELS,
      encoding: ENCODING,
      nativeWrite: false,
      emitBuffersToJs: true,
      inputMonitor: false,
      monitorGain: 1,
    });

    if (isRecording || isMeterPreview) {
      try {
        nextStream.stop();
      } catch {
        // ignore
      }
      return;
    }

    clearStreamListeners();
    writer?.discard();
    writer = null;
    captureUri = null;
    nativeWriteActive = false;
    isPaused = false;
    lastMetering = -160;
    isMeterPreview = true;
    stream = nextStream;

    bufferSub = nextStream.addListener('audioStreamBuffer', handleBuffer);
    tickSub = nextStream.addListener('audioStreamTick', handleTick);
    try {
      await nextStream.start();
    } catch (error) {
      stopMeterPreviewInternal();
      throw error;
    }

    if (isRecording) {
      stopMeterPreviewInternal();
    }
  },

  stopMeterPreview(): void {
    stopMeterPreviewInternal();
  },

  /**
   * Freeze the take in this JS turn. Native `stop()` is sync and, in native-write
   * mode, finalizes the WAV on the capture thread so no extra samples are kept.
   *
   * Call this from the Stop press itself. Do not put React work in front of it.
   */
  requestStop(): { durationMillis: number } {
    if (!isRecording) {
      return { durationMillis: capturedDurationMillis };
    }

    isRecording = false;
    isPaused = false;

    try {
      stream?.stop();
    } catch {
      // Stream may already be stopped.
    }

    capturedDurationMillis = capturedMillis();
    if (stream?.outputUri) {
      captureUri = stream.outputUri;
    }

    clearStreamListeners();
    return { durationMillis: capturedDurationMillis };
  },

  async start(): Promise<void> {
    if (isRecording) {
      return;
    }

    stopMeterPreviewInternal();

    await setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: true,
    });

    // Preview may have started during setAudioModeAsync — reclaim the mic.
    stopMeterPreviewInternal();

    const monitorPreferred = useInputMonitorStore.getState().preferredEnabled;
    const nextUri = createCaptureWavUri();
    const AudioModule = getAudioStreamModule();
    // Always assemble the WAV on JS (responsive stop/play). Native only does
    // optional headphone sidetone when the patched AudioStream is compiled in.
    const nextStream = new AudioModule.AudioStream({
      sampleRate: TARGET_SAMPLE_RATE,
      channels: TARGET_CHANNELS,
      encoding: ENCODING,
      nativeWrite: false,
      emitBuffersToJs: true,
      inputMonitor: monitorPreferred,
      monitorGain: 1,
    });

    const canMonitor = supportsInputMonitor(nextStream);

    clearStreamListeners();
    writer?.discard();
    writer = null;
    resetSessionState();
    captureUri = nextUri;
    nativeWriteActive = false;
    isRecording = true;
    stream = nextStream;

    if (!canMonitor) {
      console.warn(
        '[CaptureA] expo-audio has no inputMonitor API — rebuild the native app so patches/expo-audio+56.0.12.patch is compiled from source (package.json expo.autolinking.buildFromSource).',
      );
    }

    writer = createStreamingWavWriter(nextUri);
    bufferSub = nextStream.addListener('audioStreamBuffer', handleBuffer);
    await nextStream.start();
    console.warn(
      `[CaptureA] Expo WAV started (js-writer${canMonitor ? ', monitor-ready' : ''})`,
    );
  },

  pause(): void {
    if (!isRecording || isPaused) {
      return;
    }

    isPaused = true;
    try {
      stream?.pause?.();
    } catch {
      // Unpatched stream has no pause.
    }
  },

  resume(): void {
    if (!isRecording || !isPaused) {
      return;
    }

    isPaused = false;
    try {
      stream?.resume?.();
    } catch {
      // Unpatched stream has no resume.
    }
  },

  async stop(): Promise<{ uri: string; durationMillis: number }> {
    if (!captureUri && !writer) {
      throw new Error('Expo PCM capture is not active.');
    }

    isRecording = false;
    isPaused = false;

    const activeWriter = writer;
    const activeStream = stream;
    const native = nativeWriteActive;
    writer = null;
    stream = null;

    try {
      activeStream?.stop();
    } catch {
      // Stream may already be stopped.
    }

    clearStreamListeners();

    let uri = captureUri ?? activeWriter?.uri ?? activeStream?.outputUri ?? '';
    if (activeStream?.outputUri) {
      uri = activeStream.outputUri;
    }

    if (activeWriter) {
      activeWriter.finalize(actualSampleRate, actualChannels);
      uri = activeWriter.uri;
    }

    const durationMillis = native
      ? Math.round(
          Number(activeStream?.durationMillis) || capturedDurationMillis || capturedMillis(),
        )
      : durationMillisFromPcmBytes(
          activeWriter?.getByteLength() ?? 0,
          actualSampleRate,
          actualChannels,
        );

    capturedDurationMillis = durationMillis;
    resetSessionState();

    console.warn(
      `[CaptureA] Expo WAV stopped uri=${uri} durationMs=${durationMillis}${native ? ' native-write' : ''}`,
    );

    return { uri, durationMillis };
  },

  async abort(): Promise<void> {
    const uri = captureUri ?? writer?.uri ?? stream?.outputUri ?? null;

    try {
      if (typeof stream?.abort === 'function') {
        stream.abort();
      } else {
        stream?.stop();
      }
    } catch {
      // ignore
    }

    clearStreamListeners();
    stream = null;
    writer?.discard();
    writer = null;
    if (!nativeWriteActive) {
      deleteCaptureFile(uri);
    }
    resetSessionState();
  },

  /**
   * Live toggle while a take is open. No-op if capture is idle or the native
   * build lacks setInputMonitor (prebuilt AAR without the expo-audio patch).
   */
  setInputMonitor(enabled: boolean): void {
    try {
      stream?.setInputMonitor?.(enabled);
    } catch {
      // Older native binary without monitor APIs.
    }
  },
};

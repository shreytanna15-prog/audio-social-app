import { File } from 'expo-file-system';

const WAV_HEADER_SIZE = 44;
const TARGET_SAMPLE_RATE = 48_000;

type WavFormat = {
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
  dataOffset: number;
  dataSize: number;
};

function readAscii(view: DataView, offset: number, length: number): string {
  let value = '';

  for (let index = 0; index < length; index += 1) {
    value += String.fromCharCode(view.getUint8(offset + index));
  }

  return value;
}

function parseWavHeader(bytes: Uint8Array): WavFormat {
  if (bytes.length < WAV_HEADER_SIZE) {
    throw new Error('WAV file is too small.');
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  if (readAscii(view, 0, 4) !== 'RIFF' || readAscii(view, 8, 4) !== 'WAVE') {
    throw new Error('Unsupported WAV container.');
  }

  let offset = 12;
  let sampleRate = TARGET_SAMPLE_RATE;
  let channels = 1;
  let bitsPerSample = 16;
  let dataOffset = WAV_HEADER_SIZE;
  let dataSize = bytes.length - WAV_HEADER_SIZE;

  while (offset + 8 <= bytes.length) {
    const chunkId = readAscii(view, offset, 4);
    const chunkSize = view.getUint32(offset + 4, true);
    const chunkDataOffset = offset + 8;

    if (chunkId === 'fmt ') {
      channels = view.getUint16(chunkDataOffset + 2, true);
      sampleRate = view.getUint32(chunkDataOffset + 4, true);
      bitsPerSample = view.getUint16(chunkDataOffset + 14, true);
    }

    if (chunkId === 'data') {
      dataOffset = chunkDataOffset;
      dataSize = chunkSize;
      break;
    }

    offset = chunkDataOffset + chunkSize + (chunkSize % 2);
  }

  if (bitsPerSample !== 16) {
    throw new Error(`Unsupported WAV bit depth: ${bitsPerSample}.`);
  }

  return {
    sampleRate,
    channels,
    bitsPerSample,
    dataOffset,
    dataSize,
  };
}

function int16ToFloat32(samples: Int16Array): Float32Array {
  const output = new Float32Array(samples.length);

  for (let index = 0; index < samples.length; index += 1) {
    output[index] = samples[index] / 32_768;
  }

  return output;
}

function float32ToInt16(samples: Float32Array): Int16Array {
  const output = new Int16Array(samples.length);

  for (let index = 0; index < samples.length; index += 1) {
    let value = samples[index] * 32_768;

    if (value > 32_767) {
      value = 32_767;
    } else if (value < -32_768) {
      value = -32_768;
    }

    output[index] = value;
  }

  return output;
}

function createWavHeader(
  dataSize: number,
  sampleRate: number,
  channels: number,
  bitsPerSample: number,
): Uint8Array {
  const blockAlign = (channels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const buffer = new ArrayBuffer(WAV_HEADER_SIZE);
  const view = new DataView(buffer);

  const writeAscii = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  };

  writeAscii(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeAscii(36, 'data');
  view.setUint32(40, dataSize, true);

  return new Uint8Array(buffer);
}

export type StreamingWavWriter = {
  uri: string;
  appendInt16Pcm: (pcmBytes: Uint8Array) => void;
  finalize: (sampleRate: number, channels: number) => void;
  discard: () => void;
  getByteLength: () => number;
};

type OpenFileHandle = ReturnType<File['open']>;

/** One disk write per ~2s of 48 kHz mono int16 instead of one per audio buffer. */
const STAGE_BYTES = 192_000;

/**
 * Number of milliseconds of audio a PCM byte count represents.
 *
 * This is the only trustworthy duration for a take. Wall-clock timing counts the
 * gap between the tap and the handler running, so whenever the JS thread falls
 * behind the audio callbacks it reports a take longer than the file really is.
 */
export function durationMillisFromPcmBytes(
  byteLength: number,
  sampleRate: number,
  channels: number,
): number {
  const bytesPerFrame = Math.max(1, channels) * 2;
  const rate = sampleRate > 0 ? sampleRate : TARGET_SAMPLE_RATE;

  return Math.round((byteLength / bytesPerFrame / rate) * 1000);
}

/**
 * Creates a WAV file with a placeholder header, then streams int16 PCM chunks.
 * Call finalize() to rewrite RIFF sizes with the actual PCM length.
 *
 * Buffers are copied into a staging block and only written when it fills. The
 * audio callback runs on the JS thread dozens of times a second, so a write per
 * buffer starved everything else queued there — including the stop tap.
 */
export function createStreamingWavWriter(uri: string): StreamingWavWriter {
  const file = new File(uri);
  const parent = file.parentDirectory;

  if (!parent.exists) {
    parent.create({ intermediates: true, idempotent: true });
  }

  if (file.exists) {
    file.delete();
  }

  file.create({ overwrite: true });
  // Placeholder header (sizes updated in finalize).
  file.write(createWavHeader(0, TARGET_SAMPLE_RATE, 1, 16));

  let handle: OpenFileHandle | null = file.open();
  const stage = new Uint8Array(STAGE_BYTES);
  let stageLength = 0;
  let flushedBytes = 0;
  let closed = false;

  const flush = (): void => {
    if (!handle || stageLength === 0) {
      return;
    }

    handle.offset = WAV_HEADER_SIZE + flushedBytes;
    handle.writeBytes(stage.subarray(0, stageLength));
    flushedBytes += stageLength;
    stageLength = 0;
  };

  const releaseHandle = (): OpenFileHandle | null => {
    const active = handle;
    handle = null;
    return active;
  };

  return {
    uri,
    appendInt16Pcm(pcmBytes: Uint8Array) {
      if (closed || !handle || pcmBytes.byteLength === 0) {
        return;
      }

      // Copied rather than retained: the payload buffer belongs to the native
      // event and must not outlive this callback.
      let offset = 0;
      while (offset < pcmBytes.byteLength) {
        const take = Math.min(STAGE_BYTES - stageLength, pcmBytes.byteLength - offset);
        stage.set(pcmBytes.subarray(offset, offset + take), stageLength);
        stageLength += take;
        offset += take;

        if (stageLength === STAGE_BYTES) {
          flush();
        }
      }
    },
    finalize(sampleRate: number, channels: number) {
      if (closed) {
        return;
      }

      flush();
      closed = true;
      const active = releaseHandle();

      if (!active) {
        return;
      }

      try {
        active.offset = 0;
        active.writeBytes(createWavHeader(flushedBytes, sampleRate, channels, 16));
      } finally {
        active.close();
      }
    },
    discard() {
      closed = true;
      stageLength = 0;
      const active = releaseHandle();

      try {
        active?.close();
      } catch {
        // Handle may already be closed.
      }

      try {
        if (file.exists) {
          file.delete();
        }
      } catch {
        // Temp file may already be gone.
      }
    },
    getByteLength() {
      return flushedBytes + stageLength;
    },
  };
}

/**
 * Peak metering helper for int16 PCM (0..1).
 *
 * `stride` skips samples. A meter bar is 20 px tall, so scanning every sample of
 * every buffer is wasted work on the thread that also has to handle taps.
 */
export function peakLevelFromInt16Pcm(pcmBytes: Uint8Array, stride = 1): number {
  if (pcmBytes.byteLength < 2) {
    return 0;
  }

  const samples = new Int16Array(
    pcmBytes.buffer,
    pcmBytes.byteOffset,
    Math.floor(pcmBytes.byteLength / 2),
  );
  const step = Math.max(1, Math.floor(stride));
  let peak = 0;

  for (let index = 0; index < samples.length; index += step) {
    const abs = Math.abs(samples[index]);
    if (abs > peak) {
      peak = abs;
    }
  }

  return Math.min(1, peak / 32_768);
}

/** Peak metering helper for float32 PCM (0..1). */
export function peakLevelFromFloat32Pcm(pcmBytes: Uint8Array): number {
  if (pcmBytes.byteLength < 4) {
    return 0;
  }

  const samples = new Float32Array(
    pcmBytes.buffer,
    pcmBytes.byteOffset,
    Math.floor(pcmBytes.byteLength / 4),
  );
  let peak = 0;

  for (let index = 0; index < samples.length; index += 1) {
    const abs = Math.abs(samples[index]);
    if (abs > peak) {
      peak = abs;
    }
  }

  return Math.min(1, peak);
}

export function float32PcmToInt16Bytes(pcmBytes: Uint8Array): Uint8Array {
  const floats = new Float32Array(
    pcmBytes.buffer,
    pcmBytes.byteOffset,
    Math.floor(pcmBytes.byteLength / 4),
  );
  const ints = float32ToInt16(floats);
  return new Uint8Array(ints.buffer, ints.byteOffset, ints.byteLength);
}

export async function readWavAsFloat32(uri: string): Promise<Float32Array> {
  const file = new File(uri);

  if (!file.exists) {
    throw new Error('WAV file does not exist.');
  }

  const headerBytes = file.bytesSync().slice(0, Math.min(file.size, 4_096));
  const format = parseWavHeader(headerBytes);
  const bytesPerSample = (format.bitsPerSample / 8) * format.channels;
  const totalSamples = Math.floor(format.dataSize / bytesPerSample);
  const pcm = new Int16Array(totalSamples);
  const handle = file.open();

  try {
    const chunkSize = 256 * 1024;
    let pcmOffset = 0;

    for (let offset = format.dataOffset; offset < format.dataOffset + format.dataSize; offset += chunkSize) {
      const length = Math.min(chunkSize, format.dataOffset + format.dataSize - offset);
      handle.offset = offset;
      const bytes = handle.readBytes(length);
      const chunk = new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2);
      pcm.set(chunk, pcmOffset);
      pcmOffset += chunk.length;
    }
  } finally {
    handle.close();
  }

  if (format.channels === 1) {
    return int16ToFloat32(pcm);
  }

  const monoLength = Math.floor(pcm.length / format.channels);
  const mono = new Float32Array(monoLength);

  for (let index = 0; index < monoLength; index += 1) {
    let sum = 0;

    for (let channel = 0; channel < format.channels; channel += 1) {
      sum += pcm[index * format.channels + channel];
    }

    mono[index] = sum / format.channels / 32_768;
  }

  return mono;
}

export async function writeFloat32AsWav(
  samples: Float32Array,
  uri: string,
  sampleRate = TARGET_SAMPLE_RATE,
): Promise<void> {
  const pcm = float32ToInt16(samples);
  const pcmBytes = new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  const header = createWavHeader(pcmBytes.byteLength, sampleRate, 1, 16);
  const output = new Uint8Array(header.byteLength + pcmBytes.byteLength);

  output.set(header, 0);
  output.set(pcmBytes, header.byteLength);

  const file = new File(uri);
  const parent = file.parentDirectory;

  if (!parent.exists) {
    parent.create({ intermediates: true });
  }

  if (file.exists) {
    file.delete();
  }

  file.create({ overwrite: true });
  file.write(output);
}

export const DEEPFILTER_SAMPLE_RATE = TARGET_SAMPLE_RATE;

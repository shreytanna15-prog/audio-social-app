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

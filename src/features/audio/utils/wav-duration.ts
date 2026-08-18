import { File } from 'expo-file-system';

const WAV_SAMPLE_RATE = 48_000;
const WAV_BYTES_PER_SAMPLE = 2;
const WAV_CHANNELS = 1;
const WAV_HEADER_BYTES = 44;

export function durationSecondsFromMono48kWav(uri: string): number {
  const file = new File(uri);
  if (!file.exists) {
    return 0;
  }

  const size = file.size;
  if (!Number.isFinite(size) || size <= WAV_HEADER_BYTES) {
    return 0;
  }

  const pcmBytes = size - WAV_HEADER_BYTES;
  const frameBytes = WAV_SAMPLE_RATE * WAV_CHANNELS * WAV_BYTES_PER_SAMPLE;
  return Math.max(0, pcmBytes / frameBytes);
}

import { readFileBytes } from '@/features/audio/data/file-persist';
import { linearAmplitudeToDisplayPeak } from '@/features/audio/domain/recorder-session.helpers';
import { peakBarCountForDuration } from '@/features/audio/domain/timeline';

const WAV_HEADER_BYTES = 44;
const FALLBACK_SAMPLE_RATE = 48_000;
/** Keep the old export for UI that still snaps against a coarse grid. */
export const PEAK_BAR_COUNT = 64;
/** Probe this many samples inside each bar instead of scanning every PCM frame. */
const PROBES_PER_BAR = 24;

function readInt16LE(bytes: Uint8Array, offset: number): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return view.getInt16(offset, true);
}

function readUint32LE(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset] |
    (bytes[offset + 1] << 8) |
    (bytes[offset + 2] << 16) |
    (bytes[offset + 3] << 24)
  );
}

function wavSampleRate(bytes: Uint8Array): number {
  if (bytes.byteLength < 28) {
    return FALLBACK_SAMPLE_RATE;
  }

  const rate = readUint32LE(bytes, 24);
  return rate > 0 ? rate : FALLBACK_SAMPLE_RATE;
}

/**
 * Downsample a mono 16-bit WAV into peak bars for the studio timeline.
 * Bar count follows clip width (px/sec) so a 4-minute beat is not 64 fat blocks.
 */
export async function extractPeaksFromWav(
  uri: string,
  barCount?: number,
): Promise<number[]> {
  try {
    const bytes = await readFileBytes(uri);
    if (bytes.byteLength <= WAV_HEADER_BYTES + 2) {
      return [];
    }

    const pcmBytes = bytes.byteLength - WAV_HEADER_BYTES;
    const sampleCount = Math.floor(pcmBytes / 2);
    if (sampleCount <= 0) {
      return [];
    }

    const sampleRate = wavSampleRate(bytes);
    const durationSeconds = sampleCount / Math.max(1, sampleRate);
    const count = Math.max(1, barCount ?? peakBarCountForDuration(durationSeconds));
    const samplesPerBar = Math.max(1, Math.floor(sampleCount / count));
    const probeStride = Math.max(1, Math.floor(samplesPerBar / PROBES_PER_BAR));
    const peaks: number[] = [];

    for (let bar = 0; bar < count; bar += 1) {
      const startSample = bar * samplesPerBar;
      const endSample = Math.min(sampleCount, startSample + samplesPerBar);
      let peak = 0;

      for (let sample = startSample; sample < endSample; sample += probeStride) {
        const offset = WAV_HEADER_BYTES + sample * 2;
        if (offset + 1 >= bytes.byteLength) {
          break;
        }
        const level = Math.abs(readInt16LE(bytes, offset)) / 32768;
        if (level > peak) {
          peak = level;
        }
      }

        peaks.push(linearAmplitudeToDisplayPeak(peak));
    }

    return peaks;
  } catch (error) {
    console.warn('[Peaks] could not read waveform', error);
    return [];
  }
}

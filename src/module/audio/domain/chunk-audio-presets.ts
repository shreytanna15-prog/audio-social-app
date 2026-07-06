import {
  CHUNK_HIGH_NOISE_FLOOR_DB,
  CHUNK_LOUD_PEAK_DB,
  CHUNK_MIXED_DENOISE_NR_REDUCTION,
  CHUNK_QUIET_RMS_DB,
} from '@/module/audio/domain/chunk-audio.constants';
import type { ChunkAudioMetrics } from '@/module/audio/domain/chunk-audio-analysis';

export type ChunkPresetId = 'mild' | 'medium' | 'polish-only';

export type ChunkedRecordingMode = 'instrument' | 'mixed';

const CHUNK_HIGHPASS_HZ = 50;
const CHUNK_MIXED_HIGHPASS_HZ = 60;

const POLISH_EQ = 'equalizer=f=250:width_type=h:width=120:g=1.2';
const POLISH_COMPRESSOR = 'acompressor=threshold=-20dB:ratio=2.5:attack=10:release=120';
const POLISH_LOUDNORM = 'loudnorm=I=-14:TP=-1.5:LRA=11';
const POLISH_LIMITER = 'alimiter=limit=0.95:level=false';

const MILD_AFFTDN_NR = 8;
const MEDIUM_AFFTDN_NR = 5;
const MEDIUM_COMPRESSOR = 'acompressor=threshold=-18dB:ratio=2:attack=5:release=100';
const MEDIUM_LIMITER = 'alimiter=limit=0.88:level=false';

function joinStages(stages: string[]): string {
  return stages.join(',');
}

function resolveHighpassHz(mode: ChunkedRecordingMode): number {
  return mode === 'mixed' ? CHUNK_MIXED_HIGHPASS_HZ : CHUNK_HIGHPASS_HZ;
}

function buildAfftdnStage(nr: number): string {
  return `afftdn=nr=${nr}:nf=-50:tn=1:tr=1:gs=16:ad=0.4:rf=-42`;
}

function buildMediumAfftdnStage(nr: number): string {
  return `afftdn=nr=${nr}:nf=-45:tn=1:tr=1:gs=14:ad=0.35:rf=-40`;
}

function resolveAfftdnNr(baseNr: number, mode: ChunkedRecordingMode): number {
  if (mode === 'mixed') {
    return Math.max(1, baseNr - CHUNK_MIXED_DENOISE_NR_REDUCTION);
  }

  return baseNr;
}

function buildChunkPresetProcessingFilters(
  mode: ChunkedRecordingMode,
): Record<ChunkPresetId, string> {
  const highpassHz = resolveHighpassHz(mode);
  const mildNr = resolveAfftdnNr(MILD_AFFTDN_NR, mode);
  const mediumNr = resolveAfftdnNr(MEDIUM_AFFTDN_NR, mode);

  return {
    'polish-only': joinStages([
      `highpass=f=${highpassHz}`,
      POLISH_EQ,
      POLISH_COMPRESSOR,
      POLISH_LIMITER,
    ]),
    mild: joinStages([
      `highpass=f=${highpassHz}`,
      buildAfftdnStage(mildNr),
      POLISH_COMPRESSOR,
      POLISH_LIMITER,
    ]),
    medium: joinStages([
      `highpass=f=${highpassHz}`,
      buildMediumAfftdnStage(mediumNr),
      MEDIUM_COMPRESSOR,
      MEDIUM_LIMITER,
    ]),
  };
}

/** Applied once on the full concatenated recording. */
export const CHUNK_FINAL_LOUDNORM_FILTER = POLISH_LOUDNORM;

export function buildChunkPresetProcessingFilter(
  presetId: ChunkPresetId,
  mode: ChunkedRecordingMode = 'instrument',
): string {
  return buildChunkPresetProcessingFilters(mode)[presetId];
}

export function buildChunkPresetFilter(
  presetId: ChunkPresetId,
  mode: ChunkedRecordingMode = 'instrument',
): string {
  const processingFilter = buildChunkPresetProcessingFilter(presetId, mode);
  return joinStages([processingFilter, POLISH_LOUDNORM]);
}

export function buildSinglePassOptimizeFilter(
  presetId: ChunkPresetId,
  mode: ChunkedRecordingMode = 'instrument',
): string {
  return joinStages([
    buildChunkPresetProcessingFilter(presetId, mode),
    CHUNK_FINAL_LOUDNORM_FILTER,
  ]);
}

export function summarizeChunkedRecordingStrategy(
  mode: ChunkedRecordingMode,
  selections: { presetId: ChunkPresetId }[],
): string {
  if (selections.length === 0) {
    return `chunked-${mode}-polish-only`;
  }

  const presetCounts = new Map<ChunkPresetId, number>();

  for (const selection of selections) {
    presetCounts.set(selection.presetId, (presetCounts.get(selection.presetId) ?? 0) + 1);
  }

  if (presetCounts.size === 1) {
    const [presetId] = presetCounts.keys();
    return `chunked-${mode}-${presetId}`;
  }

  const breakdown = [...presetCounts.entries()]
    .map(([presetId, count]) => `${presetId}=${count}`)
    .join(',');

  console.info(`[ChunkPipeline] Preset mix: ${breakdown}`);

  return `chunked-${mode}-mixed`;
}

/** @deprecated Use {@link summarizeChunkedRecordingStrategy} with mode `instrument`. */
export function summarizeChunkedInstrumentStrategy(
  selections: { presetId: ChunkPresetId }[],
): string {
  return summarizeChunkedRecordingStrategy('instrument', selections);
}

export function pickChunkPreset(metrics: ChunkAudioMetrics): ChunkPresetId {
  if (metrics.peakDb >= CHUNK_LOUD_PEAK_DB) {
    return 'medium';
  }

  if (
    metrics.rmsDb <= CHUNK_QUIET_RMS_DB &&
    metrics.noiseFloorDb >= CHUNK_HIGH_NOISE_FLOOR_DB
  ) {
    return 'mild';
  }

  return 'polish-only';
}

export function logChunkPresetSelection(
  chunkIndex: number,
  presetId: ChunkPresetId,
  metrics: ChunkAudioMetrics,
): void {
  console.info(
    `[ChunkPipeline] chunk ${chunkIndex} → preset "${presetId}" ` +
      `(rms=${metrics.rmsDb.toFixed(1)}dB peak=${metrics.peakDb.toFixed(1)}dB ` +
      `noiseFloor=${metrics.noiseFloorDb.toFixed(1)}dB)`,
  );
}

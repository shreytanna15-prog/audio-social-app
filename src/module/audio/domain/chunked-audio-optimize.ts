import * as Crypto from 'expo-crypto';
import { File } from 'expo-file-system';
import { deleteAsync, documentDirectory } from 'expo-file-system/legacy';

import {
  CHUNK_CROSSFADE_SECONDS,
  CHUNK_MAX_RECORDING_SECONDS,
  CHUNK_MIN_DURATION_FOR_CHUNKING,
  CHUNK_TEMP_SUBPATH,
  CHUNK_WAV_CHANNELS,
  CHUNK_WAV_SAMPLE_RATE,
} from '@/module/audio/domain/chunk-audio.constants';
import {
  logChunkPlan,
  planChunkBoundaries,
  analyzeChunkWav,
  analyzeRecordingMetrics,
  shouldUseChunkedPipeline,
  type ChunkAnalysisResult,
  type ChunkBoundary,
} from '@/module/audio/domain/chunk-audio-analysis';
import {
  buildChunkPresetProcessingFilter,
  buildSinglePassOptimizeFilter,
  CHUNK_FINAL_LOUDNORM_FILTER,
  logChunkPresetSelection,
  pickChunkPreset,
  summarizeChunkedRecordingStrategy,
  type ChunkedRecordingMode,
  type ChunkPresetId,
} from '@/module/audio/domain/chunk-audio-presets';
import {
  concatWavChunksWithCrossfade,
  deleteFileIfExists,
  encodeWavToM4a,
  extractAudioChunkWav,
  probeAudioDurationSeconds,
  resolveProcessedFileUri,
  runFfmpegAudioFilter,
  runFfmpegWavFilter,
} from '@/module/audio/services/ffmpeg.service';
import { assertFfmpegAvailable } from '@/module/audio/utils/ffmpeg-availability';
import { toFileUri } from '@/module/audio/utils/ffmpeg-path';

export type AudioChunkFile = {
  boundary: ChunkBoundary;
  uri: string;
};

export type ChunkPresetSelection = {
  chunk: AudioChunkFile;
  analysis: ChunkAnalysisResult;
  presetId: ChunkPresetId;
  audioFilter: string;
};

function buildChunkSessionDirectoryUri(sessionId: string): string {
  if (!documentDirectory) {
    throw new Error('Document directory is not available.');
  }

  return toFileUri(`${documentDirectory}${CHUNK_TEMP_SUBPATH}/${sessionId}/`);
}

function buildChunkWavUri(sessionDirUri: string, index: number): string {
  return `${sessionDirUri}chunk-${String(index).padStart(3, '0')}.wav`;
}

function buildProcessedChunkWavUri(sessionDirUri: string, index: number): string {
  return `${sessionDirUri}chunk-${String(index).padStart(3, '0')}-processed.wav`;
}

export async function createChunkSessionDirectory(sessionId: string): Promise<string> {
  const sessionDirUri = buildChunkSessionDirectoryUri(sessionId);
  const sessionDir = new File(sessionDirUri);

  if (!sessionDir.exists) {
    sessionDir.create({ intermediates: true });
  }

  return sessionDirUri;
}

export async function deleteChunkSessionDirectory(sessionId: string): Promise<void> {
  if (!documentDirectory) {
    return;
  }

  const sessionDirUri = `${documentDirectory}${CHUNK_TEMP_SUBPATH}/${sessionId}`;

  try {
    await deleteAsync(sessionDirUri, { idempotent: true });
  } catch {
    // Session directory may already be removed.
  }
}

type SplitAudioIntoChunkWavsInput = {
  inputUri: string;
  sessionId: string;
  totalDurationSeconds?: number;
};

export async function splitAudioIntoChunkWavs({
  inputUri,
  sessionId,
  totalDurationSeconds,
}: SplitAudioIntoChunkWavsInput): Promise<AudioChunkFile[]> {
  assertFfmpegAvailable();

  const durationSeconds =
    totalDurationSeconds ?? (await probeAudioDurationSeconds(inputUri));
  const boundaries = planChunkBoundaries(durationSeconds);

  logChunkPlan(boundaries, durationSeconds);

  const sessionDirUri = await createChunkSessionDirectory(sessionId);
  const chunks: AudioChunkFile[] = [];

  for (const boundary of boundaries) {
    const chunkUri = buildChunkWavUri(sessionDirUri, boundary.index);

    await extractAudioChunkWav({
      inputUri,
      outputUri: chunkUri,
      startSeconds: boundary.startSeconds,
      durationSeconds: boundary.durationSeconds,
      sampleRate: CHUNK_WAV_SAMPLE_RATE,
      channels: CHUNK_WAV_CHANNELS,
    });

    chunks.push({ boundary, uri: chunkUri });
    console.info(`[ChunkPipeline] Wrote chunk#${boundary.index} → ${chunkUri}`);
  }

  console.info(`[ChunkPipeline] Split complete: ${chunks.length} chunk WAV(s)`);

  return chunks;
}

export async function analyzeChunksAndPickPresets(
  chunks: AudioChunkFile[],
  mode: ChunkedRecordingMode = 'instrument',
): Promise<ChunkPresetSelection[]> {
  const selections: ChunkPresetSelection[] = [];

  for (const chunk of chunks) {
    const analysis = await analyzeChunkWav(chunk.uri, chunk.boundary);
    const presetId = pickChunkPreset(analysis.metrics);
    const audioFilter = buildChunkPresetProcessingFilter(presetId, mode);

    logChunkPresetSelection(chunk.boundary.index, presetId, analysis.metrics);

    selections.push({
      chunk,
      analysis,
      presetId,
      audioFilter,
    });
  }

  console.info(
    `[ChunkPipeline] Preset analysis complete for ${selections.length} chunk(s)`,
  );

  return selections;
}

async function processChunkWithPreset(
  selection: ChunkPresetSelection,
  sessionDirUri: string,
): Promise<AudioChunkFile> {
  const processedUri = buildProcessedChunkWavUri(
    sessionDirUri,
    selection.chunk.boundary.index,
  );

  console.info(
    `[ChunkPipeline] Processing chunk#${selection.chunk.boundary.index} preset="${selection.presetId}"`,
  );

  await runFfmpegWavFilter({
    inputUri: selection.chunk.uri,
    outputUri: processedUri,
    audioFilter: selection.audioFilter,
    sampleRate: CHUNK_WAV_SAMPLE_RATE,
    channels: CHUNK_WAV_CHANNELS,
  });

  return {
    boundary: selection.chunk.boundary,
    uri: processedUri,
  };
}

export type ChunkedRecordingOptimizeResult = {
  uri: string;
  strategy: string;
};

type OptimizeChunkedRecordingForPreviewInput = {
  inputUri: string;
  outputUri: string;
  durationSeconds?: number;
  mode: ChunkedRecordingMode;
};

async function optimizeSinglePassRecordingForPreview({
  inputUri,
  outputUri,
  durationSeconds,
  mode,
}: OptimizeChunkedRecordingForPreviewInput & {
  durationSeconds: number;
}): Promise<ChunkedRecordingOptimizeResult> {
  const metrics = await analyzeRecordingMetrics(inputUri, durationSeconds);
  const presetId = pickChunkPreset(metrics);

  console.info(`[ChunkPipeline] Single-pass ${mode} preset="${presetId}".`);
  logChunkPresetSelection(0, presetId, metrics);

  await runFfmpegAudioFilter({
    inputUri,
    outputUri,
    audioFilter: buildSinglePassOptimizeFilter(presetId, mode),
    useLosslessIntermediate: true,
  });

  const strategy = `single-pass-${mode}-${presetId}`;

  return {
    uri: resolveProcessedFileUri(outputUri),
    strategy,
  };
}

function describeSinglePassReason(durationSeconds: number): string {
  if (durationSeconds < CHUNK_MIN_DURATION_FOR_CHUNKING) {
    return `duration=${durationSeconds.toFixed(2)}s < ${CHUNK_MIN_DURATION_FOR_CHUNKING}s minimum`;
  }

  if (durationSeconds > CHUNK_MAX_RECORDING_SECONDS) {
    return `duration=${durationSeconds.toFixed(2)}s > ${CHUNK_MAX_RECORDING_SECONDS}s maximum`;
  }

  return `duration=${durationSeconds.toFixed(2)}s fits one chunk`;
}

export async function optimizeChunkedRecordingForPreview({
  inputUri,
  outputUri,
  durationSeconds,
  mode,
}: OptimizeChunkedRecordingForPreviewInput): Promise<ChunkedRecordingOptimizeResult> {
  assertFfmpegAvailable();

  const resolvedDurationSeconds =
    durationSeconds ?? (await probeAudioDurationSeconds(inputUri));

  if (!shouldUseChunkedPipeline(resolvedDurationSeconds)) {
    console.info(
      `[ChunkPipeline] Skipping chunking (${describeSinglePassReason(resolvedDurationSeconds)}).`,
    );

    return optimizeSinglePassRecordingForPreview({
      inputUri,
      outputUri,
      durationSeconds: resolvedDurationSeconds,
      mode,
    });
  }

  const sessionId = Crypto.randomUUID();
  const sessionDirUri = buildChunkSessionDirectoryUri(sessionId);
  const concatWavUri = `${sessionDirUri}concat.wav`;
  const finalWavUri = `${sessionDirUri}final.wav`;

  try {
    console.info(
      `[ChunkPipeline] Starting ${mode} chunked optimize duration=${resolvedDurationSeconds.toFixed(2)}s.`,
    );

    const chunks = await splitAudioIntoChunkWavs({
      inputUri,
      sessionId,
      totalDurationSeconds: resolvedDurationSeconds,
    });
    const selections = await analyzeChunksAndPickPresets(chunks, mode);
    const processedChunks: AudioChunkFile[] = [];

    for (const selection of selections) {
      processedChunks.push(await processChunkWithPreset(selection, sessionDirUri));
    }

    await concatProcessedChunksToWav(processedChunks, concatWavUri);

    console.info('[ChunkPipeline] Applying final loudnorm on concatenated recording.');
    await runFfmpegWavFilter({
      inputUri: concatWavUri,
      outputUri: finalWavUri,
      audioFilter: CHUNK_FINAL_LOUDNORM_FILTER,
      sampleRate: CHUNK_WAV_SAMPLE_RATE,
      channels: CHUNK_WAV_CHANNELS,
    });

    await encodeWavToM4a(finalWavUri, outputUri);

    const strategy = summarizeChunkedRecordingStrategy(mode, selections);

    console.info(`[ChunkPipeline] ${mode} chunked optimize complete strategy="${strategy}"`);

    return {
      uri: resolveProcessedFileUri(outputUri),
      strategy,
    };
  } finally {
    await deleteChunkSessionDirectory(sessionId);
  }
}

/** @deprecated Use {@link optimizeChunkedRecordingForPreview} with mode `instrument`. */
export type ChunkedInstrumentOptimizeResult = ChunkedRecordingOptimizeResult;

/** @deprecated Use {@link optimizeChunkedRecordingForPreview} with mode `instrument`. */
export async function optimizeInstrumentRecordingChunked({
  inputUri,
  outputUri,
  durationSeconds,
}: Omit<OptimizeChunkedRecordingForPreviewInput, 'mode'>): Promise<ChunkedRecordingOptimizeResult> {
  return optimizeChunkedRecordingForPreview({
    inputUri,
    outputUri,
    durationSeconds,
    mode: 'instrument',
  });
}

export async function concatProcessedChunksToWav(
  chunks: AudioChunkFile[],
  outputUri: string,
): Promise<void> {
  assertFfmpegAvailable();

  const sumDurationSeconds = chunks.reduce(
    (total, chunk) => total + chunk.boundary.durationSeconds,
    0,
  );

  console.info(
    `[ChunkPipeline] Concatenating ${chunks.length} chunk(s), ` +
      `sumDuration=${sumDurationSeconds.toFixed(2)}s, crossfade=${CHUNK_CROSSFADE_SECONDS}s`,
  );

  await concatWavChunksWithCrossfade({
    chunkUris: chunks.map((chunk) => chunk.uri),
    outputUri,
    crossfadeSeconds: CHUNK_CROSSFADE_SECONDS,
  });

  const outputDurationSeconds = await probeAudioDurationSeconds(outputUri);

  console.info(
    `[ChunkPipeline] Concat complete → ${outputUri} duration=${outputDurationSeconds.toFixed(2)}s`,
  );
}

export async function concatProcessedChunksToM4a(
  chunks: AudioChunkFile[],
  outputUri: string,
): Promise<void> {
  const intermediateWavUri = outputUri.toLowerCase().endsWith('.m4a')
    ? outputUri.slice(0, -4) + '.concat.wav'
    : `${outputUri}.concat.wav`;

  try {
    await concatProcessedChunksToWav(chunks, intermediateWavUri);
    await encodeWavToM4a(intermediateWavUri, outputUri);
    console.info(`[ChunkPipeline] Encoded M4A → ${outputUri}`);
  } finally {
    await deleteFileIfExists(intermediateWavUri);
  }
}

/**
 * Dev-only smoke test: split a sample file into chunks and join them again.
 * Logs chunk count/durations; no UI wiring.
 */
export async function runChunkPipelineDevSmokeTest(): Promise<void> {
  if (!__DEV__) {
    return;
  }

  assertFfmpegAvailable();

  const sessionId = `smoke-${Crypto.randomUUID()}`;
  let inputUri: string | null = null;

  try {
    const { Asset } = await import('expo-asset');
    const asset = Asset.fromModule(require('../../../../assets/demo.mp3'));

    await asset.downloadAsync();
    inputUri = asset.localUri ?? asset.uri;

    if (!inputUri) {
      console.warn('[ChunkPipeline] Dev smoke test skipped — sample asset has no URI.');
      return;
    }

    const inputDurationSeconds = await probeAudioDurationSeconds(inputUri);
    console.info(
      `[ChunkPipeline] Dev smoke test start input="${inputUri}" duration=${inputDurationSeconds.toFixed(2)}s`,
    );

    const chunks = await splitAudioIntoChunkWavs({
      inputUri,
      sessionId,
      totalDurationSeconds: inputDurationSeconds,
    });

    await analyzeChunksAndPickPresets(chunks);

    const sessionDirUri = buildChunkSessionDirectoryUri(sessionId);
    const outputWavUri = `${sessionDirUri}smoke-concat.wav`;

    await concatProcessedChunksToWav(chunks, outputWavUri);

    const outputDurationSeconds = await probeAudioDurationSeconds(outputWavUri);
    const expectedMinDuration =
      inputDurationSeconds - CHUNK_CROSSFADE_SECONDS * Math.max(0, chunks.length - 1);

    console.info(
      `[ChunkPipeline] Dev smoke test OK chunks=${chunks.length} ` +
        `input=${inputDurationSeconds.toFixed(2)}s output=${outputDurationSeconds.toFixed(2)}s ` +
        `(expected≥${expectedMinDuration.toFixed(2)}s after crossfade)`,
    );
  } catch (error) {
    console.warn('[ChunkPipeline] Dev smoke test failed.', error);
  } finally {
    await deleteChunkSessionDirectory(sessionId);
  }
}

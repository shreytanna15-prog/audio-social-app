import {
  CHUNK_MAX_CHUNK_COUNT,
  CHUNK_MAX_RECORDING_SECONDS,
  CHUNK_MAX_SECONDS,
  CHUNK_MIN_DURATION_FOR_CHUNKING,
  CHUNK_MIN_SECONDS,
  CHUNK_NOISE_SAMPLE_SECONDS,
  CHUNK_TARGET_SECONDS,
} from '@/module/audio/domain/chunk-audio.constants';
import { probeVolumedetectMetrics } from '@/module/audio/services/ffmpeg.service';

export type ChunkBoundary = {
  index: number;
  startSeconds: number;
  durationSeconds: number;
};

export type ChunkAudioMetrics = {
  rmsDb: number;
  peakDb: number;
  noiseFloorDb: number;
};

export type ChunkAnalysisResult = {
  boundary: ChunkBoundary;
  metrics: ChunkAudioMetrics;
};

export function resolveEffectiveChunkSeconds(totalDurationSeconds: number): number {
  if (totalDurationSeconds <= CHUNK_TARGET_SECONDS) {
    return totalDurationSeconds;
  }

  const idealChunkCount = Math.ceil(totalDurationSeconds / CHUNK_TARGET_SECONDS);

  if (idealChunkCount <= CHUNK_MAX_CHUNK_COUNT) {
    return CHUNK_TARGET_SECONDS;
  }

  return Math.max(CHUNK_MIN_SECONDS, totalDurationSeconds / CHUNK_MAX_CHUNK_COUNT);
}

export function shouldUseChunkedPipeline(durationSeconds: number): boolean {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    return false;
  }

  if (durationSeconds < CHUNK_MIN_DURATION_FOR_CHUNKING) {
    return false;
  }

  if (durationSeconds > CHUNK_MAX_RECORDING_SECONDS) {
    return false;
  }

  const chunkTargetSeconds = resolveEffectiveChunkSeconds(durationSeconds);
  return durationSeconds > chunkTargetSeconds;
}

export function planChunkBoundaries(totalDurationSeconds: number): ChunkBoundary[] {
  if (!Number.isFinite(totalDurationSeconds) || totalDurationSeconds <= 0) {
    return [];
  }

  const chunkTargetSeconds = resolveEffectiveChunkSeconds(totalDurationSeconds);

  if (totalDurationSeconds <= chunkTargetSeconds) {
    return [
      {
        index: 0,
        startSeconds: 0,
        durationSeconds: totalDurationSeconds,
      },
    ];
  }

  const boundaries: ChunkBoundary[] = [];
  let startSeconds = 0;
  let index = 0;

  while (startSeconds < totalDurationSeconds - 0.001) {
    const remainingSeconds = totalDurationSeconds - startSeconds;
    const durationSeconds = Math.min(chunkTargetSeconds, remainingSeconds);

    boundaries.push({
      index,
      startSeconds,
      durationSeconds,
    });

    startSeconds += durationSeconds;
    index += 1;
  }

  return boundaries;
}

export function logChunkPlan(
  boundaries: ChunkBoundary[],
  totalDurationSeconds: number,
): void {
  console.info(
    `[ChunkPipeline] Planned ${boundaries.length} chunk(s) for total=${totalDurationSeconds.toFixed(2)}s ` +
      `(target=${CHUNK_TARGET_SECONDS}s, range=${CHUNK_MIN_SECONDS}-${CHUNK_MAX_SECONDS}s)`,
  );

  for (const boundary of boundaries) {
    console.info(
      `[ChunkPipeline] chunk#${boundary.index} start=${boundary.startSeconds.toFixed(3)}s ` +
        `duration=${boundary.durationSeconds.toFixed(3)}s`,
    );
  }
}

function resolveNoiseSampleDurationSeconds(chunkDurationSeconds: number): number {
  return Math.min(CHUNK_NOISE_SAMPLE_SECONDS, chunkDurationSeconds * 0.4);
}

export async function analyzeRecordingMetrics(
  inputUri: string,
  durationSeconds: number,
): Promise<ChunkAudioMetrics> {
  const fullMetrics = await probeVolumedetectMetrics({ inputUri });
  const noiseSampleSeconds = resolveNoiseSampleDurationSeconds(durationSeconds);
  const noiseMetrics = await probeVolumedetectMetrics({
    inputUri,
    startSeconds: 0,
    durationSeconds: noiseSampleSeconds,
  });

  return {
    rmsDb: fullMetrics.meanVolumeDb,
    peakDb: fullMetrics.maxVolumeDb,
    noiseFloorDb: noiseMetrics.meanVolumeDb,
  };
}

export async function analyzeChunkWav(
  chunkUri: string,
  boundary: ChunkBoundary,
): Promise<ChunkAnalysisResult> {
  const fullMetrics = await probeVolumedetectMetrics({ inputUri: chunkUri });
  const noiseSampleSeconds = resolveNoiseSampleDurationSeconds(boundary.durationSeconds);
  const noiseMetrics = await probeVolumedetectMetrics({
    inputUri: chunkUri,
    startSeconds: 0,
    durationSeconds: noiseSampleSeconds,
  });

  return {
    boundary,
    metrics: {
      rmsDb: fullMetrics.meanVolumeDb,
      peakDb: fullMetrics.maxVolumeDb,
      noiseFloorDb: noiseMetrics.meanVolumeDb,
    },
  };
}

import * as Crypto from 'expo-crypto';
import { File } from 'expo-file-system';

import { ensureRecordingsRoot } from '@/features/audio/data/recording-storage';
import { optimizeRecordingForPreview } from '@/features/audio/services/recording-optimize.service';
import type { OptimizePipelineId } from '@/features/audio/types/optimize-pipeline';
import { getProcessedRecordingUri } from '@/features/audio/utils/recording-paths';

/**
 * Run a Clean optimize pipeline from the pristine capture for editor A/B testing.
 * Writes into `_processed/` so session cleanup via deleteProcessedRecording works.
 */
export async function applyOptimizePipeline(
  pristineUri: string,
  pipelineId: OptimizePipelineId,
): Promise<string> {
  await ensureRecordingsRoot();

  const outputUri = getProcessedRecordingUri(
    `pipeline-${pipelineId}`,
    Crypto.randomUUID(),
  );

  const parent = new File(outputUri).parentDirectory;
  if (!parent.exists) {
    parent.create({ intermediates: true, idempotent: true });
  }

  console.warn(
    `[Pipeline] Applying ${pipelineId} Clean from pristine → ${outputUri}`,
  );

  return optimizeRecordingForPreview(pristineUri, outputUri, pipelineId);
}

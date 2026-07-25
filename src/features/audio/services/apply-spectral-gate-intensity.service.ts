import * as Crypto from 'expo-crypto';
import { File } from 'expo-file-system';

import { ensureRecordingsRoot } from '@/features/audio/data/recording-storage';
import {
  initSuperpowered,
  isSuperpoweredAvailable,
  processFileWithSpectralClean,
} from '@/features/audio/services/superpowered-audio.service';
import {
  getSpectralGateIntensityLabel,
  type SpectralGateIntensityId,
} from '@/features/audio/types/spectral-gate-intensity';
import { getProcessedDirectory } from '@/features/audio/utils/recording-paths';
import { toFileUri } from '@/features/audio/utils/ffmpeg-path';

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return String(error);
}

/**
 * Run SpectralGate at a bake-off intensity from the pristine capture.
 * Writes WAV into `_processed/` so session cleanup via deleteProcessedRecording works.
 */
export async function applySpectralGateIntensity(
  pristineUri: string,
  intensityId: SpectralGateIntensityId,
): Promise<string> {
  const label = getSpectralGateIntensityLabel(intensityId);

  try {
    if (!isSuperpoweredAvailable()) {
      throw new Error('Superpowered native module is not available for SpectralGate.');
    }

    const initialized = await initSuperpowered();
    if (!initialized) {
      throw new Error(
        'Superpowered init failed (check EXPO_PUBLIC_SUPERPOWERED_LICENSE_KEY).',
      );
    }

    await ensureRecordingsRoot();

    const outputUri = toFileUri(
      `${getProcessedDirectory()}${Crypto.randomUUID()}-gate-${intensityId}.wav`,
    );

    const parent = new File(outputUri).parentDirectory;
    if (!parent.exists) {
      parent.create({ intermediates: true, idempotent: true });
    }

    console.warn(`[GateLab] apply intensity='${intensityId}' (${label})…`);

    const result = await processFileWithSpectralClean(
      pristineUri,
      outputUri,
      intensityId,
    );

    console.warn(
      `[GateLab] OK intensity='${intensityId}' strategy=${result.strategy}` +
        (result.params ? ` ${result.params}` : ''),
    );

    return result.outputUri;
  } catch (error) {
    console.warn(
      `[GateLab] ERROR intensity='${intensityId}' (${label}): ${errorMessage(error)}`,
    );
    throw error;
  }
}

import { File } from 'expo-file-system';
import { documentDirectory } from 'expo-file-system/legacy';

import type { RecordingMode } from '@/features/audio/types/recording-mode';
import {
  resolvePolishPresetForMode,
  type SuperpoweredPolishPreset,
} from '@/features/audio/domain/superpowered-polish-presets';
import {
  initSuperpowered,
  isSuperpoweredAvailable,
  processFileWithSuperpowered,
} from '@/features/audio/services/superpowered-audio.service';
import { deleteFileIfExists, encodeWavToMp3 } from '@/features/audio/services/ffmpeg.service';
import { toFileUri } from '@/features/audio/utils/ffmpeg-path';

export type PolishRecordingInput = {
  inputUri: string;
  outputUri: string;
  preset?: SuperpoweredPolishPreset;
  mode?: RecordingMode;
};

export type PolishRecordingResult = {
  uri: string;
  strategy: string;
  preset: SuperpoweredPolishPreset;
};

function ensureParentDirectory(uri: string): void {
  const file = new File(uri);
  const parent = file.parentDirectory;

  if (!parent.exists) {
    parent.create({ intermediates: true, idempotent: true });
  }
}

function createTempWavUri(label: string): string {
  if (!documentDirectory) {
    throw new Error('Document directory is not available.');
  }

  const uri = toFileUri(`${documentDirectory}temp/superpowered-${label}-${Date.now()}.wav`);
  ensureParentDirectory(uri);
  return uri;
}

function wantsMp3(outputUri: string): boolean {
  return outputUri.toLowerCase().endsWith('.mp3');
}

/**
 * Shared Superpowered Clean polish (Phase 3).
 * Speech: HPF → 7-band EQ → de-esser → auto-threshold comp → limiter
 *   (DeepFilter runs in JS before this for speech mode).
 * Instrument / mixed: HPF → soft EQ → soft auto-threshold comp → limiter
 *   (Instrument: JS runs interference-soften before this; mixed may use light de-esser).
 * Delay/reverb: use editor effects after Clean (not auto-applied).
 * If output is .mp3, encodes via FFmpeg. Temp WAV always cleaned in `finally`.
 */
export async function polishRecordingWithSuperpowered({
  inputUri,
  outputUri,
  preset,
  mode = 'speech',
}: PolishRecordingInput): Promise<PolishRecordingResult> {
  const resolvedPreset = preset ?? resolvePolishPresetForMode(mode);
  const startedAt = Date.now();

  console.info(
    `[SuperpoweredPolish] start preset="${resolvedPreset}" input="${inputUri}" output="${outputUri}"`,
  );

  if (!isSuperpoweredAvailable()) {
    throw new Error('Superpowered native module is not available in this build.');
  }

  const initialized = await initSuperpowered();
  if (!initialized) {
    throw new Error('Superpowered init failed (check EXPO_PUBLIC_SUPERPOWERED_LICENSE_KEY).');
  }

  ensureParentDirectory(outputUri);

  const writeMp3 = wantsMp3(outputUri);
  const wavOutputUri = writeMp3 ? createTempWavUri(resolvedPreset) : outputUri;

  try {
    const nativeResult = await processFileWithSuperpowered(inputUri, wavOutputUri, {
      preset: resolvedPreset,
    });

    if (writeMp3) {
      await encodeWavToMp3(wavOutputUri, outputUri);
      console.info(`[SuperpoweredPolish] encoded MP3 → ${outputUri}`);
    }

    const strategy = nativeResult.strategy || `superpowered-${resolvedPreset}`;
    console.info(
      `[SuperpoweredPolish] done strategy="${strategy}" in ${Date.now() - startedAt}ms`,
    );

    return {
      uri: outputUri,
      strategy,
      preset: resolvedPreset,
    };
  } finally {
    if (writeMp3) {
      await deleteFileIfExists(wavOutputUri);
    }
  }
}

/**
 * Dev-only helper: logs availability + preset list. Does not touch the record pipeline.
 */
export async function logSuperpoweredPolishDevStatus(): Promise<void> {
  if (!__DEV__) {
    return;
  }

  console.info(
    `[SuperpoweredPolish] available=${isSuperpoweredAvailable()} presets=${[
      'speech-clean',
      'instrument-clean',
      'mixed-clean',
    ].join(',')}`,
  );

  const initialized = await initSuperpowered();
  console.info(`[SuperpoweredPolish] init=${initialized}`);
}

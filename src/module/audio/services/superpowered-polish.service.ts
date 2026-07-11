import { File } from 'expo-file-system';
import { documentDirectory } from 'expo-file-system/legacy';

import {
  resolvePolishPresetForMode,
  type SuperpoweredPolishPreset,
} from '@/module/audio/domain/superpowered-polish-presets';
import {
  initSuperpowered,
  isSuperpoweredAvailable,
  processFileWithSuperpowered,
} from '@/module/audio/services/superpowered-audio.service';
import { deleteFileIfExists, encodeWavToM4a } from '@/module/audio/services/ffmpeg.service';
import { toFileUri } from '@/module/audio/utils/ffmpeg-path';

export type PolishRecordingInput = {
  inputUri: string;
  outputUri: string;
  preset?: SuperpoweredPolishPreset;
  mode?: 'speech' | 'instrument' | 'mixed';
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

function wantsM4a(outputUri: string): boolean {
  return outputUri.toLowerCase().endsWith('.m4a');
}

/**
 * Shared Superpowered polish pipeline.
 * Native speech: decode → EQ → compressor → limiter → WAV.
 * Native instrument/mixed: decode → HPF → adaptive look-ahead cleaner → EQ → compressor → limiter → WAV.
 * If output is .m4a, encodes via FFmpeg. Temp WAV always cleaned in `finally`.
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

  const writeM4a = wantsM4a(outputUri);
  const wavOutputUri = writeM4a ? createTempWavUri(resolvedPreset) : outputUri;

  try {
    const nativeResult = await processFileWithSuperpowered(inputUri, wavOutputUri, {
      preset: resolvedPreset,
    });

    if (writeM4a) {
      await encodeWavToM4a(wavOutputUri, outputUri);
      console.info(`[SuperpoweredPolish] encoded M4A → ${outputUri}`);
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
    if (writeM4a) {
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
      'speech-polish',
      'instrument-polish',
      'mixed-polish',
    ].join(',')}`,
  );

  const initialized = await initSuperpowered();
  console.info(`[SuperpoweredPolish] init=${initialized}`);
}

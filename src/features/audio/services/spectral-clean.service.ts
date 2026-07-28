import { File } from 'expo-file-system';
import { documentDirectory } from 'expo-file-system/legacy';

import { SPECTRAL_INSTRUMENT_DEFAULTS } from '@/features/audio/domain/spectral-instrument-defaults';
import {
  deleteFileIfExists,
  encodeWavToMp3,
  resolveProcessedFileUri,
} from '@/features/audio/services/ffmpeg.service';
import {
  initSuperpowered,
  isSuperpoweredAvailable,
  processFileWithSpectralClean,
} from '@/features/audio/services/superpowered-audio.service';
import { toFileUri } from '@/features/audio/utils/ffmpeg-path';

/** Soft spectral interference soften (quietest-region profile → soft mask). */
export const SPECTRAL_INSTRUMENT_STRATEGY = 'interference-soften';

export const SPECTRAL_INSTRUMENT_PASSTHROUGH_STRATEGY = 'spectral-instrument-passthrough';
export const SPECTRAL_INSTRUMENT_STUB_STRATEGY = 'spectral-instrument-stub';

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

  const uri = toFileUri(`${documentDirectory}temp/spectral-${label}-${Date.now()}.wav`);
  ensureParentDirectory(uri);
  return uri;
}

function wantsMp3(outputUri: string): boolean {
  return outputUri.toLowerCase().endsWith('.mp3');
}

async function readRecordingBytes(sourceUri: string): Promise<Uint8Array> {
  const source = new File(sourceUri);

  if (source.exists) {
    return source.bytes();
  }

  const response = await fetch(sourceUri);
  if (!response.ok) {
    throw new Error(`Recording file is not accessible: ${sourceUri}`);
  }

  return new Uint8Array(await response.arrayBuffer());
}

async function fallbackByteCopyPassthrough(
  inputUri: string,
  outputUri: string,
): Promise<{ uri: string; strategy: string }> {
  console.warn(
    '[SpectralClean] Native spectral clean unavailable — byte-copy stub. Rebuild native app for Phase 4.',
  );

  ensureParentDirectory(outputUri);

  const bytes = await readRecordingBytes(inputUri);
  const destination = new File(outputUri);
  destination.create({ overwrite: true });
  destination.write(bytes);

  return {
    uri: resolveProcessedFileUri(outputUri),
    strategy: SPECTRAL_INSTRUMENT_STUB_STRATEGY,
  };
}

/**
 * Interference soften only: decode → soft spectral mask → peak normalize → WAV (or MP3).
 * Instrument optimize calls this, then light Superpowered polish.
 */
export async function cleanInstrumentRecording(
  inputUri: string,
  outputUri: string,
): Promise<{ uri: string; strategy: string }> {
  if (!isSuperpoweredAvailable()) {
    return fallbackByteCopyPassthrough(inputUri, outputUri);
  }

  const initialized = await initSuperpowered();
  if (!initialized) {
    return fallbackByteCopyPassthrough(inputUri, outputUri);
  }

  ensureParentDirectory(outputUri);

  const writeMp3 = wantsMp3(outputUri);
  const wavOutputUri = writeMp3 ? createTempWavUri('soften') : outputUri;
  const startedAt = Date.now();

  try {
    console.info(
      `[SpectralClean] interference-soften start strategy="${SPECTRAL_INSTRUMENT_STRATEGY}" ` +
        `prop_decrease=${SPECTRAL_INSTRUMENT_DEFAULTS.propDecrease} ` +
        `hiss_prop=${SPECTRAL_INSTRUMENT_DEFAULTS.hissPropDecrease} ` +
        `hiss_hz=${SPECTRAL_INSTRUMENT_DEFAULTS.hissStartHz}-${SPECTRAL_INSTRUMENT_DEFAULTS.hissFullHz} ` +
        `scale=${SPECTRAL_INSTRUMENT_DEFAULTS.scaleFactor} rise_alpha=${SPECTRAL_INSTRUMENT_DEFAULTS.riseAlpha} ` +
        `transient_thresh=${SPECTRAL_INSTRUMENT_DEFAULTS.transientThreshold} ` +
        `peak_target=${SPECTRAL_INSTRUMENT_DEFAULTS.peakTarget.toFixed(2)} ` +
        `input="${inputUri}"`,
    );

    const nativeResult = await processFileWithSpectralClean(inputUri, wavOutputUri, 'mild');

    if (writeMp3) {
      await encodeWavToMp3(wavOutputUri, outputUri);
      console.info(`[SpectralClean] encoded MP3 → ${outputUri}`);
    }

    const strategy = SPECTRAL_INSTRUMENT_STRATEGY;
    const elapsedMs = Date.now() - startedAt;
    const params =
      nativeResult.params ??
      `strategy=${strategy} prop_decrease=${SPECTRAL_INSTRUMENT_DEFAULTS.propDecrease} ` +
        `peak_target=${SPECTRAL_INSTRUMENT_DEFAULTS.peakTarget.toFixed(2)} duration_ms=${elapsedMs}`;

    console.info(`[SpectralClean] done ${params} js_duration_ms=${elapsedMs}`);

    return {
      uri: resolveProcessedFileUri(outputUri),
      strategy,
    };
  } catch (error) {
    console.warn(
      `[SpectralClean] interference-soften failed after ${Date.now() - startedAt}ms; using stub.`,
      error,
    );
    return fallbackByteCopyPassthrough(inputUri, outputUri);
  } finally {
    if (writeMp3) {
      await deleteFileIfExists(wavOutputUri);
    }
  }
}

/**
 * Soften to a temporary WAV only (for chaining into polish). Throws if native soften fails.
 */
export async function softenInstrumentToWav(
  inputUri: string,
  outputWavUri: string,
): Promise<{ uri: string; strategy: string; params?: string }> {
  if (!isSuperpoweredAvailable()) {
    throw new Error('Superpowered native module is not available for interference-soften.');
  }

  const initialized = await initSuperpowered();
  if (!initialized) {
    throw new Error('Superpowered init failed (check EXPO_PUBLIC_SUPERPOWERED_LICENSE_KEY).');
  }

  ensureParentDirectory(outputWavUri);

  console.info(
    `[SpectralClean] soften→wav prop_decrease=${SPECTRAL_INSTRUMENT_DEFAULTS.propDecrease} ` +
      `hiss_prop=${SPECTRAL_INSTRUMENT_DEFAULTS.hissPropDecrease} ` +
      `input="${inputUri}"`,
  );

  const nativeResult = await processFileWithSpectralClean(inputUri, outputWavUri, 'mild');
  return {
    uri: resolveProcessedFileUri(outputWavUri),
    strategy: SPECTRAL_INSTRUMENT_STRATEGY,
    params: nativeResult.params,
  };
}

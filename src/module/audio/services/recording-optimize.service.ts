import { Platform } from 'react-native';
import { File } from 'expo-file-system';
import { documentDirectory } from 'expo-file-system/legacy';

import {
  getArnndnModelLabel,
  resolveArnndnModelPaths,
} from '@/module/audio/data/arnndn-model.repository';
import {
  buildDefaultAfftdnOptimizeFilter,
  buildDefaultArnndnOptimizeFilter,
  buildDefaultPolishOnlyFilter,
} from '@/module/audio/domain/default-audio-optimize';
import { isRecoverableArnndnError } from '@/module/audio/domain/audio-effect-errors';
import {
  isShortClip,
  SHORT_CLIP_MAX_SECONDS,
} from '@/module/audio/domain/recording-optimize.constants';
import {
  logChosenOptimizeStrategy,
  logFfmpegDenoiseFilterAvailability,
  logOptimizeDuration,
  resolveFfmpegDenoiseFilterAvailability,
} from '@/module/audio/domain/recording-optimize-log';
import {
  deleteFileIfExists,
  resolveProcessedFileUri,
  runFfmpegAudioFilter,
} from '@/module/audio/services/ffmpeg.service';
import {
  initSuperpowered,
  isSuperpoweredAvailable,
} from '@/module/audio/services/superpowered-audio.service';
import { assertFfmpegAvailable } from '@/module/audio/utils/ffmpeg-availability';
import { toFileUri } from '@/module/audio/utils/ffmpeg-path';
import type { RecordingMode } from '@/module/audio/types/recording-mode';

type OptimizeStrategy = 'arnndn-with-mix' | 'arnndn' | 'afftdn';

const OPTIMIZE_STRATEGIES: OptimizeStrategy[] = ['arnndn-with-mix', 'arnndn', 'afftdn'];

const SPEECH_SUPERPOWERED_STRATEGY = 'deepfilter + superpowered-speech';
const SPEECH_SHORT_SUPERPOWERED_STRATEGY = 'superpowered-speech-short';
const INSTRUMENT_SUPERPOWERED_STRATEGY = 'superpowered-instrument';
const MIXED_SUPERPOWERED_STRATEGY = 'superpowered-mixed';

function buildOptimizeFilter(
  strategy: OptimizeStrategy,
  modelPath: string | null,
  includeLoudnorm: boolean,
): string {
  if ((strategy === 'arnndn-with-mix' || strategy === 'arnndn') && modelPath) {
    return buildDefaultArnndnOptimizeFilter(modelPath, strategy === 'arnndn-with-mix', {
      includeLoudnorm,
    });
  }

  return buildDefaultAfftdnOptimizeFilter({ includeLoudnorm });
}

async function runOptimizeWithFilter(
  inputUri: string,
  outputUri: string,
  audioFilter: string,
  useLosslessIntermediate: boolean,
): Promise<void> {
  await runFfmpegAudioFilter({
    inputUri,
    outputUri,
    audioFilter,
    useLosslessIntermediate,
  });
}

function createTempDenoisedWavUri(): string {
  if (!documentDirectory) {
    throw new Error('Document directory is not available.');
  }

  const uri = toFileUri(`${documentDirectory}temp/deepfilter-denoised-${Date.now()}.wav`);
  const parent = new File(uri).parentDirectory;
  if (!parent.exists) {
    parent.create({ intermediates: true, idempotent: true });
  }
  return uri;
}

/** Never throws — false when native module missing, init fails, or license missing. */
async function canUseSuperpowered(): Promise<boolean> {
  if (!isSuperpoweredAvailable()) {
    return false;
  }

  return initSuperpowered();
}

async function tryPolishWithSuperpowered(input: {
  inputUri: string;
  outputUri: string;
  mode: RecordingMode;
  preset: 'speech-polish' | 'instrument-polish' | 'mixed-polish';
}): Promise<string | null> {
  if (!(await canUseSuperpowered())) {
    console.info('[Optimize] Superpowered unavailable; skipping native polish.');
    return null;
  }

  try {
    const { polishRecordingWithSuperpowered } = await import(
      '@/module/audio/services/superpowered-polish.service'
    );

    await polishRecordingWithSuperpowered({
      inputUri: input.inputUri,
      outputUri: input.outputUri,
      mode: input.mode,
      preset: input.preset,
    });

    return resolveProcessedFileUri(input.outputUri);
  } catch (error) {
    console.warn('[Optimize] Superpowered polish failed.', error);
    return null;
  }
}

/**
 * Primary speech path: DeepFilterNet denoise → Superpowered speech polish.
 * Temp denoised WAV is always removed in `finally`.
 */
async function tryOptimizeSpeechWithDeepFilterAndSuperpowered(
  inputUri: string,
  outputUri: string,
): Promise<{ uri: string; strategy: string } | null> {
  const {
    isDeepFilterDenoiseAvailable,
    denoiseRecordingWithDeepFilter,
    polishAndEncodeWav,
  } = await import('@/module/audio/services/deepfilter-denoise.service');

  if (!(await isDeepFilterDenoiseAvailable())) {
    return null;
  }

  const denoisedWavUri = createTempDenoisedWavUri();

  try {
    console.info('[Optimize] Trying DeepFilterNet denoise.');
    await denoiseRecordingWithDeepFilter(inputUri, denoisedWavUri, (progress) => {
      if (progress % 25 === 0) {
        console.info(`[Optimize] DeepFilter progress ${progress}%`);
      }
    });

    const superpoweredUri = await tryPolishWithSuperpowered({
      inputUri: denoisedWavUri,
      outputUri,
      mode: 'speech',
      preset: 'speech-polish',
    });

    if (superpoweredUri) {
      logChosenOptimizeStrategy('speech', SPEECH_SUPERPOWERED_STRATEGY);
      console.info(`[Optimize] Applied ${SPEECH_SUPERPOWERED_STRATEGY}.`);
      return { uri: superpoweredUri, strategy: SPEECH_SUPERPOWERED_STRATEGY };
    }

    console.info('[Optimize] Falling back to DeepFilter + FFmpeg polish.');
    await polishAndEncodeWav(denoisedWavUri, outputUri, buildDefaultPolishOnlyFilter());
    logChosenOptimizeStrategy('speech', 'deepfilter-net');
    console.info('[Optimize] Applied DeepFilterNet + FFmpeg polish fallback.');
    return { uri: resolveProcessedFileUri(outputUri), strategy: 'deepfilter-net' };
  } catch (error) {
    console.warn('[Optimize] DeepFilterNet failed. Falling back to arnndn/afftdn.', error);
    return null;
  } finally {
    await deleteFileIfExists(denoisedWavUri);
  }
}

async function optimizeSpeechRecordingWithFfmpegFallbacks(
  inputUri: string,
  outputUri: string,
  includeLoudnorm: boolean,
): Promise<{ uri: string; strategy: string }> {
  const filterAvailability = await resolveFfmpegDenoiseFilterAvailability();
  logFfmpegDenoiseFilterAvailability(filterAvailability);

  const modelPaths = await resolveArnndnModelPaths();
  console.info(`[Optimize] Loaded ${modelPaths.length} RNNoise model(s).`);

  const useLosslessIntermediate = includeLoudnorm;

  if (modelPaths.length > 0) {
    let lastError: unknown;

    for (const modelPath of modelPaths) {
      for (const strategy of OPTIMIZE_STRATEGIES) {
        if (strategy === 'afftdn') {
          continue;
        }

        const audioFilter = buildOptimizeFilter(strategy, modelPath, includeLoudnorm);
        const modelLabel = getArnndnModelLabel(modelPath);

        try {
          console.info(`[Optimize] Trying strategy="${strategy}" model="${modelLabel}"`);
          await runOptimizeWithFilter(
            inputUri,
            outputUri,
            audioFilter,
            useLosslessIntermediate,
          );
          logChosenOptimizeStrategy('speech', strategy);
          console.info(`[Optimize] Applied strategy="${strategy}" model="${modelLabel}"`);
          return { uri: resolveProcessedFileUri(outputUri), strategy };
        } catch (error) {
          lastError = error;

          if (!isRecoverableArnndnError(error)) {
            throw error;
          }

          console.warn(
            `[Optimize] Failed strategy="${strategy}" model="${modelLabel}".`,
            error,
          );
        }
      }
    }

    console.warn('[Optimize] All arnndn attempts failed. Falling back to afftdn.', lastError);
  }

  const afftdnFilter = buildOptimizeFilter('afftdn', null, includeLoudnorm);
  console.info('[Optimize] Applying afftdn fallback.');
  await runOptimizeWithFilter(inputUri, outputUri, afftdnFilter, useLosslessIntermediate);
  logChosenOptimizeStrategy('speech', 'afftdn');

  return { uri: resolveProcessedFileUri(outputUri), strategy: 'afftdn' };
}

async function optimizeSpeechRecordingForPreview(
  inputUri: string,
  outputUri: string,
  durationSeconds?: number,
): Promise<{ uri: string; strategy: string }> {
  const shortClip = isShortClip(durationSeconds);

  if (shortClip) {
    console.info(
      `[Optimize] Short clip (${durationSeconds?.toFixed(2)}s < ${SHORT_CLIP_MAX_SECONDS}s); skipping DeepFilter/loudnorm.`,
    );

    const superpoweredUri = await tryPolishWithSuperpowered({
      inputUri,
      outputUri,
      mode: 'speech',
      preset: 'speech-polish',
    });

    if (superpoweredUri) {
      logChosenOptimizeStrategy('speech', SPEECH_SHORT_SUPERPOWERED_STRATEGY);
      return { uri: superpoweredUri, strategy: SPEECH_SHORT_SUPERPOWERED_STRATEGY };
    }

    await runOptimizeWithFilter(
      inputUri,
      outputUri,
      buildDefaultPolishOnlyFilter({ includeLoudnorm: false }),
      false,
    );
    logChosenOptimizeStrategy('speech', 'polish-only');
    return { uri: resolveProcessedFileUri(outputUri), strategy: 'polish-only' };
  }

  const primaryResult = await tryOptimizeSpeechWithDeepFilterAndSuperpowered(
    inputUri,
    outputUri,
  );

  if (primaryResult) {
    return primaryResult;
  }

  return optimizeSpeechRecordingWithFfmpegFallbacks(inputUri, outputUri, true);
}

/**
 * Instrument / mixed: Superpowered only (HPF → adaptive cleaner → EQ → comp → limiter).
 * No DeepFilter (destroys music). No FFmpeg polish in optimize.
 */
async function optimizeNonSpeechWithSuperpowered(
  inputUri: string,
  outputUri: string,
  mode: 'instrument' | 'mixed',
  preset: 'instrument-polish' | 'mixed-polish',
  strategy: string,
): Promise<{ uri: string; strategy: string }> {
  const superpoweredUri = await tryPolishWithSuperpowered({
    inputUri,
    outputUri,
    mode,
    preset,
  });

  if (!superpoweredUri) {
    throw new Error(
      `${mode} optimize requires Superpowered (soft gate + polish). Native module unavailable or failed.`,
    );
  }

  logChosenOptimizeStrategy(mode, strategy);
  console.info(`[Optimize] Applied ${strategy}.`);
  return { uri: superpoweredUri, strategy };
}

/**
 * Post-record enhance for preview/editor.
 * Speech: DeepFilter → Superpowered (FFmpeg denoise only as last-resort fallback).
 * Instrument / mixed: Superpowered soft gate + polish only (no FFmpeg, no DeepFilter).
 * Short clips (<3s): speech skips DeepFilter/loudnorm; instrument/mixed still use Superpowered.
 * Editor effects (reverb, echo, etc.) stay on FFmpeg via audio-effects.service — unchanged.
 */
export async function optimizeRecordingForPreview(
  inputUri: string,
  outputUri: string,
  mode: RecordingMode = 'speech',
  durationSeconds?: number,
): Promise<string> {
  if (Platform.OS === 'web') {
    throw new Error('Recording optimization is only available on iOS and Android.');
  }

  const startedAt = Date.now();
  const shortClip = isShortClip(durationSeconds);
  let strategyLabel = String(mode);

  try {
    console.info(
      `[Optimize] start mode="${mode}" duration=${durationSeconds?.toFixed(2) ?? 'unknown'}s shortClip=${shortClip}`,
    );

    if (mode === 'instrument' || mode === 'mixed') {
      // M4A encode after Superpowered WAV still uses FFmpeg; denoise/polish do not.
      assertFfmpegAvailable();
    }

    if (mode === 'instrument') {
      const result = await optimizeNonSpeechWithSuperpowered(
        inputUri,
        outputUri,
        'instrument',
        'instrument-polish',
        INSTRUMENT_SUPERPOWERED_STRATEGY,
      );
      strategyLabel = result.strategy;
      logOptimizeDuration('instrument', strategyLabel, Date.now() - startedAt);
      return result.uri;
    }

    if (mode === 'mixed') {
      const result = await optimizeNonSpeechWithSuperpowered(
        inputUri,
        outputUri,
        'mixed',
        'mixed-polish',
        MIXED_SUPERPOWERED_STRATEGY,
      );
      strategyLabel = result.strategy;
      logOptimizeDuration('mixed', strategyLabel, Date.now() - startedAt);
      return result.uri;
    }

    // Speech path still uses FFmpeg for encode fallbacks / DeepFilter polish encode.
    assertFfmpegAvailable();

    const result = await optimizeSpeechRecordingForPreview(
      inputUri,
      outputUri,
      durationSeconds,
    );
    strategyLabel = result.strategy;
    logOptimizeDuration('speech', strategyLabel, Date.now() - startedAt);
    return result.uri;
  } catch (error) {
    logOptimizeDuration(mode, `error:${strategyLabel}`, Date.now() - startedAt);
    console.warn(`[Optimize] ${mode} enhance failed after ${Date.now() - startedAt}ms.`, error);
    throw error;
  }
}

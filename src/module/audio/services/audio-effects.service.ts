import { Platform } from 'react-native';

import {
  getArnndnModelLabel,
  resolveArnndnModelPaths,
} from '@/module/audio/data/arnndn-model.repository';
import { createProcessedRecordingUri } from '@/module/audio/data/processed-recording.repository';
import { getCombinedAudioEffectFilter } from '@/module/audio/domain/audio-effect-filters';
import {
  AudioEffectsError,
  isRecoverableArnndnError,
} from '@/module/audio/domain/audio-effect-errors';
import type { DenoiseStrategy } from '@/module/audio/domain/effect-filter-builders';
import { resolveProcessedFileUri, runFfmpegAudioFilter } from '@/module/audio/services/ffmpeg.service';
import type { AppliedEffect } from '@/module/audio/types/applied-effects';
import { assertFfmpegAvailable, FFMPEG_UNAVAILABLE_MESSAGE } from '@/module/audio/utils/ffmpeg-availability';

const ARNNDN_STRATEGIES: DenoiseStrategy[] = ['arnndn-with-mix', 'arnndn'];

export type DenoiseRunInfo = {
  strategy: DenoiseStrategy;
  model: string | null;
  audioFilter: string;
};

let lastDenoiseRunInfo: DenoiseRunInfo | null = null;

export function getLastDenoiseRunInfo(): DenoiseRunInfo | null {
  return lastDenoiseRunInfo;
}

function logDenoiseAttempt(strategy: DenoiseStrategy, modelPath: string | null, audioFilter: string): void {
  const modelLabel = modelPath ? getArnndnModelLabel(modelPath) : 'none';
  console.info(`[Denoise] Trying strategy="${strategy}" model="${modelLabel}"`);
  console.info(`[Denoise] Filter chain: ${audioFilter}`);
}

function logDenoiseSuccess(info: DenoiseRunInfo): void {
  const modelLabel = info.model ? getArnndnModelLabel(info.model) : 'none';
  console.info(`[Denoise] Applied strategy="${info.strategy}" model="${modelLabel}"`);
}

async function runEffectsWithStrategy(
  appliedEffects: AppliedEffect[],
  inputUri: string,
  outputUri: string,
  denoiseStrategy: DenoiseStrategy,
  arnndnModelPath: string | null,
  useLosslessIntermediate: boolean,
): Promise<DenoiseRunInfo | null> {
  const audioFilter = getCombinedAudioEffectFilter(appliedEffects, {
    denoiseStrategy,
    arnndnModelPath,
  });
  const hasDenoise = appliedEffects.some((effect) => effect.id === 'denoise');

  if (hasDenoise) {
    logDenoiseAttempt(denoiseStrategy, arnndnModelPath, audioFilter);
  }

  await runFfmpegAudioFilter({
    inputUri,
    outputUri,
    audioFilter,
    useLosslessIntermediate,
  });

  if (!hasDenoise) {
    return null;
  }

  return {
    strategy: denoiseStrategy,
    model: arnndnModelPath,
    audioFilter,
  };
}

export async function applyAudioEffects(
  appliedEffects: AppliedEffect[],
  inputUri: string,
): Promise<string> {
  if (Platform.OS === 'web') {
    throw new AudioEffectsError({
      title: 'Effects not available',
      message: 'Audio effects are only available on iOS and Android.',
    });
  }

  assertFfmpegAvailable();

  if (appliedEffects.length === 0) {
    throw new AudioEffectsError({
      title: 'No effects selected',
      message: 'Select at least one effect to process this recording.',
    });
  }

  const outputUri = createProcessedRecordingUri(appliedEffects);
  const hasDenoise = appliedEffects.some((effect) => effect.id === 'denoise');
  const useLosslessIntermediate = hasDenoise;
  const arnndnModelPaths = hasDenoise ? await resolveArnndnModelPaths() : [];

  if (hasDenoise) {
    console.info(`[Denoise] Loaded ${arnndnModelPaths.length} RNNoise model(s).`);

    if (arnndnModelPaths.length === 0) {
      console.warn('[Denoise] No RNNoise models available. Falling back to afftdn.');
    }
  }

  if (hasDenoise && arnndnModelPaths.length > 0) {
    let lastError: unknown;

    for (const modelPath of arnndnModelPaths) {
      for (const strategy of ARNNDN_STRATEGIES) {
        try {
          const runInfo = await runEffectsWithStrategy(
            appliedEffects,
            inputUri,
            outputUri,
            strategy,
            modelPath,
            useLosslessIntermediate,
          );

          if (runInfo) {
            lastDenoiseRunInfo = runInfo;
            logDenoiseSuccess(runInfo);
          }

          return resolveProcessedFileUri(outputUri);
        } catch (error) {
          lastError = error;

          if (!isRecoverableArnndnError(error)) {
            throw error;
          }

          console.warn(
            `[Denoise] Failed strategy="${strategy}" model="${getArnndnModelLabel(modelPath)}".`,
            error,
          );
        }
      }
    }

    console.warn('[Denoise] All arnndn attempts failed. Falling back to afftdn.');
    lastError = lastError ?? new Error('All arnndn strategies failed.');
  }

  if (hasDenoise) {
    const runInfo = await runEffectsWithStrategy(
      appliedEffects,
      inputUri,
      outputUri,
      'afftdn',
      null,
      useLosslessIntermediate,
    );

    if (runInfo) {
      lastDenoiseRunInfo = runInfo;
      logDenoiseSuccess(runInfo);
    }

    return resolveProcessedFileUri(outputUri);
  }

  await runEffectsWithStrategy(
    appliedEffects,
    inputUri,
    outputUri,
    'afftdn',
    null,
    false,
  );

  return resolveProcessedFileUri(outputUri);
}

export { FFMPEG_UNAVAILABLE_MESSAGE };

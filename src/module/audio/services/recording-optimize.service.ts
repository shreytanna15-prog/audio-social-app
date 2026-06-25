import { Platform } from 'react-native';

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
  deleteFileIfExists,
  resolveProcessedFileUri,
  runFfmpegAudioFilter,
} from '@/module/audio/services/ffmpeg.service';
import { assertFfmpegAvailable } from '@/module/audio/utils/ffmpeg-availability';
import { toFileUri } from '@/module/audio/utils/ffmpeg-path';
import { documentDirectory } from 'expo-file-system/legacy';

type OptimizeStrategy = 'arnndn-with-mix' | 'arnndn' | 'afftdn';

const OPTIMIZE_STRATEGIES: OptimizeStrategy[] = ['arnndn-with-mix', 'arnndn', 'afftdn'];

function buildOptimizeFilter(strategy: OptimizeStrategy, modelPath: string | null): string {
  if ((strategy === 'arnndn-with-mix' || strategy === 'arnndn') && modelPath) {
    return buildDefaultArnndnOptimizeFilter(modelPath, strategy === 'arnndn-with-mix');
  }

  return buildDefaultAfftdnOptimizeFilter();
}

async function runOptimizeWithFilter(
  inputUri: string,
  outputUri: string,
  audioFilter: string,
): Promise<void> {
  await runFfmpegAudioFilter({
    inputUri,
    outputUri,
    audioFilter,
    useLosslessIntermediate: true,
  });
}

function createTempDenoisedWavUri(): string {
  if (!documentDirectory) {
    throw new Error('Document directory is not available.');
  }

  return toFileUri(`${documentDirectory}temp/deepfilter-denoised-${Date.now()}.wav`);
}

async function tryOptimizeWithDeepFilter(
  inputUri: string,
  outputUri: string,
): Promise<string | null> {
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
    await polishAndEncodeWav(denoisedWavUri, outputUri, buildDefaultPolishOnlyFilter());
    console.info('[Optimize] Applied DeepFilterNet + polish.');
    return resolveProcessedFileUri(outputUri);
  } catch (error) {
    console.warn('[Optimize] DeepFilterNet failed. Falling back to arnndn.', error);
    return null;
  } finally {
    await deleteFileIfExists(denoisedWavUri);
  }
}

export async function optimizeRecordingForPreview(
  inputUri: string,
  outputUri: string,
): Promise<string> {
  if (Platform.OS === 'web') {
    throw new Error('Recording optimization is only available on iOS and Android.');
  }

  assertFfmpegAvailable();

  const deepFilterResult = await tryOptimizeWithDeepFilter(inputUri, outputUri);
  if (deepFilterResult) {
    return deepFilterResult;
  }

  const modelPaths = await resolveArnndnModelPaths();
  console.info(`[Optimize] Loaded ${modelPaths.length} RNNoise model(s).`);

  if (modelPaths.length > 0) {
    let lastError: unknown;

    for (const modelPath of modelPaths) {
      for (const strategy of OPTIMIZE_STRATEGIES) {
        if (strategy === 'afftdn') {
          continue;
        }

        const audioFilter = buildOptimizeFilter(strategy, modelPath);
        const modelLabel = getArnndnModelLabel(modelPath);

        try {
          console.info(`[Optimize] Trying strategy="${strategy}" model="${modelLabel}"`);
          await runOptimizeWithFilter(inputUri, outputUri, audioFilter);
          console.info(`[Optimize] Applied strategy="${strategy}" model="${modelLabel}"`);
          return resolveProcessedFileUri(outputUri);
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

  const afftdnFilter = buildOptimizeFilter('afftdn', null);
  console.info('[Optimize] Applying afftdn fallback.');
  await runOptimizeWithFilter(inputUri, outputUri, afftdnFilter);

  return resolveProcessedFileUri(outputUri);
}

import { File } from 'expo-file-system';
import { documentDirectory } from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import { createProcessedRecordingUri } from '@/features/audio/data/processed-recording.repository';
import {
  EFFECT_APPLICATION_ORDER,
} from '@/features/audio/domain/effect-definitions';
import { AudioEffectsError } from '@/features/audio/domain/audio-effect-errors';
import {
  deleteFileIfExists,
  encodeWavToMp3,
  resolveProcessedFileUri,
} from '@/features/audio/services/ffmpeg.service';
import {
  initSuperpowered,
  isSuperpoweredAvailable,
  processFileWithSuperpoweredEffects,
} from '@/features/audio/services/superpowered-audio.service';
import type { AppliedEffect } from '@/features/audio/types/applied-effects';
import type { AudioEffectId } from '@/features/audio/types/effects';
import { FFMPEG_UNAVAILABLE_MESSAGE, assertFfmpegAvailable } from '@/features/audio/utils/ffmpeg-availability';
import { toFileUri } from '@/features/audio/utils/ffmpeg-path';

export type DenoiseRunInfo = {
  strategy: 'deepfilter';
  model: string | null;
};

let lastDenoiseRunInfo: DenoiseRunInfo | null = null;

export function getLastDenoiseRunInfo(): DenoiseRunInfo | null {
  return lastDenoiseRunInfo;
}

function createTempUri(prefix: string, extension: string): string {
  if (!documentDirectory) {
    throw new Error('Document directory is not available.');
  }

  const uri = toFileUri(`${documentDirectory}temp/${prefix}-${Date.now()}.${extension}`);
  const parent = new File(uri).parentDirectory;
  if (!parent.exists) {
    parent.create({ intermediates: true, idempotent: true });
  }
  return uri;
}

function sortAppliedEffects(appliedEffects: AppliedEffect[]): AppliedEffect[] {
  const order = new Map(
    EFFECT_APPLICATION_ORDER.map((id, index) => [id, index] as const),
  );

  return [...appliedEffects].sort((left, right) => {
    const leftOrder = order.get(left.id as AudioEffectId) ?? 99;
    const rightOrder = order.get(right.id as AudioEffectId) ?? 99;
    return leftOrder - rightOrder;
  });
}

function buildEffectsJson(appliedEffects: AppliedEffect[]): string {
  const payload = appliedEffects
    .filter((effect) => effect.id !== 'denoise')
    .map((effect) => ({
      id: effect.id,
      params: effect.params,
    }));

  return JSON.stringify(payload);
}

function wantsMp3(outputUri: string): boolean {
  return outputUri.toLowerCase().endsWith('.mp3');
}

/**
 * Editor effects:
 * - Denoise → on-device DeepFilter
 * - reverb / echo / modulate / enhance → Superpowered
 * - FFmpeg only for WAV → MP3 encode when needed
 */
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

  if (appliedEffects.length === 0) {
    throw new AudioEffectsError({
      title: 'No effects selected',
      message: 'Select at least one effect to process this recording.',
    });
  }

  const ordered = sortAppliedEffects(appliedEffects);
  const hasDenoise = ordered.some((effect) => effect.id === 'denoise');
  const hasSuperpoweredFx = ordered.some((effect) => effect.id !== 'denoise');
  const outputUri = createProcessedRecordingUri(ordered);

  let workingUri = inputUri;
  const tempUris: string[] = [];

  try {
    if (hasDenoise) {
      assertFfmpegAvailable();

      const {
        isDeepFilterDenoiseAvailable,
        denoiseRecordingWithDeepFilter,
      } = await import('@/features/audio/services/deepfilter-denoise.service');

      if (!(await isDeepFilterDenoiseAvailable())) {
        throw new AudioEffectsError({
          title: 'Denoise unavailable',
          message: 'DeepFilter is not available on this device. Try again after the model finishes downloading.',
        });
      }

      const denoisedUri = createTempUri('editor-deepfilter', 'wav');
      tempUris.push(denoisedUri);

      console.info('[Effects] Denoise via DeepFilter.');
      await denoiseRecordingWithDeepFilter(inputUri, denoisedUri);
      workingUri = denoisedUri;
      lastDenoiseRunInfo = { strategy: 'deepfilter', model: 'denoiser_model.ort' };
    } else {
      lastDenoiseRunInfo = null;
    }

    if (hasSuperpoweredFx) {
      if (!isSuperpoweredAvailable()) {
        throw new AudioEffectsError({
          title: 'Effects unavailable',
          message: 'Superpowered is not available in this build. Use a development build with the native module.',
        });
      }

      const initialized = await initSuperpowered();
      if (!initialized) {
        throw new AudioEffectsError({
          title: 'Effects unavailable',
          message: 'Could not initialize Superpowered. Check EXPO_PUBLIC_SUPERPOWERED_LICENSE_KEY.',
        });
      }

      const effectsJson = buildEffectsJson(ordered);
      const writeMp3 = wantsMp3(outputUri);
      const wavOutputUri = writeMp3
        ? createTempUri('editor-effects', 'wav')
        : outputUri;

      if (writeMp3) {
        tempUris.push(wavOutputUri);
      }

      console.info(`[Effects] Superpowered chain: ${effectsJson}`);
      await processFileWithSuperpoweredEffects(workingUri, wavOutputUri, effectsJson);

      if (writeMp3) {
        assertFfmpegAvailable();
        await encodeWavToMp3(wavOutputUri, outputUri);
      }
    } else {
      // Denoise-only: encode DeepFilter WAV to the expected output format.
      assertFfmpegAvailable();
      if (wantsMp3(outputUri)) {
        await encodeWavToMp3(workingUri, outputUri);
      } else {
        const destination = new File(outputUri);
        const source = new File(workingUri);
        destination.create({ overwrite: true });
        destination.write(await source.bytes());
      }
    }

    return resolveProcessedFileUri(outputUri);
  } catch (error) {
    if (error instanceof AudioEffectsError) {
      throw error;
    }

    throw new AudioEffectsError({
      title: 'Effects failed',
      message: error instanceof Error ? error.message : 'Could not apply effects to this recording.',
      debugDetails: error instanceof Error ? error.stack : undefined,
    });
  } finally {
    await Promise.all(tempUris.map((uri) => deleteFileIfExists(uri)));
  }
}

export { FFMPEG_UNAVAILABLE_MESSAGE };

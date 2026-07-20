import { documentDirectory } from 'expo-file-system/legacy';

import { resolveDeepFilterModelPath } from '@/features/audio/data/deepfilter-model.repository';
import type { DeepFilterNet } from '@/features/audio/domain/deep-filter-net';
import {
  deleteFileIfExists,
  transcodeToMono48kWav,
} from '@/features/audio/services/ffmpeg.service';
import { assertOnnxRuntimeAvailable, isOnnxRuntimeAvailable } from '@/features/audio/utils/onnx-availability';
import { readWavAsFloat32, writeFloat32AsWav } from '@/features/audio/utils/wav-pcm';
import { toFileUri } from '@/features/audio/utils/ffmpeg-path';

let denoiserPromise: Promise<DeepFilterNet> | null = null;

function createTempUri(prefix: string, extension: string): string {
  if (!documentDirectory) {
    throw new Error('Document directory is not available.');
  }

  return toFileUri(`${documentDirectory}temp/${prefix}-${Date.now()}.${extension}`);
}

async function getDenoiser(): Promise<DeepFilterNet> {
  if (!denoiserPromise) {
    denoiserPromise = (async () => {
      assertOnnxRuntimeAvailable();

      const modelPath = await resolveDeepFilterModelPath();
      if (!modelPath) {
        throw new Error('DeepFilterNet model is not available.');
      }

      const { DeepFilterNet: DeepFilterNetClass } = await import(
        '@/features/audio/domain/deep-filter-net'
      );
      const denoiser = new DeepFilterNetClass();
      await denoiser.loadModel(modelPath);
      return denoiser;
    })();
  }

  return denoiserPromise;
}

export async function isDeepFilterDenoiseAvailable(): Promise<boolean> {
  if (!isOnnxRuntimeAvailable()) {
    return false;
  }

  const modelPath = await resolveDeepFilterModelPath();
  return modelPath != null;
}

export async function denoiseRecordingWithDeepFilter(
  inputUri: string,
  outputWavUri: string,
  onProgress?: (progress: number) => void,
): Promise<void> {
  const decodedWavUri = createTempUri('deepfilter-decode', 'wav');

  try {
    await transcodeToMono48kWav(inputUri, decodedWavUri);
    const samples = await readWavAsFloat32(decodedWavUri);
    const denoiser = await getDenoiser();
    const denoised = await denoiser.denoise(samples, onProgress);
    await writeFloat32AsWav(denoised, outputWavUri);
  } finally {
    await deleteFileIfExists(decodedWavUri);
  }
}

import * as Crypto from 'expo-crypto';
import { deleteAsync } from 'expo-file-system/legacy';

import { getProcessedRecordingUri } from '@/module/audio/data/recording-paths';
import type { AudioEffectId } from '@/module/audio/types/effects';

export function createProcessedRecordingUri(effectId: AudioEffectId): string {
  return getProcessedRecordingUri(effectId, Crypto.randomUUID());
}

export async function deleteProcessedRecording(
  processedUri: string,
  originalUri: string,
): Promise<void> {
  if (processedUri === originalUri) {
    return;
  }

  try {
    await deleteAsync(processedUri, { idempotent: true });
  } catch {
    // Processed file may already be removed.
  }
}

import * as Crypto from 'expo-crypto';
import { deleteAsync } from 'expo-file-system/legacy';

import { getProcessedRecordingUri } from '@/module/audio/data/recording-paths';
import type { AudioEffectId } from '@/module/audio/types/effects';

export function createProcessedRecordingUri(effectIds: AudioEffectId[]): string {
  const effectKey = [...effectIds].sort().join('+');

  return getProcessedRecordingUri(effectKey, Crypto.randomUUID());
}

export async function deleteProcessedRecording(
  processedUri: string,
  keepUri: string,
): Promise<void> {
  if (processedUri === keepUri) {
    return;
  }

  if (!processedUri.includes('/_processed/') && !processedUri.includes('/_pending/')) {
    return;
  }

  try {
    await deleteAsync(processedUri, { idempotent: true });
  } catch {
    // Processed file may already be removed.
  }
}

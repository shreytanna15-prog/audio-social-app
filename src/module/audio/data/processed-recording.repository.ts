import * as Crypto from 'expo-crypto';
import { deleteAsync } from 'expo-file-system/legacy';

import type { AppliedEffect } from '@/module/audio/types/applied-effects';
import {
  getProcessedRecordingUri,
  PENDING_FOLDER,
} from '@/module/audio/utils/recording-paths';

function buildEffectCacheKey(appliedEffects: AppliedEffect[]): string {
  return [...appliedEffects]
    .map((effect) => {
      const paramKey = Object.entries(effect.params)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, value]) => `${key}:${value}`)
        .join(',');

      return `${effect.id}{${paramKey}}`;
    })
    .sort()
    .join('+');
}

export function createProcessedRecordingUri(appliedEffects: AppliedEffect[]): string {
  const effectKey = buildEffectCacheKey(appliedEffects);

  return getProcessedRecordingUri(effectKey, Crypto.randomUUID());
}

export async function deleteProcessedRecording(
  processedUri: string,
  keepUri: string,
): Promise<void> {
  if (processedUri === keepUri) {
    return;
  }

  if (
    !processedUri.includes('/_processed/') &&
    !processedUri.includes(PENDING_FOLDER)
  ) {
    return;
  }

  try {
    await deleteAsync(processedUri, { idempotent: true });
  } catch {
    // Processed file may already be removed.
  }
}

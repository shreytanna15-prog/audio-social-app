import * as Crypto from 'expo-crypto';

import { fileExists } from '@/features/audio/data/file-persist';
import {
  punchInNeedsFfmpeg,
  punchInOutputDurationSeconds,
  punchInSegments,
} from '@/features/audio/domain/punch-in';
import { concatVocalPunchIn } from '@/features/audio/services/ffmpeg.service';
import type { ProjectLayer } from '@/features/audio/types/project';
import { getPendingSourceUri } from '@/features/audio/utils/recording-paths';

export type PunchInMergeResult = {
  uri: string;
  durationSeconds: number;
  offsetMs: number;
  merged: boolean;
};

function resolveExistingOldUri(layer: ProjectLayer): string | null {
  const candidates = [layer.stemUri, layer.baselineUri, layer.sourceUri];
  for (const uri of candidates) {
    if (uri && fileExists(uri)) {
      return uri;
    }
  }
  return null;
}

/**
 * After Stop has already frozen capture: either keep the new take as-is, or
 * flatten old prefix + new take + old tail into one stem at offset 0.
 */
export async function mergeVocalPunchIn(input: {
  layer: ProjectLayer;
  newUri: string;
  takeDurationSeconds: number;
  originSeconds: number;
  replaceAll: boolean;
}): Promise<PunchInMergeResult> {
  const takeDurationSeconds = Math.max(0, input.takeDurationSeconds);
  const originSeconds = Math.max(0, input.originSeconds);
  const oldUri = resolveExistingOldUri(input.layer);

  if (input.replaceAll || !oldUri) {
    return {
      uri: input.newUri,
      durationSeconds: takeDurationSeconds,
      offsetMs: input.replaceAll ? 0 : Math.round(originSeconds * 1000),
      merged: false,
    };
  }

  const mergeInput = {
    oldStartSeconds: input.layer.offsetMs / 1000,
    oldDurationSeconds: input.layer.durationSeconds,
    originSeconds,
    takeDurationSeconds,
  };
  const segments = punchInSegments(mergeInput);
  const durationSeconds = punchInOutputDurationSeconds(mergeInput);

  if (!punchInNeedsFfmpeg(segments)) {
    return {
      uri: input.newUri,
      durationSeconds,
      offsetMs: 0,
      merged: false,
    };
  }

  const outputUri = getPendingSourceUri(Crypto.randomUUID());
  await concatVocalPunchIn({
    oldUri,
    newUri: input.newUri,
    segments,
    outputUri,
  });

  return {
    uri: outputUri,
    durationSeconds,
    offsetMs: 0,
    merged: true,
  };
}

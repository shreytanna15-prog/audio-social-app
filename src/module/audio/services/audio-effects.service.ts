import { Platform } from 'react-native';

import { createProcessedRecordingUri } from '@/module/audio/data/processed-recording.repository';
import { getCombinedAudioEffectFilter } from '@/module/audio/domain/audio-effect-filters';
import { resolveProcessedFileUri, runFfmpegAudioFilter } from '@/module/audio/services/ffmpeg.service';
import type { AudioEffectId } from '@/module/audio/types/effects';
import { assertFfmpegAvailable, FFMPEG_UNAVAILABLE_MESSAGE } from '@/module/audio/utils/ffmpeg-availability';

export async function applyAudioEffects(
  effectIds: AudioEffectId[],
  inputUri: string,
): Promise<string> {
  if (Platform.OS === 'web') {
    throw new Error('Audio effects are only available on iOS and Android.');
  }

  assertFfmpegAvailable();

  if (effectIds.length === 0) {
    throw new Error('At least one effect is required.');
  }

  const outputUri = createProcessedRecordingUri(effectIds);

  await runFfmpegAudioFilter({
    inputUri,
    outputUri,
    audioFilter: getCombinedAudioEffectFilter(effectIds),
  });

  return resolveProcessedFileUri(outputUri);
}

export { FFMPEG_UNAVAILABLE_MESSAGE };

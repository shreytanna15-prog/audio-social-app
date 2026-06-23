import { Platform } from 'react-native';

import { createProcessedRecordingUri } from '@/module/audio/data/processed-recording.repository';
import { getAudioEffectFilter } from '@/module/audio/domain/audio-effect-filters';
import { resolveProcessedFileUri, runFfmpegAudioFilter } from '@/module/audio/services/ffmpeg.service';
import type { AudioEffectId } from '@/module/audio/types/effects';
import { assertFfmpegAvailable, FFMPEG_UNAVAILABLE_MESSAGE } from '@/module/audio/utils/ffmpeg-availability';

export async function applyAudioEffect(
  effectId: AudioEffectId,
  inputUri: string,
): Promise<string> {
  if (Platform.OS === 'web') {
    throw new Error('Audio effects are only available on iOS and Android.');
  }

  assertFfmpegAvailable();

  const outputUri = createProcessedRecordingUri(effectId);

  await runFfmpegAudioFilter({
    inputUri,
    outputUri,
    audioFilter: getAudioEffectFilter(effectId),
  });

  return resolveProcessedFileUri(outputUri);
}

export { FFMPEG_UNAVAILABLE_MESSAGE };

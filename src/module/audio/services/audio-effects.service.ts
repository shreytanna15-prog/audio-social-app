import { Platform } from 'react-native';

import { createProcessedRecordingUri } from '@/module/audio/data/processed-recording.repository';
import { getCombinedAudioEffectFilter } from '@/module/audio/domain/audio-effect-filters';
import { AudioEffectsError } from '@/module/audio/domain/audio-effect-errors';
import { resolveProcessedFileUri, runFfmpegAudioFilter } from '@/module/audio/services/ffmpeg.service';
import type { AppliedEffect } from '@/module/audio/types/applied-effects';
import { assertFfmpegAvailable, FFMPEG_UNAVAILABLE_MESSAGE } from '@/module/audio/utils/ffmpeg-availability';

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

  await runFfmpegAudioFilter({
    inputUri,
    outputUri,
    audioFilter: getCombinedAudioEffectFilter(appliedEffects),
  });

  return resolveProcessedFileUri(outputUri);
}

export { FFMPEG_UNAVAILABLE_MESSAGE };

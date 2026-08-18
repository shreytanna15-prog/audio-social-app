import { persistFile } from '@/features/audio/data/file-persist';
import type { MixInput } from '@/features/audio/domain/project';
import { executeFfmpegMix } from '@/features/audio/services/ffmpeg.service';
import { toFfmpegPath } from '@/features/audio/utils/ffmpeg-path';

/**
 * Mix unmuted stems into a single WAV. One stem with no delay is copied; none
 * is a no-op. Delayed stems always go through FFmpeg so silence precedes them.
 */
export async function mixProjectStems(
  mixInputs: MixInput[],
  outputUri: string,
): Promise<string | null> {
  const inputs = mixInputs.filter((input) => input.uri);

  if (inputs.length === 0) {
    return null;
  }

  const needsDelay = inputs.some((input) => input.delayMs > 0);

  if (inputs.length === 1 && !needsDelay) {
    await persistFile(inputs[0].uri, outputUri);
    return outputUri;
  }

  await executeFfmpegMix(
    inputs.map((input) => ({
      path: toFfmpegPath(input.uri),
      delayMs: input.delayMs,
    })),
    outputUri,
  );
  return outputUri;
}

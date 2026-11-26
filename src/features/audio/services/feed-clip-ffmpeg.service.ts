import { FFmpegKit, ReturnCode } from '@wokcito/ffmpeg-kit-react-native';
import { File } from 'expo-file-system';

import { FfmpegProcessingError } from '@/features/audio/domain/audio-effect-errors';
import { assertFfmpegAvailable } from '@/features/audio/utils/ffmpeg-availability';
import { toFfmpegPath, toFileUri } from '@/features/audio/utils/ffmpeg-path';

function ensureParentDirectory(uri: string): void {
  const file = new File(uri);
  const parent = file.parentDirectory;
  if (!parent.exists) {
    parent.create({ intermediates: true });
  }
}

/** Trim any input audio to AAC/M4A (128k) for Feed Clip upload. */
export async function trimToFeedClipAac(input: {
  inputUri: string;
  outputUri: string;
  startSec: number;
  durationSec: number;
}): Promise<string> {
  assertFfmpegAvailable();
  ensureParentDirectory(input.outputUri);

  const start = Math.max(0, input.startSec);
  const duration = Math.min(30, Math.max(10, input.durationSec));
  const args = [
    '-y',
    '-ss',
    start.toFixed(3),
    '-t',
    duration.toFixed(3),
    '-i',
    toFfmpegPath(input.inputUri),
    '-c:a',
    'aac',
    '-b:a',
    '128k',
    toFfmpegPath(input.outputUri),
  ];

  const session = await FFmpegKit.executeWithArguments(args);
  const returnCode = await session.getReturnCode();

  if (!ReturnCode.isSuccess(returnCode)) {
    const output = await session.getOutput();
    const failStackTrace = await session.getFailStackTrace();
    throw new FfmpegProcessingError(
      failStackTrace || output || 'FFmpeg could not trim this clip.',
    );
  }

  const outputFile = new File(input.outputUri);
  if (!outputFile.exists) {
    throw new Error('Feed clip file was not created.');
  }

  return toFileUri(toFfmpegPath(input.outputUri));
}

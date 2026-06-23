import { FFmpegKit, ReturnCode } from '@wokcito/ffmpeg-kit-react-native';
import { File } from 'expo-file-system';

import { assertFfmpegAvailable } from '@/module/audio/utils/ffmpeg-availability';
import { toFfmpegPath, toFileUri } from '@/module/audio/utils/ffmpeg-path';

type RunFfmpegInput = {
  inputUri: string;
  outputUri: string;
  audioFilter: string;
};

function ensureParentDirectory(uri: string): void {
  const file = new File(uri);
  const parent = file.parentDirectory;

  if (!parent.exists) {
    parent.create({ intermediates: true });
  }
}

export async function runFfmpegAudioFilter({
  inputUri,
  outputUri,
  audioFilter,
}: RunFfmpegInput): Promise<void> {
  assertFfmpegAvailable();
  ensureParentDirectory(outputUri);

  const inputPath = toFfmpegPath(inputUri);
  const outputPath = toFfmpegPath(outputUri);

  const session = await FFmpegKit.executeWithArguments([
    '-y',
    '-i',
    inputPath,
    '-af',
    audioFilter,
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    outputPath,
  ]);

  const returnCode = await session.getReturnCode();

  if (!ReturnCode.isSuccess(returnCode)) {
    const output = await session.getOutput();
    const failStackTrace = await session.getFailStackTrace();

    throw new Error(
      failStackTrace || output || 'FFmpeg could not process this recording.',
    );
  }

  const outputFile = new File(outputUri);

  if (!outputFile.exists) {
    throw new Error('Processed recording file was not created.');
  }
}

export function resolveProcessedFileUri(outputUri: string): string {
  return toFileUri(toFfmpegPath(outputUri));
}

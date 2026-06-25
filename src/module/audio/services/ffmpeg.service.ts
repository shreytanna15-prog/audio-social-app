import { FFmpegKit, ReturnCode } from '@wokcito/ffmpeg-kit-react-native';
import { File } from 'expo-file-system';

import { FfmpegProcessingError } from '@/module/audio/domain/audio-effect-errors';
import { assertFfmpegAvailable } from '@/module/audio/utils/ffmpeg-availability';
import { toFfmpegPath, toFileUri } from '@/module/audio/utils/ffmpeg-path';

type RunFfmpegInput = {
  inputUri: string;
  outputUri: string;
  audioFilter: string;
  useLosslessIntermediate?: boolean;
};

function ensureParentDirectory(uri: string): void {
  const file = new File(uri);
  const parent = file.parentDirectory;

  if (!parent.exists) {
    parent.create({ intermediates: true });
  }
}

function getIntermediateWavUri(outputUri: string): string {
  if (outputUri.toLowerCase().endsWith('.m4a')) {
    return outputUri.slice(0, -4) + '.wav';
  }

  return `${outputUri}.wav`;
}

async function executeFfmpeg(args: string[]): Promise<void> {
  const session = await FFmpegKit.executeWithArguments(args);
  const returnCode = await session.getReturnCode();

  if (!ReturnCode.isSuccess(returnCode)) {
    const output = await session.getOutput();
    const failStackTrace = await session.getFailStackTrace();
    const rawOutput = failStackTrace || output || 'FFmpeg could not process this recording.';

    throw new FfmpegProcessingError(rawOutput);
  }
}

async function deleteFileIfExists(uri: string): Promise<void> {
  const file = new File(uri);

  if (file.exists) {
    file.delete();
  }
}

async function runSinglePassEncode({
  inputPath,
  outputPath,
  audioFilter,
  audioCodec,
  audioBitrate,
}: {
  inputPath: string;
  outputPath: string;
  audioFilter?: string;
  audioCodec: string;
  audioBitrate?: string;
}): Promise<void> {
  const args = ['-y', '-i', inputPath];

  if (audioFilter) {
    args.push('-af', audioFilter);
  }

  args.push('-c:a', audioCodec);

  if (audioBitrate) {
    args.push('-b:a', audioBitrate);
  }

  args.push(outputPath);

  await executeFfmpeg(args);
}

export async function runFfmpegAudioFilter({
  inputUri,
  outputUri,
  audioFilter,
  useLosslessIntermediate = false,
}: RunFfmpegInput): Promise<void> {
  assertFfmpegAvailable();
  ensureParentDirectory(outputUri);

  const inputPath = toFfmpegPath(inputUri);
  const outputPath = toFfmpegPath(outputUri);

  if (!useLosslessIntermediate) {
    await runSinglePassEncode({
      inputPath,
      outputPath,
      audioFilter,
      audioCodec: 'aac',
      audioBitrate: '192k',
    });
  } else {
    const intermediateUri = getIntermediateWavUri(outputUri);
    const intermediatePath = toFfmpegPath(intermediateUri);

    try {
      await runSinglePassEncode({
        inputPath,
        outputPath: intermediatePath,
        audioFilter,
        audioCodec: 'pcm_s16le',
      });

      await runSinglePassEncode({
        inputPath: intermediatePath,
        outputPath,
        audioCodec: 'aac',
        audioBitrate: '192k',
      });
    } finally {
      await deleteFileIfExists(intermediateUri);
    }
  }

  const outputFile = new File(outputUri);

  if (!outputFile.exists) {
    throw new Error('Processed recording file was not created.');
  }
}

export function resolveProcessedFileUri(outputUri: string): string {
  return toFileUri(toFfmpegPath(outputUri));
}

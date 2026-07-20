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

async function runSinglePassEncode({
  inputPath,
  outputPath,
  audioFilter,
  audioCodec,
  audioBitrate,
  sampleRate,
  channels,
}: {
  inputPath: string;
  outputPath: string;
  audioFilter?: string;
  audioCodec: string;
  audioBitrate?: string;
  sampleRate?: number;
  channels?: number;
}): Promise<void> {
  const args = ['-y', '-i', inputPath];

  if (audioFilter) {
    args.push('-af', audioFilter);
  }

  args.push('-c:a', audioCodec);

  if (sampleRate != null) {
    args.push('-ar', String(sampleRate));
  }

  if (channels != null) {
    args.push('-ac', String(channels));
  }

  if (audioBitrate) {
    args.push('-b:a', audioBitrate);
  }

  args.push(outputPath);

  await executeFfmpeg(args);
}

export function resolveProcessedFileUri(outputUri: string): string {
  return toFileUri(toFfmpegPath(outputUri));
}

export async function deleteFileIfExists(uri: string): Promise<void> {
  const file = new File(uri);

  if (file.exists) {
    file.delete();
  }
}

/** Convert any supported audio file to mono 48 kHz PCM WAV (for DeepFilter / DSP). */
export async function transcodeToMono48kWav(
  inputUri: string,
  outputUri: string,
  audioFilter = 'aresample=48000,pan=mono|c0=0.5*c0+0.5*c1',
): Promise<void> {
  assertFfmpegAvailable();
  ensureParentDirectory(outputUri);

  const inputPath = toFfmpegPath(inputUri);
  const outputPath = toFfmpegPath(outputUri);

  await runSinglePassEncode({
    inputPath,
    outputPath,
    audioFilter,
    audioCodec: 'pcm_s16le',
    sampleRate: 48_000,
    channels: 1,
  });

  const outputFile = new File(outputUri);

  if (!outputFile.exists) {
    throw new Error('Decoded WAV file was not created.');
  }
}

/** Encode a WAV file to MP3 for app storage / playback. */
export async function encodeWavToMp3(inputUri: string, outputUri: string): Promise<void> {
  assertFfmpegAvailable();
  ensureParentDirectory(outputUri);

  await runSinglePassEncode({
    inputPath: toFfmpegPath(inputUri),
    outputPath: toFfmpegPath(outputUri),
    audioCodec: 'libmp3lame',
    audioBitrate: '192k',
  });

  const outputFile = new File(outputUri);

  if (!outputFile.exists) {
    throw new Error('Encoded MP3 file was not created.');
  }
}

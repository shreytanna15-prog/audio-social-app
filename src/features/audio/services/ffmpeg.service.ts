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

/** Mix N audio inputs into one mono 48 kHz WAV (`adelay` then `amix`, longest). */
export async function executeFfmpegMix(
  inputs: { path: string; delayMs: number }[],
  outputUri: string,
): Promise<void> {
  if (inputs.length < 1) {
    throw new Error('Mix requires at least one input.');
  }

  assertFfmpegAvailable();
  ensureParentDirectory(outputUri);

  const args: string[] = ['-y'];
  for (const input of inputs) {
    args.push('-i', input.path);
  }

  const labels = inputs.map((input, index) => {
    if (input.delayMs > 0) {
      return `[${index}:a]adelay=${input.delayMs}:all=1[a${index}]`;
    }

    return `[${index}:a]anull[a${index}]`;
  });
  const mixInputs = inputs.map((_, index) => `[a${index}]`).join('');
  const mix =
    inputs.length === 1
      ? `${labels[0]};[a0]anull[aout]`
      : `${labels.join(';')};${mixInputs}amix=inputs=${inputs.length}:duration=longest:dropout_transition=0[aout]`;

  args.push(
    '-filter_complex',
    mix,
    '-map',
    '[aout]',
    '-ac',
    '1',
    '-ar',
    '48000',
    '-c:a',
    'pcm_s16le',
    toFfmpegPath(outputUri),
  );

  await executeFfmpeg(args);

  const outputFile = new File(outputUri);
  if (!outputFile.exists) {
    throw new Error('Mixdown file was not created.');
  }
}

function formatSeconds(value: number): string {
  return value.toFixed(4);
}

/**
 * Flatten punch-in pieces into one mono 48 kHz WAV. Silence is `anullsrc`
 * in the graph — never a file, never JS PCM.
 */
export async function concatVocalPunchIn(input: {
  oldUri: string;
  newUri: string;
  segments: Array<
    | { kind: 'silence'; durationSeconds: number }
    | { kind: 'old'; startSeconds: number; endSeconds: number }
    | { kind: 'new' }
  >;
  outputUri: string;
}): Promise<void> {
  if (input.segments.length === 0) {
    throw new Error('Punch-in concat requires at least one segment.');
  }

  assertFfmpegAvailable();
  ensureParentDirectory(input.outputUri);

  const labels: string[] = [];
  const concatPads: string[] = [];
  const format = 'aformat=sample_fmts=s16:sample_rates=48000:channel_layouts=mono';
  let silenceIndex = 0;
  let oldIndex = 0;

  for (const segment of input.segments) {
    if (segment.kind === 'silence') {
      const pad = `s${silenceIndex}`;
      labels.push(
        `anullsrc=r=48000:cl=mono:d=${formatSeconds(segment.durationSeconds)},${format}[${pad}]`,
      );
      concatPads.push(`[${pad}]`);
      silenceIndex += 1;
      continue;
    }

    if (segment.kind === 'old') {
      const pad = `o${oldIndex}`;
      labels.push(
        `[0:a]atrim=${formatSeconds(segment.startSeconds)}:${formatSeconds(segment.endSeconds)},asetpts=PTS-STARTPTS,${format}[${pad}]`,
      );
      concatPads.push(`[${pad}]`);
      oldIndex += 1;
      continue;
    }

    labels.push(`[1:a]${format}[n0]`);
    concatPads.push('[n0]');
  }

  const args = [
    '-y',
    '-i',
    toFfmpegPath(input.oldUri),
    '-i',
    toFfmpegPath(input.newUri),
    '-filter_complex',
    `${labels.join(';')};${concatPads.join('')}concat=n=${concatPads.length}:v=0:a=1[aout]`,
    '-map',
    '[aout]',
    '-ac',
    '1',
    '-ar',
    '48000',
    '-c:a',
    'pcm_s16le',
    toFfmpegPath(input.outputUri),
  ];

  await executeFfmpeg(args);

  const outputFile = new File(input.outputUri);
  if (!outputFile.exists) {
    throw new Error('Punch-in merge file was not created.');
  }
}

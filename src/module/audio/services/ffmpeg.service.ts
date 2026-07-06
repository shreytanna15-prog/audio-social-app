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

function parseDurationFromFfmpegOutput(output: string): number | null {
  const match = output.match(/Duration:\s*(\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)/);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);

  return hours * 3600 + minutes * 60 + seconds;
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

export async function deleteFileIfExists(uri: string): Promise<void> {
  const file = new File(uri);

  if (file.exists) {
    file.delete();
  }
}

export async function transcodeToMono48kWav(
  inputUri: string,
  outputUri: string,
  audioFilter = 'highpass=f=80,aresample=48000,pan=mono|c0=0.5*c0+0.5*c1',
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

export async function probeAudioDurationSeconds(inputUri: string): Promise<number> {
  assertFfmpegAvailable();

  const inputPath = toFfmpegPath(inputUri);
  const session = await FFmpegKit.executeWithArguments([
    '-hide_banner',
    '-i',
    inputPath,
    '-f',
    'null',
    '-',
  ]);

  const output = [
    (await session.getOutput()) ?? '',
    (await session.getFailStackTrace()) ?? '',
  ].join('\n');
  const durationSeconds = parseDurationFromFfmpegOutput(output);

  if (durationSeconds == null || !Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    throw new Error('Could not probe audio duration.');
  }

  return durationSeconds;
}

export type VolumeDetectMetrics = {
  meanVolumeDb: number;
  maxVolumeDb: number;
};

function parseVolumeDetectOutput(output: string): VolumeDetectMetrics | null {
  const meanMatch = output.match(/mean_volume:\s*([-\d.]+)\s*dB/i);
  const maxMatch = output.match(/max_volume:\s*([-\d.]+)\s*dB/i);

  if (!meanMatch || !maxMatch) {
    return null;
  }

  const meanVolumeDb = Number(meanMatch[1]);
  const maxVolumeDb = Number(maxMatch[1]);

  if (!Number.isFinite(meanVolumeDb) || !Number.isFinite(maxVolumeDb)) {
    return null;
  }

  return { meanVolumeDb, maxVolumeDb };
}

type ProbeVolumedetectInput = {
  inputUri: string;
  startSeconds?: number;
  durationSeconds?: number;
};

export async function probeVolumedetectMetrics({
  inputUri,
  startSeconds,
  durationSeconds,
}: ProbeVolumedetectInput): Promise<VolumeDetectMetrics> {
  assertFfmpegAvailable();

  const inputPath = toFfmpegPath(inputUri);
  const args = ['-hide_banner', '-y'];

  if (startSeconds != null && durationSeconds != null) {
    args.push('-ss', String(startSeconds), '-t', String(durationSeconds));
  }

  args.push('-i', inputPath, '-af', 'volumedetect', '-f', 'null', '-');

  const session = await FFmpegKit.executeWithArguments(args);
  const output = [
    (await session.getOutput()) ?? '',
    (await session.getFailStackTrace()) ?? '',
  ].join('\n');
  const metrics = parseVolumeDetectOutput(output);

  if (metrics == null) {
    throw new Error('Could not parse volumedetect metrics.');
  }

  return metrics;
}

type ExtractAudioChunkWavInput = {
  inputUri: string;
  outputUri: string;
  startSeconds: number;
  durationSeconds: number;
  sampleRate?: number;
  channels?: number;
};

export async function extractAudioChunkWav({
  inputUri,
  outputUri,
  startSeconds,
  durationSeconds,
  sampleRate = 48_000,
  channels = 1,
}: ExtractAudioChunkWavInput): Promise<void> {
  assertFfmpegAvailable();
  ensureParentDirectory(outputUri);

  const inputPath = toFfmpegPath(inputUri);
  const outputPath = toFfmpegPath(outputUri);

  await executeFfmpeg([
    '-y',
    '-i',
    inputPath,
    '-ss',
    String(startSeconds),
    '-t',
    String(durationSeconds),
    '-af',
    `aresample=${sampleRate},pan=mono|c0=0.5*c0+0.5*c1`,
    '-c:a',
    'pcm_s16le',
    '-ar',
    String(sampleRate),
    '-ac',
    String(channels),
    outputPath,
  ]);

  const outputFile = new File(outputUri);

  if (!outputFile.exists) {
    throw new Error('Chunk WAV file was not created.');
  }
}

type ConcatWavChunksInput = {
  chunkUris: string[];
  outputUri: string;
  crossfadeSeconds: number;
};

export async function concatWavChunksWithCrossfade({
  chunkUris,
  outputUri,
  crossfadeSeconds,
}: ConcatWavChunksInput): Promise<void> {
  assertFfmpegAvailable();
  ensureParentDirectory(outputUri);

  if (chunkUris.length === 0) {
    throw new Error('No chunks to concatenate.');
  }

  const outputPath = toFfmpegPath(outputUri);

  if (chunkUris.length === 1) {
    await runSinglePassEncode({
      inputPath: toFfmpegPath(chunkUris[0]),
      outputPath,
      audioCodec: 'pcm_s16le',
    });
    return;
  }

  const inputArgs = chunkUris.flatMap((uri) => ['-i', toFfmpegPath(uri)]);
  const filterParts: string[] = [];
  let previousLabel = '0:a';

  for (let index = 1; index < chunkUris.length; index += 1) {
    const outputLabel = index === chunkUris.length - 1 ? 'out' : `cf${index}`;
    filterParts.push(
      `[${previousLabel}][${index}:a]acrossfade=d=${crossfadeSeconds}:c1=tri:c2=tri[${outputLabel}]`,
    );
    previousLabel = outputLabel;
  }

  await executeFfmpeg([
    '-y',
    ...inputArgs,
    '-filter_complex',
    filterParts.join(';'),
    '-map',
    '[out]',
    '-c:a',
    'pcm_s16le',
    outputPath,
  ]);

  const outputFile = new File(outputUri);

  if (!outputFile.exists) {
    throw new Error('Concatenated WAV file was not created.');
  }
}

export async function encodeWavToM4a(inputUri: string, outputUri: string): Promise<void> {
  assertFfmpegAvailable();
  ensureParentDirectory(outputUri);

  await runSinglePassEncode({
    inputPath: toFfmpegPath(inputUri),
    outputPath: toFfmpegPath(outputUri),
    audioCodec: 'aac',
    audioBitrate: '192k',
  });

  const outputFile = new File(outputUri);

  if (!outputFile.exists) {
    throw new Error('Encoded M4A file was not created.');
  }
}

type RunFfmpegWavFilterInput = {
  inputUri: string;
  outputUri: string;
  audioFilter: string;
  sampleRate?: number;
  channels?: number;
};

export async function runFfmpegWavFilter({
  inputUri,
  outputUri,
  audioFilter,
  sampleRate = 48_000,
  channels = 1,
}: RunFfmpegWavFilterInput): Promise<void> {
  assertFfmpegAvailable();
  ensureParentDirectory(outputUri);

  await runSinglePassEncode({
    inputPath: toFfmpegPath(inputUri),
    outputPath: toFfmpegPath(outputUri),
    audioFilter,
    audioCodec: 'pcm_s16le',
    sampleRate,
    channels,
  });

  const outputFile = new File(outputUri);

  if (!outputFile.exists) {
    throw new Error('Processed WAV file was not created.');
  }
}

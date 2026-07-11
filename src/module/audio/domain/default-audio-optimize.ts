import { escapeFfmpegFilterPath } from '@/module/audio/utils/ffmpeg-path';

const DEFAULT_ARNNDN_MIX = 0.75;

const VOCAL_EQ_COMPRESSOR_STAGES = [
  'equalizer=f=250:width_type=o:gain=-3',
  'equalizer=f=3200:width_type=o:gain=2',
  'acompressor=threshold=-18dB:ratio=3:attack=5:release=80',
] as const;

const LOUDNORM_STAGE = 'loudnorm=I=-14:TP=-1.5:LRA=11';
const LIMITER_STAGE = 'alimiter=limit=0.95:level=false';

function joinStages(stages: string[]): string {
  return stages.join(',');
}

function buildVocalPolishStages(includeLoudnorm: boolean): string[] {
  if (includeLoudnorm) {
    return [...VOCAL_EQ_COMPRESSOR_STAGES, LOUDNORM_STAGE, LIMITER_STAGE];
  }

  return [...VOCAL_EQ_COMPRESSOR_STAGES, LIMITER_STAGE];
}

/** Light speech polish. Omit loudnorm on short clips — it often fails under ~3s. */
export function buildDefaultPolishOnlyFilter(options?: { includeLoudnorm?: boolean }): string {
  const includeLoudnorm = options?.includeLoudnorm ?? true;
  return joinStages(['highpass=f=80', ...buildVocalPolishStages(includeLoudnorm)]);
}

export function buildDefaultArnndnOptimizeFilter(
  modelPath: string,
  includeMix = true,
  options?: { includeLoudnorm?: boolean },
): string {
  const escapedModelPath = escapeFfmpegFilterPath(modelPath);
  const includeLoudnorm = options?.includeLoudnorm ?? true;

  return joinStages([
    'highpass=f=80',
    includeMix
      ? `arnndn=m=${escapedModelPath}:mix=${DEFAULT_ARNNDN_MIX}`
      : `arnndn=m=${escapedModelPath}`,
    ...buildVocalPolishStages(includeLoudnorm),
  ]);
}

export function buildDefaultAfftdnOptimizeFilter(options?: {
  includeLoudnorm?: boolean;
}): string {
  const includeLoudnorm = options?.includeLoudnorm ?? true;

  return joinStages([
    'highpass=f=80',
    'afftdn=nr=26:nf=-50:tn=1:tr=1:gs=14:ad=0.6:rf=-45',
    ...buildVocalPolishStages(includeLoudnorm),
  ]);
}

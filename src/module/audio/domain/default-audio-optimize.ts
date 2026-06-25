import { escapeFfmpegFilterPath } from '@/module/audio/utils/ffmpeg-path';

const DEFAULT_ARNNDN_MIX = 0.75;

const VOCAL_POLISH_STAGES = [
  'equalizer=f=250:width_type=o:gain=-3',
  'equalizer=f=3200:width_type=o:gain=2',
  'acompressor=threshold=-18dB:ratio=3:attack=5:release=80',
  'loudnorm=I=-14:TP=-1.5:LRA=11',
  'alimiter=limit=0.95:level=false',
];

function joinStages(stages: string[]): string {
  return stages.join(',');
}

export function buildDefaultPolishOnlyFilter(): string {
  return joinStages(['highpass=f=80', ...VOCAL_POLISH_STAGES]);
}

export function buildDefaultArnndnOptimizeFilter(
  modelPath: string,
  includeMix = true,
): string {
  const escapedModelPath = escapeFfmpegFilterPath(modelPath);

  return joinStages([
    'highpass=f=80',
    includeMix
      ? `arnndn=m=${escapedModelPath}:mix=${DEFAULT_ARNNDN_MIX}`
      : `arnndn=m=${escapedModelPath}`,
    ...VOCAL_POLISH_STAGES,
  ]);
}

export function buildDefaultAfftdnOptimizeFilter(): string {
  return joinStages([
    'highpass=f=80',
    'afftdn=nr=26:nf=-50:tn=1:tr=1:gs=14:ad=0.6:rf=-45',
    ...VOCAL_POLISH_STAGES,
  ]);
}

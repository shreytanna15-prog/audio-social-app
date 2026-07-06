import {
  NOISE_SAMPLE_DURATION_SECONDS,
  MIN_RECORDING_SECONDS_FOR_NOISE_PROFILE,
  type AfftdnDenoiseSettings,
} from '@/module/audio/domain/recording-denoise.constants';

function joinStages(stages: string[]): string {
  return stages.join(',');
}

export function canUseNoiseProfile(durationSeconds: number | undefined): boolean {
  if (durationSeconds == null || !Number.isFinite(durationSeconds)) {
    return false;
  }

  return durationSeconds >= MIN_RECORDING_SECONDS_FOR_NOISE_PROFILE;
}

function buildAfftdnNoiseProfileCommands(): string {
  const sampleEnd = NOISE_SAMPLE_DURATION_SECONDS.toFixed(2);

  return joinStages([
    'asendcmd=0.0 afftdn sn start',
    `asendcmd=${sampleEnd} afftdn sn stop`,
  ]);
}

export function buildAfftdnDenoiseStage(settings: AfftdnDenoiseSettings): string {
  return `afftdn=nr=${settings.nr}:nf=${settings.noiseFloor}:tn=1:tr=1:gs=${settings.gainSmooth}:ad=${settings.adaptivity}:rf=${settings.residualFloor}`;
}

type BuildProfiledAfftdnChainInput = {
  highpassHz: number;
  afftdn: AfftdnDenoiseSettings;
  polishStages: readonly string[];
};

export function buildProfiledAfftdnOptimizeFilter({
  highpassHz,
  afftdn,
  polishStages,
}: BuildProfiledAfftdnChainInput): string {
  return joinStages([
    buildAfftdnNoiseProfileCommands(),
    `highpass=f=${highpassHz}`,
    buildAfftdnDenoiseStage(afftdn),
    ...polishStages,
  ]);
}

export function buildPlainAfftdnOptimizeFilter({
  highpassHz,
  afftdn,
  polishStages,
}: BuildProfiledAfftdnChainInput): string {
  return joinStages([
    `highpass=f=${highpassHz}`,
    buildAfftdnDenoiseStage(afftdn),
    ...polishStages,
  ]);
}

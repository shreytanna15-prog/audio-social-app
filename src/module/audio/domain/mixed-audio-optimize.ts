import { MIXED_DENOISE } from '@/module/audio/domain/recording-denoise.constants';
import {
  buildPlainAfftdnOptimizeFilter,
  buildProfiledAfftdnOptimizeFilter,
  canUseNoiseProfile,
} from '@/module/audio/domain/noise-profile-afftdn';

function joinStages(stages: string[]): string {
  return stages.join(',');
}

const MIXED_POLISH_STAGES = [
  'acompressor=threshold=-20dB:ratio=2.5:attack=8:release=100',
  'loudnorm=I=-14:TP=-1.5:LRA=11',
  'alimiter=limit=0.95:level=false',
] as const;

const { highpassHz, afftdn } = MIXED_DENOISE;

export function buildMixedLightPolishFilter(): string {
  return joinStages([...MIXED_POLISH_STAGES]);
}

export function buildMixedAfftdnOptimizeFilter(): string {
  return buildPlainAfftdnOptimizeFilter({
    highpassHz,
    afftdn,
    polishStages: MIXED_POLISH_STAGES,
  });
}

export function buildMixedProfiledAfftdnOptimizeFilter(
  durationSeconds?: number,
): string | null {
  if (!canUseNoiseProfile(durationSeconds)) {
    return null;
  }

  return buildProfiledAfftdnOptimizeFilter({
    highpassHz,
    afftdn,
    polishStages: MIXED_POLISH_STAGES,
  });
}

import {
  INSTRUMENT_DENOISE,
  MIXED_DENOISE,
} from '@/module/audio/domain/recording-denoise.constants';
import {
  buildPlainAfftdnOptimizeFilter,
  buildProfiledAfftdnOptimizeFilter,
  canUseNoiseProfile,
} from '@/module/audio/domain/noise-profile-afftdn';

function joinStages(stages: string[]): string {
  return stages.join(',');
}

const INSTRUMENT_POLISH_STAGES = [
  'acompressor=threshold=-20dB:ratio=2.5:attack=10:release=120',
  'loudnorm=I=-14:TP=-1.5:LRA=11',
  'alimiter=limit=0.95:level=false',
] as const;

const { highpassHz, afftdn, anlmdn } = INSTRUMENT_DENOISE;

export function buildInstrumentLightPolishFilter(): string {
  return joinStages([...INSTRUMENT_POLISH_STAGES]);
}

export function buildInstrumentAfftdnOptimizeFilter(): string {
  return buildPlainAfftdnOptimizeFilter({
    highpassHz,
    afftdn,
    polishStages: INSTRUMENT_POLISH_STAGES,
  });
}

export function buildInstrumentProfiledAfftdnOptimizeFilter(
  durationSeconds?: number,
): string | null {
  if (!canUseNoiseProfile(durationSeconds)) {
    return null;
  }

  return buildProfiledAfftdnOptimizeFilter({
    highpassHz,
    afftdn,
    polishStages: INSTRUMENT_POLISH_STAGES,
  });
}

export function buildInstrumentAnlmdnOptimizeFilter(): string {
  return joinStages([
    `highpass=f=${highpassHz}`,
    `anlmdn=s=${anlmdn.strength}:p=${anlmdn.patchMs}:r=${anlmdn.researchMs}:m=${anlmdn.smooth}`,
    ...INSTRUMENT_POLISH_STAGES,
  ]);
}

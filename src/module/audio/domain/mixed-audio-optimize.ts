/**
 * Mixed (voice + instrument) post-record path: Superpowered only (same bed as instrument).
 * Native chain: highpass → soft noise gate → EQ → compressor → limiter.
 * (FFmpeg polish filters here are unused by optimize; kept for reference / tooling.)
 */

function joinStages(stages: string[]): string {
  return stages.join(',');
}

const MIXED_POLISH_STAGES = [
  'highpass=f=55',
  'equalizer=f=220:t=q:w=1.0:g=-1',
  'equalizer=f=3200:t=q:w=1.1:g=1',
  'acompressor=threshold=-19dB:ratio=2.2:attack=18:release=160:makeup=1.5',
  'alimiter=limit=0.95',
] as const;

export function buildMixedPolishFilter(): string {
  return joinStages([...MIXED_POLISH_STAGES]);
}

/** @deprecated Use {@link buildMixedPolishFilter}. */
export const buildMixedLightPolishFilter = buildMixedPolishFilter;

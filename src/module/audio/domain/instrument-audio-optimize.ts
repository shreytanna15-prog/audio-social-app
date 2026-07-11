/**
 * Instrument post-record path: Superpowered only.
 * Native chain: highpass → soft noise gate → EQ → compressor → limiter.
 * (FFmpeg polish filters here are unused by optimize; kept for reference / tooling.)
 */

function joinStages(stages: string[]): string {
  return stages.join(',');
}

const INSTRUMENT_POLISH_STAGES = [
  'highpass=f=40',
  'equalizer=f=250:t=q:w=1.0:g=-1.5',
  'equalizer=f=3500:t=q:w=1.2:g=1',
  'acompressor=threshold=-20dB:ratio=2:attack=20:release=180:makeup=1',
  'alimiter=limit=0.95',
] as const;

export function buildInstrumentPolishFilter(): string {
  return joinStages([...INSTRUMENT_POLISH_STAGES]);
}

/** @deprecated Use {@link buildInstrumentPolishFilter}. */
export const buildInstrumentLightPolishFilter = buildInstrumentPolishFilter;

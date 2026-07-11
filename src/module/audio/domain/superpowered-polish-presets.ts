import type { SuperpoweredProcessPreset } from 'superpowered-audio';

export type SuperpoweredPolishPreset = SuperpoweredProcessPreset;

/** Knob differences only — shared EQ → compressor → limiter chain. */
export const SUPERPOWERED_POLISH_PRESETS: SuperpoweredPolishPreset[] = [
  'speech-polish',
  'instrument-polish',
  'mixed-polish',
];

export function resolvePolishPresetForMode(
  mode: 'speech' | 'instrument' | 'mixed',
): SuperpoweredPolishPreset {
  if (mode === 'instrument') {
    return 'instrument-polish';
  }
  if (mode === 'mixed') {
    return 'mixed-polish';
  }
  return 'speech-polish';
}

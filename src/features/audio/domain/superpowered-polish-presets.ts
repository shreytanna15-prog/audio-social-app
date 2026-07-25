import type { SuperpoweredProcessPreset } from 'superpowered-audio';
import type { RecordingMode } from '@/features/audio/types/recording-mode';

export type SuperpoweredPolishPreset = SuperpoweredProcessPreset;

/** Voloco-Clean style presets (HPF → EQ → comp → limiter). Gate off for instrument/mixed. */
export const SUPERPOWERED_POLISH_PRESETS: SuperpoweredPolishPreset[] = [
  'speech-polish',
  'instrument-polish',
  'mixed-polish',
  'speech-clean',
  'instrument-clean',
  'mixed-clean',
];

export function resolvePolishPresetForMode(
  mode: RecordingMode,
): SuperpoweredPolishPreset {
  if (mode === 'instrument') {
    return 'instrument-clean';
  }
  if (mode === 'mixed') {
    return 'mixed-clean';
  }
  return 'speech-clean';
}

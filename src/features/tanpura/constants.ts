import type {
  TanpuraLabelMode,
  TanpuraPitchId,
  TanpuraPresetId,
} from './types';

export const TANPURA_PITCH_IDS: TanpuraPitchId[] = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
];

/** Chromatic Indian labels aligned to Western C…B (Sa on C). */
export const TANPURA_INDIAN_PITCH_LABELS: Record<TanpuraPitchId, string> = {
  C: 'Sa',
  'C#': 're',
  D: 'Re',
  'D#': 'ga',
  E: 'Ga',
  F: 'ma',
  'F#': 'Ma',
  G: 'Pa',
  'G#': 'dha',
  A: 'Dha',
  'A#': 'ni',
  B: 'Ni',
};

export const TANPURA_PRESET_IDS: TanpuraPresetId[] = [
  'sa-pa-sa',
  'sa-ma-sa',
  'sa-only',
];

/** Bundled loops are authored at Sa = C (rate 1.0). */
export const TANPURA_REFERENCE_PITCH: TanpuraPitchId = 'C';

export const TANPURA_DEFAULT_PITCH: TanpuraPitchId = 'C';
export const TANPURA_DEFAULT_PRESET: TanpuraPresetId = 'sa-pa-sa';
export const TANPURA_DEFAULT_VOLUME = 0.7;
export const TANPURA_DEFAULT_SPEED = 1;
export const TANPURA_DEFAULT_FINE_SEMIS = 0;
export const TANPURA_DEFAULT_LABEL_MODE: TanpuraLabelMode = 'western';

export const TANPURA_SPEED_MIN = 0.75;
export const TANPURA_SPEED_MAX = 1.25;
export const TANPURA_FINE_SEMIS_MIN = -2;
export const TANPURA_FINE_SEMIS_MAX = 2;
export const TANPURA_PLAYBACK_RATE_MIN = 0.1;
export const TANPURA_PLAYBACK_RATE_MAX = 2;

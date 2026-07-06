export type RecordingMode = 'speech' | 'instrument' | 'mixed';

export const RECORDING_MODE_QUIET_HINT =
  'For instrument or both: leave ~1 second of quiet before you start.';

export type RecordingModeOption = {
  id: RecordingMode;
  label: string;
  description: string;
  available: boolean;
};

export const RECORDING_MODE_OPTIONS: RecordingModeOption[] = [
  {
    id: 'speech',
    label: 'Singing / Speaking',
    description: 'Voice cleanup with background noise removal.',
    available: true,
  },
  {
    id: 'instrument',
    label: 'Instrument',
    description: 'Gentle cleanup that preserves instrument tone.',
    available: true,
  },
  {
    id: 'mixed',
    label: 'Both',
    description: 'Balanced cleanup for voice and instrument together.',
    available: true,
  },
];

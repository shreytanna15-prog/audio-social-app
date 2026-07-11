export type RecordingMode = 'speech' | 'instrument' | 'mixed';

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
    description: 'On-device voice enhance for singing and speaking.',
    available: true,
  },
  {
    id: 'instrument',
    label: 'Instrument',
    description: 'On-device polish that preserves instrument tone.',
    available: true,
  },
  {
    id: 'mixed',
    label: 'Both',
    description: 'On-device polish for voice and instrument together.',
    available: true,
  },
];

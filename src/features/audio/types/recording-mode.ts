export type RecordingMode =
  | "speech"
  | "instrument"
  | "instrument-3"
  | "mixed"
  | "raw";

export type RecordingModeOption = {
  id: RecordingMode;
  label: string;
  description: string;
  available: boolean;
};

export const RECORDING_MODE_OPTIONS: RecordingModeOption[] = [
  {
    id: "speech",
    label: "Singing / Speaking",
    description: "On-device voice enhance for singing and speaking.",
    available: true,
  },
  {
    id: "instrument",
    label: "Instrument - Adaptive",
    description:
      "Spectral gate with adaptive noise tracking for guitar & piano.",
    available: true,
  },
  {
    id: "instrument-3",
    label: "Instrument - Quick",
    description: "Quick light polish for guitar & piano.",
    available: true,
  },
  {
    id: "mixed",
    label: "Both",
    description: "Soft Clean polish for voice and instrument together.",
    available: true,
  },
];

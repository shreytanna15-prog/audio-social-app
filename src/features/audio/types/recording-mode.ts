export type RecordingMode =
  | "speech"
  | "instrument"
  | "mixed"
  | "raw"
  | "gate-lab"
  | "nitro-m4a";

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
    description: "Light Superpowered polish for guitar & piano.",
    available: true,
  },
  {
    id: "mixed",
    label: "Both",
    description: "Soft Clean polish for voice and instrument together.",
    available: true,
  },
  {
    id: "raw",
    label: "Capture A: Expo WAV",
    description: "Expo PCM capture, then SpectralGate denoise before preview.",
    available: true,
  },
  {
    id: "gate-lab",
    label: "Gate Lab: PCM bake-off",
    description: "Expo PCM only. In editor, try Mild / Current / Strong SpectralGate.",
    available: true,
  },
  {
    id: "nitro-m4a",
    label: "Capture Nitro: M4A",
    description: "Nitro Sound compressed capture, no auto enhance.",
    available: true,
  },
];

/** Modes that stage without Clean / auto SpectralGate (editor A/B only). */
export function isPassthroughCaptureMode(mode: RecordingMode | null | undefined): boolean {
  return mode === "gate-lab" || mode === "nitro-m4a";
}

/** Modes that keep the capture file extension (WAV / M4A / MP4) instead of MP3. */
export function keepsSourceExtension(mode: RecordingMode | null | undefined): boolean {
  return mode === "raw" || isPassthroughCaptureMode(mode);
}

export function isKnownRecordingMode(
  value: string | null | undefined,
): value is RecordingMode {
  return (
    value === "speech" ||
    value === "instrument" ||
    value === "mixed" ||
    value === "raw" ||
    value === "gate-lab" ||
    value === "nitro-m4a"
  );
}

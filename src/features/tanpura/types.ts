export type TanpuraPitchId =
  | 'C'
  | 'C#'
  | 'D'
  | 'D#'
  | 'E'
  | 'F'
  | 'F#'
  | 'G'
  | 'G#'
  | 'A'
  | 'A#'
  | 'B';

export type TanpuraPresetId = 'sa-pa-sa' | 'sa-ma-sa' | 'sa-only';

export type TanpuraLabelMode = 'western' | 'indian';

export type TanpuraPreset = {
  id: TanpuraPresetId;
  label: string;
  /** Metro asset module id from require(). */
  source: number;
};

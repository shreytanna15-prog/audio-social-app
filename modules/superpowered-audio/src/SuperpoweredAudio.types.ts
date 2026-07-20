export type SuperpoweredProcessPreset =
  | 'speech-polish'
  | 'instrument-polish'
  | 'mixed-polish'
  | 'speech-clean'
  | 'instrument-clean'
  | 'mixed-clean';

export type SuperpoweredProcessOptions = {
  preset?: SuperpoweredProcessPreset;
  sampleRate?: number;
};

export type SuperpoweredProcessResult = {
  outputUri: string;
  strategy: string;
};

/** Spectral clean path (kept; Instrument Clean uses Superpowered polish instead). */
export type SpectralCleanProcessResult = {
  outputUri: string;
  strategy: string;
  /** Native summary: prop_decrease, peak_target, gain, duration_ms, … */
  params?: string;
};

export type SuperpoweredEffectsProcessResult = {
  outputUri: string;
  strategy: string;
};

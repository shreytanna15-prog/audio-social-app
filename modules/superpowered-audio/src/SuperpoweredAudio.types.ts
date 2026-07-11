export type SuperpoweredProcessPreset =
  | 'speech-polish'
  | 'instrument-polish'
  | 'mixed-polish';

export type SuperpoweredProcessOptions = {
  preset?: SuperpoweredProcessPreset;
  sampleRate?: number;
};

export type SuperpoweredProcessResult = {
  outputUri: string;
  strategy: string;
};

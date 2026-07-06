export const NOISE_SAMPLE_DURATION_SECONDS = 0.75;

/** Recording must be at least this long to sample noise from the start. */
export const MIN_RECORDING_SECONDS_FOR_NOISE_PROFILE = 1;

export const INSTRUMENT_DENOISE = {
  highpassHz: 50,
  afftdn: {
    nr: 10,
    noiseFloor: -50,
    gainSmooth: 18,
    adaptivity: 0.45,
    residualFloor: -42,
  },
  anlmdn: {
    strength: 0.0001,
    patchMs: 2,
    researchMs: 6,
    smooth: 11,
  },
} as const;

export const MIXED_DENOISE = {
  highpassHz: 60,
  afftdn: {
    nr: 10,
    noiseFloor: -50,
    gainSmooth: 17,
    adaptivity: 0.4,
    residualFloor: -42,
  },
} as const;

export type AfftdnDenoiseSettings = {
  nr: number;
  noiseFloor: number;
  gainSmooth: number;
  adaptivity: number;
  residualFloor: number;
};

/**
 * Adaptive noise-tracking spectral gate defaults (mirrors native SpectralGate_instrumentDefaults).
 * Followed by Superpowered instrument-clean polish in Instrument mode.
 */
export const SPECTRAL_INSTRUMENT_DEFAULTS = {
  propDecrease: 0.78,
  scaleFactor: 1.65,
  /** −1 dBFS */
  peakTarget: 0.89125094,
  maxMakeupGain: 4.0,
  hissStartHz: 3000,
  hissFullHz: 9000,
  hissPropDecrease: 0.93,
  hissScaleFactor: 0.6,
  riseAlpha: 0.002,
  transientThreshold: 2.5,
} as const;

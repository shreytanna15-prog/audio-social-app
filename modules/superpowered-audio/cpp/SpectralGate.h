#pragma once

#include <cstddef>

/**
 * Adaptive spectral interference soften for Instrument mode.
 * Continuously tracks noise floor per frequency bin via minimum statistics,
 * then applies a soft spectral mask with extra high-band hiss attenuation.
 * Followed by Superpowered light polish in JS.
 */
struct SpectralGateParams {
  float propDecrease;      // base reduction for bins below threshold (0..1)
  float scaleFactor;       // noise-threshold multiplier (higher = more protective)
  float noiseWindowSec;    // unused (adaptive tracking replaces static profiling)
  float peakTarget;        // ~0.89 (−1 dBFS)
  float maxMakeupGain;     // cap peak makeup
  float hissStartHz;       // begin ramping extra HF reduction (hiss band)
  float hissFullHz;        // full HF reduction above this
  float hissPropDecrease;  // propDecrease at/above hissFullHz (stronger on hiss)
  float hissScaleFactor;   // scaleFactor multiplier in hiss band (<1 = more aggressive)
  float riseAlpha;         // noise-estimate rise speed (0..1, smaller = slower adaptation)
  float transientThreshold;// spectral-flux multiplier for transient detection (0=disabled, ~2.5 typical)
};

struct SpectralGateStats {
  float propDecrease;
  float peakTarget;
  float peakGainApplied;
  float peakBefore;
  float peakAfter;
  float riseAlpha;
  float transientThreshold;
  unsigned int noiseProfileFrames;
  unsigned int transientCount;
};

SpectralGateParams SpectralGate_instrumentDefaults(void);
SpectralGateParams SpectralGate_mildDefaults(void);
SpectralGateParams SpectralGate_strongDefaults(void);

/** Resolve mild / current / strong (or null/unknown → current). */
SpectralGateParams SpectralGate_defaultsForIntensity(const char *intensity);

/**
 * In-place adaptive spectral gate + peak normalize.
 * Tracks noise floor per frequency bin frame-by-frame (minimum statistics),
 * then applies a soft spectral mask. Uses Superpowered FFTComplex for STFT/ISTFT.
 * Returns false on empty/invalid input. Optional statsOut filled on success.
 */
bool SpectralGate_processMonoInPlace(
  float *samples,
  size_t frameCount,
  unsigned int samplerate,
  const SpectralGateParams *params,
  SpectralGateStats *statsOut
);

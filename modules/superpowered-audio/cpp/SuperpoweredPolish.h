#pragma once

#ifdef __cplusplus
extern "C" {
#endif

/**
 * Initialize Superpowered once with a license key.
 * Returns 1 on success, 0 on failure.
 */
int SuperpoweredPolish_initialize(const char *licenseKey);

/** 1 if SuperpoweredPolish_initialize succeeded, else 0. */
int SuperpoweredPolish_isInitialized(void);

/**
 * Offline Clean polish (Voloco-style Phase 3):
 * decode → HPF → 7-band parametric EQ + hi-shelf → [speech] de-esser →
 * auto-threshold compressor → limiter → WAV.
 * preset: "speech-clean" | "instrument-clean" | "mixed-clean"
 *         (legacy: "*-polish")
 */
int SuperpoweredPolish_processFile(
  const char *inputPath,
  const char *outputWavPath,
  const char *preset
);

/** Human-readable last error (valid until next call). */
const char *SuperpoweredPolish_lastError(void);

#ifdef __cplusplus
}
#endif

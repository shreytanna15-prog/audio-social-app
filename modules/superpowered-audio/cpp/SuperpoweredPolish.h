#pragma once

#ifdef __cplusplus
extern "C" {
#endif

/**
 * Initialize Superpowered once with a license key.
 * Returns 1 on success, 0 on failure.
 */
int SuperpoweredPolish_initialize(const char *licenseKey);

/**
 * Offline polish: decode input → 3-band EQ → compressor → limiter → WAV.
 * Paths must be filesystem paths (no file:// prefix).
 * preset: "speech-polish" | "instrument-polish" | "mixed-polish"
 * Returns 0 on success, non-zero error code on failure.
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

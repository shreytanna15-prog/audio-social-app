#pragma once

#ifdef __cplusplus
extern "C" {
#endif

/**
 * Offline interference soften: decode → soft spectral mask → peak normalize → stereo WAV.
 * Instrument JS path runs Superpowered light polish after this.
 * Requires SuperpoweredPolish_initialize first.
 * Paths may include a file:// prefix.
 * @param intensity Optional: "mild" | "current" | "strong" (null/unknown → current).
 * Returns 0 on success, non-zero error code on failure.
 */
int SpectralClean_processFile(
  const char *inputPath,
  const char *outputWavPath,
  const char *intensity
);

/** Human-readable last error (valid until next SpectralClean call). */
const char *SpectralClean_lastError(void);

/**
 * Last successful run summary, e.g.
 * "strategy=interference-soften intensity=current prop_decrease=0.68 ..."
 * Valid until next SpectralClean_processFile call.
 */
const char *SpectralClean_lastStats(void);

#ifdef __cplusplus
}
#endif

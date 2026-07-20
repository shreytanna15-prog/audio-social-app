#pragma once

#ifdef __cplusplus
extern "C" {
#endif

/**
 * Offline interference soften: decode → soft spectral mask → peak normalize → stereo WAV.
 * Instrument JS path runs Superpowered light polish after this.
 * Requires SuperpoweredPolish_initialize first.
 * Paths may include a file:// prefix.
 * Returns 0 on success, non-zero error code on failure.
 */
int SpectralClean_processFile(const char *inputPath, const char *outputWavPath);

/** Human-readable last error (valid until next SpectralClean call). */
const char *SpectralClean_lastError(void);

/**
 * Last successful run summary, e.g.
 * "strategy=interference-soften prop_decrease=0.68 hiss_prop=0.90 hiss_hz=4000-9000 ..."
 * Valid until next SpectralClean_processFile call.
 */
const char *SpectralClean_lastStats(void);

#ifdef __cplusplus
}
#endif

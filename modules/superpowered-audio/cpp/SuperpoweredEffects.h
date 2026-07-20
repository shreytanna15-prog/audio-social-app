#pragma once

#ifdef __cplusplus
extern "C" {
#endif

/**
 * Offline editor effects chain (reverb / echo / modulate / enhance).
 * effectsJson: JSON array of { "id": "...", "params": { ... } }
 * Writes stereo WAV to outputWavPath.
 * Returns 0 on success.
 */
int SuperpoweredEffects_processFile(
  const char *inputPath,
  const char *outputWavPath,
  const char *effectsJson
);

const char *SuperpoweredEffects_lastError(void);

#ifdef __cplusplus
}
#endif

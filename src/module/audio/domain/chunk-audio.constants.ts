/** Target duration per chunk when splitting long recordings (within 2–3 s range). */
export const CHUNK_TARGET_SECONDS = 2.5;

export const CHUNK_MIN_SECONDS = 2;
export const CHUNK_MAX_SECONDS = 3;

/** Crossfade overlap when joining processed chunks (~50–100 ms). */
export const CHUNK_CROSSFADE_SECONDS = 0.08;

export const CHUNK_CROSSFADE_MIN_SECONDS = 0.05;
export const CHUNK_CROSSFADE_MAX_SECONDS = 0.1;

/** Clips shorter than this use a single FFmpeg pass (no split/concat). */
export const CHUNK_MIN_DURATION_FOR_CHUNKING = 3;

/** Recordings longer than this use single-pass for stability and speed. */
export const CHUNK_MAX_RECORDING_SECONDS = 120;

/** Upper bound on chunk count; chunk duration grows if needed to stay under this. */
export const CHUNK_MAX_CHUNK_COUNT = 24;

/** Relative to `documentDirectory`. */
export const CHUNK_TEMP_SUBPATH = 'temp/chunks';

export const CHUNK_WAV_SAMPLE_RATE = 48_000;
export const CHUNK_WAV_CHANNELS = 1;

/** Leading segment used to estimate noise floor (seconds). */
export const CHUNK_NOISE_SAMPLE_SECONDS = 0.25;

/** Peak at or above this → `medium` (loud performance). */
export const CHUNK_LOUD_PEAK_DB = -10;

/** RMS at or below this, with a high noise floor → `mild`. */
export const CHUNK_QUIET_RMS_DB = -36;

/** Noise floor at or above this (less negative = noisier room) → contributes to `mild`. */
export const CHUNK_HIGH_NOISE_FLOOR_DB = -40;

/** Noise reduction lowered by this amount for `mixed` vs `instrument` afftdn presets. */
export const CHUNK_MIXED_DENOISE_NR_REDUCTION = 2;

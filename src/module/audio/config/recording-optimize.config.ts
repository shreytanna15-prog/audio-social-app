/**
 * When true, chunked pipeline failures use legacy single-file afftdn instead of polish-only.
 * Off by default — polish-only is faster and avoids heavy denoise artifacts on phone mics.
 */
export const ENABLE_LEGACY_DENOISE_FALLBACK = false;

/** Clips shorter than this skip loudnorm in FFmpeg-only fallbacks. */
export const SHORT_CLIP_MAX_SECONDS = 3;

export function isShortClip(durationSeconds?: number): boolean {
  return (
    durationSeconds != null &&
    Number.isFinite(durationSeconds) &&
    durationSeconds > 0 &&
    durationSeconds < SHORT_CLIP_MAX_SECONDS
  );
}

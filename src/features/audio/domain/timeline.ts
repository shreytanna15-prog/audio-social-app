/** About 30s of timeline on a typical phone wave column. */
export const PX_PER_SECOND = 10;
/** Short clips still need enough pixels for bars to render. */
export const MIN_CLIP_PX = 40;
export const BAR_WIDTH_PX = 2;
export const BAR_GAP_PX = 2;
export const BAR_SLOT_PX = BAR_WIDTH_PX + BAR_GAP_PX;
const MAX_PEAK_BARS = 1000;

export function timelineContentWidth(
  durationSeconds: number,
  viewportWidth: number,
): number {
  return Math.max(viewportWidth, Math.max(0, durationSeconds) * PX_PER_SECOND);
}

export function clipOffsetPx(offsetMs: number): number {
  return Math.max(0, (offsetMs / 1000) * PX_PER_SECOND);
}

export function clipWidthPx(durationSeconds: number): number {
  return Math.max(MIN_CLIP_PX, Math.max(0, durationSeconds) * PX_PER_SECOND);
}

export function slotBarCount(clipWidth: number): number {
  if (clipWidth <= 0) {
    return 0;
  }

  return Math.max(1, Math.floor(clipWidth / BAR_SLOT_PX));
}

export function peakBarCountForDuration(durationSeconds: number): number {
  return Math.min(MAX_PEAK_BARS, Math.max(24, slotBarCount(clipWidthPx(durationSeconds))));
}

export function playheadX(currentTime: number): number {
  return Math.max(0, currentTime * PX_PER_SECOND);
}

export function secondsFromTimelineX(x: number, durationSeconds: number): number {
  const raw = x / PX_PER_SECOND;
  return Math.min(Math.max(raw, 0), Math.max(durationSeconds, 0));
}

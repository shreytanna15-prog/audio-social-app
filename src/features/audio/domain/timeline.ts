/** Seconds of project time visible in the wave column before scrolling. */
export const TIMELINE_WINDOW_SECONDS = 20;
export const RULER_MAJOR_SECONDS = 5;
/** Used when extracting peaks without a measured viewport. */
export const FALLBACK_PX_PER_SECOND = 12;
/** Short clips still need enough pixels for bars to render. */
export const MIN_CLIP_PX = 40;
export const BAR_WIDTH_PX = 2;
export const BAR_GAP_PX = 2;
export const BAR_SLOT_PX = BAR_WIDTH_PX + BAR_GAP_PX;
/** t=0 sits this far into the wave column so the pole is not flush with the header. */
export const TIMELINE_ORIGIN_RATIO = 0.1;
export const RULER_HEIGHT = 36;
const MAX_PEAK_BARS = 1000;

export function pxPerSecond(viewportWidth: number): number {
  if (viewportWidth <= 0) {
    return FALLBACK_PX_PER_SECOND;
  }

  return viewportWidth / TIMELINE_WINDOW_SECONDS;
}

export function timelineOriginPx(viewportWidth: number): number {
  return Math.round(Math.max(0, viewportWidth) * TIMELINE_ORIGIN_RATIO);
}

export function timelineContentWidth(
  durationSeconds: number,
  viewportWidth: number,
  pps = pxPerSecond(viewportWidth),
): number {
  const origin = timelineOriginPx(viewportWidth);
  return Math.max(viewportWidth, origin + Math.max(0, durationSeconds) * pps);
}

export function clipOffsetPx(offsetMs: number, originPx = 0, pps = FALLBACK_PX_PER_SECOND): number {
  return originPx + Math.max(0, (offsetMs / 1000) * pps);
}

export function clipWidthPx(durationSeconds: number, pps = FALLBACK_PX_PER_SECOND): number {
  return Math.max(MIN_CLIP_PX, Math.max(0, durationSeconds) * pps);
}

/** Exact time width — live overlay and punch-in joins must not use MIN_CLIP_PX. */
export function exactClipWidthPx(durationSeconds: number, pps = FALLBACK_PX_PER_SECOND): number {
  return Math.max(0, durationSeconds) * pps;
}

export function liveClipWidthPx(elapsedSeconds: number, pps = FALLBACK_PX_PER_SECOND): number {
  return Math.max(0, elapsedSeconds) * pps;
}

export function slotBarCount(clipWidth: number): number {
  if (clipWidth <= 0) {
    return 0;
  }

  return Math.max(1, Math.floor(clipWidth / BAR_SLOT_PX));
}

export function peakBarCountForDuration(durationSeconds: number): number {
  return Math.min(MAX_PEAK_BARS, Math.max(1, slotBarCount(clipWidthPx(durationSeconds))));
}

export function playheadX(
  currentTime: number,
  originPx = 0,
  pps = FALLBACK_PX_PER_SECOND,
): number {
  return originPx + Math.max(0, currentTime) * pps;
}

export function secondsFromTimelineX(
  x: number,
  durationSeconds: number,
  originPx = 0,
  pps = FALLBACK_PX_PER_SECOND,
): number {
  const raw = (x - originPx) / Math.max(1e-6, pps);
  return Math.min(Math.max(raw, 0), Math.max(durationSeconds, 0));
}

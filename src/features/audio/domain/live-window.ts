/** Visible time span across the shared waveform viewport (constant scale). */
export const LIVE_WINDOW_SECONDS = 30;

/** Grow from the left until this fraction of the window, then scroll (record/play follow). */
export const LIVE_WINDOW_FOLLOW_RATIO = 0.8;
export const LIVE_WINDOW_FOLLOW_LEAD_SECONDS =
  LIVE_WINDOW_SECONDS * LIVE_WINDOW_FOLLOW_RATIO;

/** Soft edge band for scrub/play autoscroll — not full playhead-follow. */
export const LIVE_WINDOW_EDGE_RATIO = 0.12;
export const LIVE_WINDOW_EDGE_SECONDS =
  LIVE_WINDOW_SECONDS * LIVE_WINDOW_EDGE_RATIO;

const TICK_COUNT = 6;
export const LIVE_WINDOW_MAJOR_SECONDS = 5;
export const LIVE_WINDOW_MINOR_SECONDS = 1;

export function formatLiveWindowTick(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const rem = safe % 60;
  return `${minutes}:${rem.toString().padStart(2, '0')}`;
}

export function buildLiveWindowTicks(
  windowStart: number,
  windowEnd: number,
  tickCount = TICK_COUNT,
): number[] {
  const span = Math.max(0.001, windowEnd - windowStart);
  return Array.from(
    { length: tickCount },
    (_, index) => windowStart + (index / (tickCount - 1)) * span,
  );
}

export type LiveWindowRulerMark = {
  at: number;
  major: boolean;
  /** 0–1 across the visible window */
  ratio: number;
};

/** Major/minor marks for a DAW-style ruler inside the live window. */
export function buildLiveWindowRulerMarks(
  windowStart: number,
  windowEnd: number,
): LiveWindowRulerMark[] {
  const start = Math.max(0, windowStart);
  const end = Math.max(start, windowEnd);
  const span = Math.max(0.001, end - start);
  const first =
    Math.ceil(start / LIVE_WINDOW_MINOR_SECONDS) * LIVE_WINDOW_MINOR_SECONDS;
  const marks: LiveWindowRulerMark[] = [];

  for (
    let t = first;
    t <= end + 1e-6;
    t += LIVE_WINDOW_MINOR_SECONDS
  ) {
    const at = Math.round(t);
    if (at < start - 1e-6 || at > end + 1e-6) {
      continue;
    }
    marks.push({
      at,
      major: at % LIVE_WINDOW_MAJOR_SECONDS === 0,
      ratio: (at - start) / span,
    });
  }

  return marks;
}

export function maxLiveWindowStart(durationSeconds: number): number {
  return Math.max(0, durationSeconds - LIVE_WINDOW_SECONDS);
}

export function clampLiveWindowStart(
  start: number,
  durationSeconds: number,
): number {
  return Math.max(0, Math.min(start, maxLiveWindowStart(durationSeconds)));
}

/** Record / first-take: keep head near 80% once past the lead. */
export function followLiveWindowStart(playheadSeconds: number): number {
  const playhead = Math.max(0, playheadSeconds);
  if (playhead < LIVE_WINDOW_FOLLOW_LEAD_SECONDS) {
    return 0;
  }
  return playhead - LIVE_WINDOW_FOLLOW_LEAD_SECONDS;
}

/**
 * Keep the playhead inside the viewport; only nudge when it hits an edge.
 * Does not continuously re-center — scrub stays still until the edge.
 */
export function edgeEnsureLiveWindowStart(
  playheadSeconds: number,
  windowStart: number,
  durationSeconds: number,
): number {
  const playhead = Math.max(0, playheadSeconds);
  const windowEnd = windowStart + LIVE_WINDOW_SECONDS;
  let next = windowStart;

  if (playhead < windowStart + LIVE_WINDOW_EDGE_SECONDS) {
    next = playhead - LIVE_WINDOW_EDGE_SECONDS;
  } else if (playhead > windowEnd - LIVE_WINDOW_EDGE_SECONDS) {
    next = playhead - (LIVE_WINDOW_SECONDS - LIVE_WINDOW_EDGE_SECONDS);
  }

  return clampLiveWindowStart(next, durationSeconds);
}

export function playheadLeftInLiveWindow(
  playheadSeconds: number,
  windowStart: number,
  viewportWidth: number,
  knobOffsetPx = 6,
): number {
  if (viewportWidth <= 0) {
    return 0;
  }
  const pps = viewportWidth / LIVE_WINDOW_SECONDS;
  return Math.max(0, (playheadSeconds - windowStart) * pps - knobOffsetPx);
}

export function liveWindowPxPerSecond(viewportWidth: number): number {
  if (viewportWidth <= 0) {
    return 0;
  }
  return viewportWidth / LIVE_WINDOW_SECONDS;
}

export type ClipFrameInWindow = {
  /** Pixel left of the clip inside the viewport (may be negative if cropped). */
  leftPx: number;
  /** Full uncropped clip width in px. */
  widthPx: number;
  /** Visible left clamped to [0, viewportWidth]. */
  visibleLeftPx: number;
  /** Visible width after cropping to the viewport. */
  visibleWidthPx: number;
  /** Whether any of the clip intersects the window. */
  visible: boolean;
};

/**
 * Layout a layer clip (offset + duration) inside the shared live window.
 * Empty lead-in before offset is just unused space — no silence audio.
 */
export function clipFrameInWindow(
  offsetSeconds: number,
  durationSeconds: number,
  windowStart: number,
  viewportWidth: number,
): ClipFrameInWindow {
  const pps = liveWindowPxPerSecond(viewportWidth);
  if (pps <= 0 || durationSeconds <= 0) {
    return {
      leftPx: 0,
      widthPx: 0,
      visibleLeftPx: 0,
      visibleWidthPx: 0,
      visible: false,
    };
  }

  const leftPx = (Math.max(0, offsetSeconds) - windowStart) * pps;
  const widthPx = Math.max(0, durationSeconds) * pps;
  const visibleLeftPx = Math.max(0, leftPx);
  const visibleRightPx = Math.min(viewportWidth, leftPx + widthPx);
  const visibleWidthPx = Math.max(0, visibleRightPx - visibleLeftPx);

  return {
    leftPx,
    widthPx,
    visibleLeftPx,
    visibleWidthPx,
    visible: visibleWidthPx > 1,
  };
}

/** Map a viewport X to absolute timeline seconds for the current window. */
export function secondsFromLiveWindowX(
  x: number,
  windowStart: number,
  viewportWidth: number,
  durationSeconds: number,
): number {
  if (viewportWidth <= 0) {
    return 0;
  }
  const raw = windowStart + (x / viewportWidth) * LIVE_WINDOW_SECONDS;
  return Math.max(0, Math.min(raw, Math.max(0, durationSeconds)));
}

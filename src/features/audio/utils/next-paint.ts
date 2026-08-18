/** Two frames plus a macrotask, so the commit has time to reach the screen. */
const PAINT_SETTLE_MS = 64;

/**
 * Waits until a state change has had a chance to be painted.
 *
 * Audio staging blocks the JS thread for seconds, so kicking it off in the same
 * tick that flips a spinner on means the spinner only appears once the work is
 * already done — the button looks dead and the tap looks ignored.
 */
export function afterNextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(resolve, PAINT_SETTLE_MS);
      });
    });
  });
}

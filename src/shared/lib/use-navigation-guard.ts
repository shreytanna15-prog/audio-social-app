import { useCallback, useRef } from 'react';

/**
 * Guards tap-triggered actions (navigation, submits) against rapid repeat
 * presses. Returns a `guard` wrapper: call it instead of invoking the action
 * directly, e.g. `onPress={() => guard(() => router.push('/x'))}`.
 *
 * The first call runs immediately; subsequent calls within `ms` are dropped.
 * The busy flag resets after `ms` so the next intentional press works.
 */
export function useNavigationGuard(ms = 400) {
  const busy = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const guard = useCallback(
    (fn: () => void) => {
      if (busy.current) {
        return;
      }
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
      busy.current = true;
      fn();
      timer.current = setTimeout(() => {
        busy.current = false;
        timer.current = null;
      }, ms);
    },
    [ms]
  );

  return { guard };
}

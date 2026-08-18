import { useEffect, useState } from 'react';

import { recordingSessionService } from '@/features/audio/services/recording-session.service';

/**
 * Elapsed capture time for tiny Rec-only UI (clock, playhead, live clip).
 * Must never live in a component that also renders stored waveforms — a 10 Hz
 * setState there queues Stop behind hundreds of bars.
 */
export function useCaptureElapsed(active: boolean): number {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active) {
      setElapsed(0);
      return;
    }

    const tick = () => {
      setElapsed(recordingSessionService.getTick().durationMillis / 1000);
    };
    tick();
    const interval = setInterval(tick, 100);
    return () => clearInterval(interval);
  }, [active]);

  return active ? elapsed : 0;
}

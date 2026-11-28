import { useEffect, useState } from 'react';

const INTERVAL_MS = 30_000;

let sharedNow = new Date();
const listeners = new Set<() => void>();
let intervalId: ReturnType<typeof setInterval> | null = null;

function ensureTicker() {
  if (intervalId != null) return;
  intervalId = setInterval(() => {
    sharedNow = new Date();
    listeners.forEach((listener) => listener());
  }, INTERVAL_MS);
}

function stopTickerIfIdle() {
  if (listeners.size > 0 || intervalId == null) return;
  clearInterval(intervalId);
  intervalId = null;
}

/** Shared ticker so list cards do not each open their own interval. */
export function useCountdownNow() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick((n) => n + 1);
    listeners.add(listener);
    ensureTicker();
    return () => {
      listeners.delete(listener);
      stopTickerIfIdle();
    };
  }, []);

  return sharedNow;
}

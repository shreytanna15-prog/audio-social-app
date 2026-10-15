/** Formats seconds as `mm:ss.d` for the Quick Record clock. */
export function formatQuickRecordTimer(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds || 0);
  const minutes = Math.floor(safe / 60);
  const seconds = Math.floor(safe % 60);
  const tenths = Math.floor((safe % 1) * 10);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${tenths}`;
}

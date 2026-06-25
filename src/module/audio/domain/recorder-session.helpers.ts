import type { RecorderStatus } from '@/module/audio/types/recorder';

export const METERING_BAR_COUNT = 20;

export const INITIAL_METERING_BARS = Array<number>(METERING_BAR_COUNT).fill(0.15);

export type RecorderTick = {
  metering?: number;
  durationMillis: number;
};

export function normalizeMetering(metering?: number): number {
  if (metering == null) return 0.15;
  const clamped = Math.max(-60, Math.min(0, metering));
  return (clamped + 60) / 60;
}

export function deriveStatus(
  hasActiveSession: boolean,
  isPaused: boolean,
  previewUri: string | null,
): RecorderStatus {
  if (hasActiveSession) {
    return isPaused ? 'paused' : 'recording';
  }

  if (previewUri) {
    return 'preview';
  }

  return 'idle';
}

type SyncSessionState = {
  status: RecorderStatus;
  hasActiveSession: boolean;
  isPaused: boolean;
  previewUri: string | null;
  meteringBars: number[];
};

export function buildRecorderSyncPatch(
  recorderState: RecorderTick,
  session: SyncSessionState,
  frozenDurationMillis: number,
): {
  timerSeconds: number;
  meteringBars: number[];
  status: RecorderStatus;
} {
  const { status, hasActiveSession, isPaused, previewUri, meteringBars } = session;

  let nextMeteringBars = meteringBars;
  if (hasActiveSession && !isPaused) {
    nextMeteringBars = [...meteringBars.slice(1), normalizeMetering(recorderState.metering)];
  }

  const timerSeconds = hasActiveSession
    ? Math.floor(recorderState.durationMillis / 1000)
    : status === 'optimizing' || previewUri
      ? Math.floor(frozenDurationMillis / 1000)
      : 0;

  return {
    timerSeconds,
    meteringBars: nextMeteringBars,
    status:
      status === 'optimizing'
        ? 'optimizing'
        : deriveStatus(hasActiveSession, isPaused, previewUri),
  };
}

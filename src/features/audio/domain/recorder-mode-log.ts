import type { RecordingMode } from '@/features/audio/types/recording-mode';

function optionSuffix(mode?: RecordingMode | string | null): string {
  if (mode === 'raw') {
    return ' OptionA';
  }

  if (mode === 'gate-lab') {
    return ' GateLab';
  }

  if (mode === 'swm-wav') {
    return ' CaptureSWM';
  }

  if (mode === 'nitro-m4a') {
    return ' CaptureNitro';
  }

  return '';
}

/** One-liner bake-off logs: [Recorded] / [Save] / [Play] — always WARN so Metro shows them. */
export function logRecorderMode(
  tag: 'Recorded' | 'Save' | 'Play',
  mode?: RecordingMode | string | null,
): void {
  const resolved = mode ?? 'unknown';
  console.warn(`[${tag}] mode='${resolved}'${optionSuffix(resolved)}`);
}

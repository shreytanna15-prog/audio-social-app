import type { RecordingMode } from '@/module/audio/types/recording-mode';

export type OptimizeOverlayCopy = {
  title: string;
  subtitle: string;
};

const ON_DEVICE_ENHANCING: OptimizeOverlayCopy = {
  title: 'Enhancing on your device…',
  subtitle: 'Polishing your recording. This stays on your phone.',
};

/** Overlay copy while post-record enhance runs (all modes use on-device polish). */
export function getOptimizeOverlayCopy(
  _mode?: RecordingMode | null,
): OptimizeOverlayCopy {
  return ON_DEVICE_ENHANCING;
}

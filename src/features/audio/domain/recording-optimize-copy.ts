import type { RecordingMode } from '@/features/audio/types/recording-mode';

export type OptimizeOverlayCopy = {
  title: string;
  subtitle: string;
};

const ON_DEVICE_ENHANCING: OptimizeOverlayCopy = {
  title: 'Enhancing on your device…',
  subtitle: 'Polishing your recording. This stays on your phone.',
};

const INSTRUMENT_CLEAN: OptimizeOverlayCopy = {
  title: 'Cleaning instrument recording…',
  subtitle: 'Reducing hiss and background interference, then light polish on your device.',
};

const RAW_PASSTHROUGH: OptimizeOverlayCopy = {
  title: 'Saving raw recording…',
  subtitle: 'No enhance — original expo-audio capture only.',
};

/** Overlay copy while post-record enhance runs (raw skips the pipeline). */
export function getOptimizeOverlayCopy(
  mode?: RecordingMode | null,
): OptimizeOverlayCopy {
  if (mode === 'raw') {
    return RAW_PASSTHROUGH;
  }

  if (mode === 'instrument') {
    return INSTRUMENT_CLEAN;
  }

  // instrument-3 shows generic enhancing copy (no hint it's unprocessed)
  return ON_DEVICE_ENHANCING;
}

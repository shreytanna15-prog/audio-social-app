import type { RecordingMode } from '@/module/audio/types/recording-mode';

type OptimizeOverlayCopy = {
  title: string;
  subtitle: string;
};

const ON_DEVICE_OPTIMIZE_COPY: OptimizeOverlayCopy = {
  title: 'Optimizing…',
  subtitle: 'Enhancing your recording on this device…',
};

const OPTIMIZE_OVERLAY_COPY: Record<RecordingMode, OptimizeOverlayCopy> = {
  speech: {
    title: 'Optimizing your recording',
    subtitle: 'Cleaning background noise and enhancing voice…',
  },
  instrument: ON_DEVICE_OPTIMIZE_COPY,
  mixed: ON_DEVICE_OPTIMIZE_COPY,
};

export function getOptimizeOverlayCopy(mode: RecordingMode | null): OptimizeOverlayCopy {
  if (mode == null) {
    return OPTIMIZE_OVERLAY_COPY.speech;
  }

  return OPTIMIZE_OVERLAY_COPY[mode];
}

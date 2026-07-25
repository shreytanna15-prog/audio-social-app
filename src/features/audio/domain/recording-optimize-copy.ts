import {
  isPassthroughCaptureMode,
  type RecordingMode,
} from '@/features/audio/types/recording-mode';

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
  subtitle: 'Light polish on your device — tone and level stay close to the original.',
};

const SPECTRAL_GATE_DENOISE: OptimizeOverlayCopy = {
  title: 'Denoising capture…',
  subtitle: 'SpectralGate denoise on your device — stays on your phone.',
};

const LAB_PASSTHROUGH: OptimizeOverlayCopy = {
  title: 'Saving capture…',
  subtitle: 'No auto enhance — try SpectralGate, Clean pipelines, or effects in the editor.',
};

/** Overlay copy while post-record enhance runs (capture modes skip the pipeline). */
export function getOptimizeOverlayCopy(
  mode?: RecordingMode | null,
): OptimizeOverlayCopy {
  if (isPassthroughCaptureMode(mode)) {
    return LAB_PASSTHROUGH;
  }

  if (mode === 'raw') {
    return SPECTRAL_GATE_DENOISE;
  }

  if (mode === 'instrument') {
    return INSTRUMENT_CLEAN;
  }

  return ON_DEVICE_ENHANCING;
}

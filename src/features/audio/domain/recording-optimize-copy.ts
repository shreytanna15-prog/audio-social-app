const ON_DEVICE_CLEANING = {
  title: 'Cleaning noise…',
  subtitle: 'Soft SpectralGate on your device — stays on your phone.',
};

/** Overlay copy while soft-gate staging runs after record or import. */
export function getOptimizeOverlayCopy(): {
  title: string;
  subtitle: string;
} {
  return ON_DEVICE_CLEANING;
}

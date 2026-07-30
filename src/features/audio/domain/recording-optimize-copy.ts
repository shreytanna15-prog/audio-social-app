const ON_DEVICE_CLEANING = {
  title: 'Processing…',
};

/** Overlay copy while soft-gate staging runs after record or import. */
export function getOptimizeOverlayCopy(): {
  title: string;
} {
  return ON_DEVICE_CLEANING;
}

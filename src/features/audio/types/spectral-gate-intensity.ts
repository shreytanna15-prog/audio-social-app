export const SPECTRAL_GATE_INTENSITIES = [
  {
    id: 'mild',
    label: 'Mild',
    icon: {
      ios: 'speaker.wave.1',
      android: 'volume_down',
      web: 'volume_down',
    },
  },
  {
    id: 'current',
    label: 'Current',
    icon: {
      ios: 'speaker.wave.2',
      android: 'volume_up',
      web: 'volume_up',
    },
  },
  {
    id: 'strong',
    label: 'Strong',
    icon: {
      ios: 'speaker.wave.3',
      android: 'campaign',
      web: 'campaign',
    },
  },
] as const;

export type SpectralGateIntensityId =
  (typeof SPECTRAL_GATE_INTENSITIES)[number]['id'];

export function getSpectralGateIntensityLabel(
  id: SpectralGateIntensityId,
): string {
  const intensity = SPECTRAL_GATE_INTENSITIES.find((item) => item.id === id);
  if (!intensity) {
    throw new Error(`Unknown SpectralGate intensity: ${id}`);
  }
  return intensity.label;
}

export function getSpectralGateIntensityProcessingLabel(
  id: SpectralGateIntensityId,
): string {
  return `Applying ${getSpectralGateIntensityLabel(id)} SpectralGate…`;
}

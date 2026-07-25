export const OPTIMIZE_PIPELINES = [
  {
    id: 'speech',
    label: 'Speech Clean',
    icon: {
      ios: 'waveform',
      android: 'record_voice_over',
      web: 'record_voice_over',
    },
  },
  {
    id: 'instrument',
    label: 'Instrument Clean',
    icon: {
      ios: 'music.note',
      android: 'music_note',
      web: 'music_note',
    },
  },
  {
    id: 'mixed',
    label: 'Mixed Clean',
    icon: {
      ios: 'person.wave.2',
      android: 'interpreter_mode',
      web: 'interpreter_mode',
    },
  },
] as const;

export type OptimizePipelineId = (typeof OPTIMIZE_PIPELINES)[number]['id'];

export function getOptimizePipelineLabel(id: OptimizePipelineId): string {
  const pipeline = OPTIMIZE_PIPELINES.find((item) => item.id === id);
  if (!pipeline) {
    throw new Error(`Unknown optimize pipeline: ${id}`);
  }
  return pipeline.label;
}

export function getOptimizePipelineProcessingLabel(id: OptimizePipelineId): string {
  return `Applying ${getOptimizePipelineLabel(id)}…`;
}

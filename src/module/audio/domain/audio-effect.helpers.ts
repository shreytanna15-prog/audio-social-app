import { AUDIO_EFFECTS, type AudioEffectId } from '@/module/audio/types/effects';

export function getEffectLabel(effectId: AudioEffectId): string {
  const effect = AUDIO_EFFECTS.find((item) => item.id === effectId);

  if (!effect) {
    throw new Error(`Unknown audio effect: ${effectId}`);
  }

  return effect.label;
}

export function getEffectProcessingLabel(effectId: AudioEffectId): string {
  const labels: Record<AudioEffectId, string> = {
    enhance: 'Enhancing audio…',
    denoise: 'Applying denoise…',
    reverb: 'Applying reverb…',
    echo: 'Applying echo…',
    modulate: 'Applying modulation…',
  };

  return labels[effectId];
}

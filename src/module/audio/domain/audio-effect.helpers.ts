import { AUDIO_EFFECTS, type AudioEffectId } from '@/module/audio/types/effects';
import { EFFECT_APPLICATION_ORDER } from '@/module/audio/domain/audio-effect-filters';

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

export function getAppliedEffectsLabel(effectIds: AudioEffectId[]): string | null {
  if (effectIds.length === 0) {
    return null;
  }

  const orderedIds = EFFECT_APPLICATION_ORDER.filter((id) => effectIds.includes(id));

  return orderedIds.map((id) => getEffectLabel(id)).join(' + ');
}

export function getEffectsProcessingLabel(effectIds: AudioEffectId[]): string {
  if (effectIds.length === 0) {
    return 'Resetting effects…';
  }

  if (effectIds.length === 1) {
    return getEffectProcessingLabel(effectIds[0]);
  }

  return `Applying ${effectIds.length} effects…`;
}

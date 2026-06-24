import { AUDIO_EFFECTS, type AudioEffectId } from '@/module/audio/types/effects';
import { EFFECT_APPLICATION_ORDER } from '@/module/audio/domain/effect-definitions';
import type { AppliedEffect } from '@/module/audio/types/applied-effects';

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
    denoise: 'Cleaning background noise…',
    reverb: 'Applying reverb…',
    echo: 'Applying echo…',
    modulate: 'Applying modulation…',
  };

  return labels[effectId];
}

export function getAppliedEffectsLabel(appliedEffects: AppliedEffect[]): string | null {
  if (appliedEffects.length === 0) {
    return null;
  }

  const orderedEffects = EFFECT_APPLICATION_ORDER.flatMap((effectId) => {
    const applied = appliedEffects.find((effect) => effect.id === effectId);

    if (!applied) {
      return [];
    }

    return [applied];
  });

  return orderedEffects.map((effect) => getEffectLabel(effect.id)).join(' + ');
}

export function getEffectsProcessingLabel(appliedEffects: AppliedEffect[]): string {
  if (appliedEffects.length === 0) {
    return 'Resetting effects…';
  }

  if (appliedEffects.length === 1) {
    return getEffectProcessingLabel(appliedEffects[0].id);
  }

  return `Applying ${appliedEffects.length} effects…`;
}

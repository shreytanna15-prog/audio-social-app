import {
  EFFECT_APPLICATION_ORDER,
  getDefaultEffectParams,
} from '@/module/audio/domain/effect-definitions';
import { buildEffectAudioFilter } from '@/module/audio/domain/effect-filter-builders';
import type { AppliedEffect } from '@/module/audio/types/applied-effects';
import type { AudioEffectId } from '@/module/audio/types/effects';

export { EFFECT_APPLICATION_ORDER };

export function getCombinedAudioEffectFilter(appliedEffects: AppliedEffect[]): string {
  const orderedEffects = EFFECT_APPLICATION_ORDER.flatMap((effectId) => {
    const applied = appliedEffects.find((effect) => effect.id === effectId);

    if (!applied) {
      return [];
    }

    return [applied];
  });

  const filters = orderedEffects
    .map((effect) =>
      buildEffectAudioFilter(effect.id, effect.params ?? getDefaultEffectParams(effect.id)),
    )
    .join(',');

  if (!filters) {
    return filters;
  }

  return `${filters},alimiter=limit=0.95:level=false`;
}

export function getAppliedEffectIds(appliedEffects: AppliedEffect[]): AudioEffectId[] {
  return appliedEffects.map((effect) => effect.id);
}

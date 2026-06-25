import {
  EFFECT_APPLICATION_ORDER,
  getDefaultEffectParams,
} from '@/module/audio/domain/effect-definitions';
import {
  buildEffectAudioFilter,
  type DenoiseStrategy,
} from '@/module/audio/domain/effect-filter-builders';
import type { AppliedEffect } from '@/module/audio/types/applied-effects';
import type { AudioEffectId } from '@/module/audio/types/effects';

export { EFFECT_APPLICATION_ORDER };

type CombinedAudioEffectFilterOptions = {
  denoiseStrategy?: DenoiseStrategy;
  arnndnModelPath?: string | null;
};

export function getCombinedAudioEffectFilter(
  appliedEffects: AppliedEffect[],
  options: CombinedAudioEffectFilterOptions = {},
): string {
  const orderedEffects = EFFECT_APPLICATION_ORDER.flatMap((effectId) => {
    const applied = appliedEffects.find((effect) => effect.id === effectId);

    if (!applied) {
      return [];
    }

    return [applied];
  });

  const hasDenoise = orderedEffects.some((effect) => effect.id === 'denoise');
  const denoiseOptions =
    options.denoiseStrategy || options.arnndnModelPath
      ? {
          strategy: options.denoiseStrategy,
          arnndnModelPath: options.arnndnModelPath,
        }
      : undefined;

  const filters = orderedEffects
    .map((effect) =>
      buildEffectAudioFilter(
        effect.id,
        effect.params ?? getDefaultEffectParams(effect.id),
        effect.id === 'denoise' ? denoiseOptions : undefined,
      ),
    )
    .join(',');

  if (!filters) {
    return filters;
  }

  // Skip the final limiter while denoising so cleanup quality is easier to judge.
  if (hasDenoise) {
    return filters;
  }

  return `${filters},alimiter=limit=0.95:level=false`;
}

export function getAppliedEffectIds(appliedEffects: AppliedEffect[]): AudioEffectId[] {
  return appliedEffects.map((effect) => effect.id);
}

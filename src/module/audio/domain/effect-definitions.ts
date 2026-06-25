import type { AppliedEffect, EffectParamValues } from '@/module/audio/types/applied-effects';
import type { AudioEffectId } from '@/module/audio/types/effects';

export type EffectParamSlider = {
  kind: 'slider';
  id: string;
  label: string;
  description?: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unit?: string;
  /** Plain-language label shown instead of the raw number (e.g. 3 → "Medium"). */
  valueLabels?: Record<number, string>;
};

export type EffectParamSelect = {
  kind: 'select';
  id: string;
  label: string;
  description?: string;
  options: { value: string; label: string; description?: string }[];
  defaultValue: string;
};

export type EffectParamSegmented = {
  kind: 'segmented';
  id: string;
  label: string;
  description?: string;
  options: { value: string; label: string }[];
  defaultValue: string;
};

export type EffectParamDefinition =
  | EffectParamSlider
  | EffectParamSelect
  | EffectParamSegmented;

export type EffectDefinition = {
  id: AudioEffectId;
  label: string;
  description: string;
  hasSettingsDrawer: boolean;
  params: EffectParamDefinition[];
};

export const EFFECT_DEFINITIONS: Record<AudioEffectId, EffectDefinition> = {
  denoise: {
    id: 'denoise',
    label: 'Denoise',
    description: '',
    hasSettingsDrawer: true,
    params: [
      {
        kind: 'segmented',
        id: 'strength',
        label: 'How strong should cleanup be?',
        options: [
          { value: 'light', label: 'Light' },
          { value: 'medium', label: 'Medium' },
          { value: 'strong', label: 'Strong' },
        ],
        defaultValue: 'medium',
      },
    ],
  },
  enhance: {
    id: 'enhance',
    label: 'Enhance',
    description: 'Extra polish on top of your optimized recording — presence and punch.',
    hasSettingsDrawer: true,
    params: [
      {
        kind: 'slider',
        id: 'strength',
        label: 'Enhancement strength',
        description: 'How much extra processing to add on top of the auto-optimized baseline.',
        min: 1,
        max: 3,
        step: 1,
        defaultValue: 2,
        valueLabels: {
          1: 'Light',
          2: 'Medium',
          3: 'Strong',
        },
      },
      {
        kind: 'slider',
        id: 'clarity',
        label: 'Voice clarity',
        description: 'Boost presence in the upper mids for a clearer, closer sound.',
        min: 0,
        max: 100,
        step: 5,
        defaultValue: 50,
        unit: '%',
      },
    ],
  },
  reverb: {
    id: 'reverb',
    label: 'Reverb',
    description: 'Add room ambience on top of your recording — subtle space, not a repeating echo.',
    hasSettingsDrawer: true,
    params: [
      {
        kind: 'slider',
        id: 'roomSize',
        label: 'Room size',
        description: 'Tighter spaces sound like a booth; larger spaces feel more open.',
        min: 1,
        max: 3,
        step: 1,
        defaultValue: 2,
        valueLabels: {
          1: 'Tight',
          2: 'Room',
          3: 'Hall',
        },
      },
      {
        kind: 'slider',
        id: 'amount',
        label: 'Reverb amount',
        description: 'How much room ambience is mixed in. Echo is a separate effect for distinct repeats.',
        min: 0,
        max: 100,
        step: 5,
        defaultValue: 50,
        unit: '%',
      },
    ],
  },
  echo: {
    id: 'echo',
    label: 'Echo',
    description: 'Adds a delayed repeat of your voice — not room ambience (use Reverb for that).',
    hasSettingsDrawer: true,
    params: [
      {
        kind: 'slider',
        id: 'delay',
        label: 'Echo delay',
        description: 'How long after you speak the repeat is heard.',
        min: 1,
        max: 3,
        step: 1,
        defaultValue: 2,
        valueLabels: {
          1: 'Quick',
          2: 'Classic',
          3: 'Long',
        },
      },
      {
        kind: 'slider',
        id: 'intensity',
        label: 'Echo intensity',
        description: 'How loud the delayed repeat is compared to your voice.',
        min: 0,
        max: 100,
        step: 5,
        defaultValue: 50,
        unit: '%',
      },
    ],
  },
  modulate: {
    id: 'modulate',
    label: 'Modulate',
    description: 'Add rhythmic wobble to your voice — volume and pitch movement, not cleanup or space.',
    hasSettingsDrawer: true,
    params: [
      {
        kind: 'slider',
        id: 'speed',
        label: 'Wobble speed',
        description: 'How fast the volume and pitch movement cycles.',
        min: 1,
        max: 3,
        step: 1,
        defaultValue: 2,
        valueLabels: {
          1: 'Slow',
          2: 'Medium',
          3: 'Fast',
        },
      },
    ],
  },
};

export const EFFECT_APPLICATION_ORDER: AudioEffectId[] = [
  'denoise',
  'reverb',
  'echo',
  'modulate',
  'enhance',
];

export function getEffectDefinition(effectId: AudioEffectId): EffectDefinition {
  return EFFECT_DEFINITIONS[effectId];
}

export function effectHasSettingsDrawer(effectId: AudioEffectId): boolean {
  return EFFECT_DEFINITIONS[effectId].hasSettingsDrawer;
}

export function getDefaultEffectParams(effectId: AudioEffectId): EffectParamValues {
  const definition = getEffectDefinition(effectId);
  const params: EffectParamValues = {};

  for (const param of definition.params) {
    params[param.id] = param.defaultValue;
  }

  return params;
}

export function createAppliedEffect(
  effectId: AudioEffectId,
  params: EffectParamValues = getDefaultEffectParams(effectId),
): AppliedEffect {
  return { id: effectId, params };
}

export function normalizeAppliedEffects(
  effects?: AudioEffectId[] | AppliedEffect[] | string[],
): AppliedEffect[] {
  if (!effects || effects.length === 0) {
    return [];
  }

  const first = effects[0];

  if (typeof first === 'string') {
    return (effects as AudioEffectId[]).map((id) => createAppliedEffect(id));
  }

  return effects as AppliedEffect[];
}
